// ============================================================
// streamPicture — what the "tap to watch" picture shows (CPO 2026-11-09).
// The home stage and the Sports view stage no longer pull the stream; they
// show one still and a play button. Order:
//   1. thumb  — the server's snapshot of the live stream. One frame every
//               10 minutes, shared by everyone who opens the page in that
//               window. Real platform: the stream service writes it and the
//               match carries `metadata.stream_thumb_url` (+ `stream_thumb_at`).
//               Lovable has no snapshot service, so the demo stream's stills
//               (public/assets/streams) stand in, picked by the same
//               10-minute window — no stream bytes either way.
//   2. cover  — no snapshot yet / snapshot failed: the event's own cover image.
//   3. none   — no cover either: dark stage + play button.
// ============================================================

export const THUMB_WINDOW_MS = 10 * 60_000;

/** The demo HLS every Lovable fixture streams (Big Buck Bunny on Mux's test CDN). */
const DEMO_STREAM = "test-streams.mux.dev/x36xhzz";
const DEMO_FRAMES = Array.from({ length: 11 }, (_, i) => `/assets/streams/demo-${String(i + 1).padStart(2, "0")}.jpg`);

export type StreamPicture =
  | { kind: "thumb"; src: string }
  | { kind: "cover"; src: string }
  | { kind: "none" };

export interface StreamPictureInput {
  id: string;
  streamUrl?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Same input + same 10-minute window ⇒ same picture for every viewer. */
export const streamPicture = (m: StreamPictureInput, nowMs: number = Date.now()): StreamPicture => {
  if (m.thumbnailUrl) return { kind: "thumb", src: m.thumbnailUrl };
  if (m.streamUrl && m.streamUrl.includes(DEMO_STREAM)) {
    const slot = Math.floor(nowMs / THUMB_WINDOW_MS) + hash(m.id);
    return { kind: "thumb", src: DEMO_FRAMES[slot % DEMO_FRAMES.length] };
  }
  if (m.coverUrl) return { kind: "cover", src: m.coverUrl };
  return { kind: "none" };
};
