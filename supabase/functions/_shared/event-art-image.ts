// Post-processing for event card art.
//
// The image model returns ~1.6 MB 1024px PNGs. Card tiles are 130px tall, so
// we crop to 21:9, downscale to ART_DELIVERY_WIDTH and re-encode as JPEG
// (~50-80 KB), plus a 24px blurred data-URI placeholder for the card.
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
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

/**
 * Crop to 21:9 (bias the crop upward — the bottom sits under the UI scrim),
 * downscale, and encode both the delivery JPEG and the blur placeholder.
 */
export async function toCardArt(bin: Uint8Array): Promise<CardArt> {
  const img = await Image.decode(bin);

  const ratio = img.width / img.height;
  if (ratio < ART_ASPECT - 0.15) {
    const cropH = Math.max(1, Math.round(img.width / ART_ASPECT));
    const top = Math.max(0, Math.round((img.height - cropH) * 0.38));
    img.crop(0, top, img.width, Math.min(cropH, img.height - top));
  }

  if (img.width > ART_DELIVERY_WIDTH) {
    img.resize(ART_DELIVERY_WIDTH, Image.RESIZE_AUTO);
  }

  const jpeg = await img.encodeJPEG(ART_JPEG_QUALITY);

  const blur = img.clone();
  blur.resize(ART_BLUR_WIDTH, Image.RESIZE_AUTO);
  const blurDataUrl = `data:image/jpeg;base64,${bytesToBase64(await blur.encodeJPEG(55))}`;

  return { jpeg, blurDataUrl };
}
