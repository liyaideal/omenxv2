// Post-processing for event card art.
//
// The image model returns ~1.6 MB 1024px PNGs. Card tiles are 130px tall, so
// we crop to 21:9, downscale to ART_DELIVERY_WIDTH and re-encode as JPEG
// (~50-80 KB), plus a 24px blurred data-URI placeholder for the card.
// NOTE: imagescript pulls a native node codec that crashes the Supabase edge
// runtime ("unsupported arch/platform"), so post-processing runs on the pure
// WASM ImageMagick build instead.
import {
  ImageMagick,
  initialize,
  MagickFormat,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";
import {
  ART_ASPECT,
  ART_BLUR_WIDTH,
  ART_DELIVERY_WIDTH,
  ART_JPEG_QUALITY,
} from "./event-art.ts";

export interface CardArt {
  /** JPEG bytes ready to upload. */
  jpeg: Uint8Array;
  /** Tiny blurred `data:image/jpeg;base64,...` placeholder (~400 bytes). */
  blurDataUrl: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

let magickReady: Promise<void> | null = null;

// The Supabase edge runtime has no Web Cache API; imagemagick_deno uses it to
// memoise the wasm binary. Stub it so initialize() just fetches every boot.
function ensureCacheStub() {
  try {
    if ((globalThis as { caches?: unknown }).caches) {
      // Touching `caches.open` is what throws in this runtime.
      void (globalThis as unknown as { caches: CacheStorage }).caches.open;
    }
  } catch {
    // fall through to the stub below
  }
  const stub = {
    open: async () => ({
      match: async () => undefined,
      put: async () => {},
      delete: async () => false,
    }),
    match: async () => undefined,
    has: async () => false,
    delete: async () => false,
    keys: async () => [],
  };
  try {
    Object.defineProperty(globalThis, "caches", {
      value: stub,
      configurable: true,
      writable: true,
    });
  } catch {
    // ignore — nothing else we can do
  }
}

const ensureMagick = () =>
  (magickReady ??= (async () => {
    ensureCacheStub();
    await initialize();
  })());

/**
 * Crop to 21:9 (bias the crop upward — the bottom sits under the UI scrim),
 * downscale, and encode both the delivery JPEG and the blur placeholder.
 */
export async function toCardArt(bin: Uint8Array): Promise<CardArt> {
  await ensureMagick();

  let jpeg: Uint8Array | null = null;
  let blur: Uint8Array | null = null;

  ImageMagick.read(bin, (img) => {
    const ratio = img.width / img.height;
    if (ratio < ART_ASPECT - 0.15) {
      const cropH = Math.max(1, Math.round(img.width / ART_ASPECT));
      const top = Math.max(0, Math.round((img.height - cropH) * 0.38));
      img.crop(
        new MagickGeometry(0, top, img.width, Math.min(cropH, img.height - top)),
      );
      // Drop the crop offset so the encoded frame starts at 0,0.
      img.page = new MagickGeometry(0, 0, img.width, img.height);
    }

    if (img.width > ART_DELIVERY_WIDTH) {
      const h = Math.max(1, Math.round((img.height / img.width) * ART_DELIVERY_WIDTH));
      img.resize(new MagickGeometry(ART_DELIVERY_WIDTH, h));
    }

    img.quality = ART_JPEG_QUALITY;
    img.write(MagickFormat.Jpeg, (data) => {
      jpeg = new Uint8Array(data);
    });

    const blurH = Math.max(1, Math.round((img.height / img.width) * ART_BLUR_WIDTH));
    img.resize(new MagickGeometry(ART_BLUR_WIDTH, blurH));
    img.quality = 55;
    img.write(MagickFormat.Jpeg, (data) => {
      blur = new Uint8Array(data);
    });
  });

  if (!jpeg || !blur) throw new Error("Image post-processing produced no output");

  return { jpeg, blurDataUrl: `data:image/jpeg;base64,${bytesToBase64(blur)}` };
}
