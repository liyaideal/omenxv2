// generate-event-image — IP-mascot cover art for newly listed events.
//
// POST { event_id?: string, event_ids?: string[], limit?: number, force?: boolean }
//   - no ids  -> picks up to `limit` (default 10) live events with image_url IS NULL
//   - force   -> regenerates even when image_url is already set
//
// Pipeline per event: title -> prop clause (text model) -> locked style prompt
// + IP reference image -> image model -> upload to the event-art bucket ->
// long-lived signed URL written back to events.image_url.
//
// Failures never throw: they are collected per event so a bad image can never
// block a listing (the card falls back to the category image).
import { createClient } from "npm:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import {
  ART_BUCKET,
  ART_REFERENCE_PATH,
  ART_SIGNED_URL_TTL,
  ART_ASPECT,
  IMAGE_MODEL,
  PROP_SYSTEM_PROMPT,
  TEXT_MODEL,
  buildImagePrompt,
  pickAccent,
} from "../_shared/event-art.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Card tiles are a wide strip; a near-square render would be hard-cropped by
 * `background-size: cover`. When the model ignores the 21:9 instruction we
 * centre-crop to the target aspect ourselves so the card never sees a square.
 */
async function enforceAspect(bin: Uint8Array): Promise<Uint8Array> {
  try {
    const img = await Image.decode(bin);
    const ratio = img.width / img.height;
    if (ratio >= ART_ASPECT - 0.15) return bin;
    const cropH = Math.max(1, Math.round(img.width / ART_ASPECT));
    // Bias the crop upward: the bottom of the tile sits under the UI scrim.
    const top = Math.max(0, Math.round((img.height - cropH) * 0.38));
    img.crop(0, top, img.width, Math.min(cropH, img.height - top));
    return await img.encode(1);
  } catch {
    return bin; // never block a listing on a post-process failure
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
  const force = body.force === true;
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 25);
  const ids: string[] = Array.isArray(body.event_ids)
    ? (body.event_ids as string[]).filter((v) => typeof v === "string").slice(0, 25)
    : typeof body.event_id === "string"
      ? [body.event_id]
      : [];

  // ---- pick the work set -------------------------------------------------
  let query = supabase.from("events").select("id, name, category, image_url").limit(limit);
  if (ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.is("image_url", null).eq("is_resolved", false);
  }
  const { data: events, error: readErr } = await query;
  if (readErr) {
    return new Response(JSON.stringify({ error: readErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const work = (events ?? []).filter((e) => force || !e.image_url);
  if (work.length === 0) {
    return new Response(JSON.stringify({ success: true, generated: [], skipped: (events ?? []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- IP reference sheet (inlined once) ---------------------------------
  const { data: refBlob, error: refErr } = await supabase.storage
    .from(ART_BUCKET)
    .download(ART_REFERENCE_PATH);
  if (refErr || !refBlob) {
    return new Response(
      JSON.stringify({ error: `Missing IP reference ${ART_BUCKET}/${ART_REFERENCE_PATH}: ${refErr?.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const refDataUrl =
    `data:image/png;base64,${bytesToBase64(new Uint8Array(await refBlob.arrayBuffer()))}`;

  const generated: Array<{ id: string; url: string; prop: string }> = [];
  const errors: Array<{ id: string; step: string; error: string }> = [];

  for (const event of work) {
    try {
      // 1) title -> prop clause
      const propRes = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: TEXT_MODEL,
          reasoning_effort: "none",
          messages: [
            { role: "system", content: PROP_SYSTEM_PROMPT },
            { role: "user", content: `"${event.name}" (category: ${event.category}) ->` },
          ],
        }),
      });
      if (!propRes.ok) throw new Error(`prop ${propRes.status}: ${await propRes.text()}`);
      const propJson = await propRes.json();
      const prop = String(propJson?.choices?.[0]?.message?.content ?? "")
        .replace(/^["'\s->]+|["'.\s]+$/g, "")
        .slice(0, 200);
      if (!prop) throw new Error("empty prop clause");

      // 2) prop -> image
      const imgRes = await fetch(`${GATEWAY}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: buildImagePrompt(prop, pickAccent(event.name)) },
                { type: "image_url", image_url: { url: refDataUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (!imgRes.ok) throw new Error(`image ${imgRes.status}: ${await imgRes.text()}`);
      const imgJson = await imgRes.json();
      const b64: string | undefined = imgJson?.data?.[0]?.b64_json;
      if (!b64) throw new Error(`no image payload: ${JSON.stringify(imgJson).slice(0, 300)}`);

      const bin = await enforceAspect(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      const path = `${event.id}.png`;

      // 3) store + publish
      const { error: upErr } = await supabase.storage
        .from(ART_BUCKET)
        .upload(path, bin, { contentType: "image/png", upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { data: signed, error: signErr } = await supabase.storage
        .from(ART_BUCKET)
        .createSignedUrl(path, ART_SIGNED_URL_TTL);
      if (signErr || !signed?.signedUrl) throw new Error(`sign: ${signErr?.message}`);

      const { error: writeErr } = await supabase
        .from("events")
        .update({ image_url: signed.signedUrl })
        .eq("id", event.id);
      if (writeErr) throw new Error(`write: ${writeErr.message}`);

      generated.push({ id: event.id, url: signed.signedUrl, prop });
    } catch (e) {
      errors.push({ id: event.id, step: "generate", error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ success: true, generated, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});