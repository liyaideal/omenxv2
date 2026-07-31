// optimize-event-art — one-shot backfill that converts legacy 1.5 MB PNG event
// art into ~60 KB card JPEGs and fills events.image_blur.
//
// POST { limit?: number, delete_png?: boolean }
//   - walks the event-art bucket for *.png (skips the _ref/ sheet)
//   - crop 21:9 -> downscale 840px -> JPEG q78 -> upload `${id}.jpg`
//   - re-signs and writes events.image_url + events.image_blur
//   - optionally removes the old PNG (default: true)
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ART_BUCKET,
  ART_CONTENT_TYPE,
  ART_EXT,
  ART_SIGNED_URL_TTL,
} from "../_shared/event-art.ts";
import { toCardArt } from "../_shared/event-art-image.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const limit = Math.min(Math.max(Number(body.limit) || 40, 1), 200);
  const deletePng = body.delete_png !== false;

  const { data: objects, error: listErr } = await supabase.storage
    .from(ART_BUCKET)
    .list("", { limit: 500 });
  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pngs = (objects ?? [])
    .filter((o) => o.name.endsWith(".png"))
    .slice(0, limit);

  const converted: Array<{ id: string; before: number; after: number }> = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (const obj of pngs) {
    const eventId = obj.name.replace(/\.png$/, "");
    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(ART_BUCKET)
        .download(obj.name);
      if (dlErr || !blob) throw new Error(`download: ${dlErr?.message}`);

      const raw = new Uint8Array(await blob.arrayBuffer());
      const { jpeg, blurDataUrl } = await toCardArt(raw);
      const path = `${eventId}.${ART_EXT}`;

      const { error: upErr } = await supabase.storage
        .from(ART_BUCKET)
        .upload(path, jpeg, {
          contentType: ART_CONTENT_TYPE,
          upsert: true,
          cacheControl: "31536000",
        });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { data: signed, error: signErr } = await supabase.storage
        .from(ART_BUCKET)
        .createSignedUrl(path, ART_SIGNED_URL_TTL);
      if (signErr || !signed?.signedUrl) throw new Error(`sign: ${signErr?.message}`);

      // Any event still pointing at the old PNG (daily tickers reuse art) moves
      // to the new JPEG URL in one shot.
      const { error: writeErr } = await supabase
        .from("events")
        .update({ image_url: signed.signedUrl, image_blur: blurDataUrl })
        .like("image_url", `%/${obj.name}?%`);
      if (writeErr) throw new Error(`write: ${writeErr.message}`);

      if (deletePng) {
        await supabase.storage.from(ART_BUCKET).remove([obj.name]);
      }

      converted.push({ id: eventId, before: raw.length, after: jpeg.length });
    } catch (e) {
      errors.push({ name: obj.name, error: (e as Error).message });
    }
  }

  const before = converted.reduce((s, c) => s + c.before, 0);
  const after = converted.reduce((s, c) => s + c.after, 0);

  return new Response(
    JSON.stringify({
      success: true,
      count: converted.length,
      before_kb: Math.round(before / 1024),
      after_kb: Math.round(after / 1024),
      converted,
      errors,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
