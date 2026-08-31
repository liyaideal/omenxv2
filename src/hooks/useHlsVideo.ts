// ============================================================
// useHlsVideo — attaches an HLS source to a <video>.
// Safari plays .m3u8 natively; everywhere else uses hls.js.
// Reports the exact playback state the LiveStage design needs:
// loading / playing / buffering / paused / blocked / error / forbidden.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export type VideoState =
  | "idle"
  | "loading"
  | "playing"
  | "buffering"
  | "paused"
  | "blocked"
  | "error"
  | "forbidden";

const BUFFER_GRACE_MS = 1500;
const STALL_FAIL_MS = 10_000;
const MUTE_KEY = "omenx.lite.stage.muted";

const readMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) !== "0";
  } catch {
    return true;
  }
};

export const useHlsVideo = (src: string | null | undefined, enabled: boolean) => {
  // A callback ref, not useRef: the <video> is conditionally rendered, and a
  // ref mutation does not re-run effects. Holding the element in state makes
  // "the element mounted" an actual dependency.
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  const ref = useCallback((node: HTMLVideoElement | null) => setEl(node), []);
  const [state, setState] = useState<VideoState>("idle");
  const [muted, setMutedState] = useState<boolean>(readMuted);
  const bufferTimer = useRef<number | null>(null);
  const stallTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (bufferTimer.current) window.clearTimeout(bufferTimer.current);
    if (stallTimer.current) window.clearTimeout(stallTimer.current);
    bufferTimer.current = null;
    stallTimer.current = null;
  };

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (el) el.muted = next;
  }, [el]);

  /** Manual play, for the "tap to play" and "resume" affordances. */
  const play = useCallback(() => {
    const v = el;
    if (!v) return;
    // Resuming always jumps to the live edge — never replay stale buffer.
    try {
      if (v.seekable.length) v.currentTime = v.seekable.end(v.seekable.length - 1);
    } catch {
      /* ignore */
    }
    v.play().then(
      () => setState("playing"),
      () => setState("blocked"),
    );
  }, [el]);

  const pause = useCallback(() => {
    el?.pause();
    setState("paused");
  }, [el]);

  useEffect(() => {
    const v = el;
    if (!v || !src || !enabled) {
      setState("idle");
      return;
    }
    let hls: Hls | null = null;
    let alive = true;
    setState("loading");
    v.muted = muted;

    const onWaiting = () => {
      if (bufferTimer.current) window.clearTimeout(bufferTimer.current);
      // Only surface buffering after a grace window, so short hiccups
      // do not flash a spinner over a picture that is already there.
      bufferTimer.current = window.setTimeout(() => {
        if (alive) setState("buffering");
      }, BUFFER_GRACE_MS);
      if (stallTimer.current) window.clearTimeout(stallTimer.current);
      stallTimer.current = window.setTimeout(() => {
        if (alive) setState("error");
      }, STALL_FAIL_MS);
    };
    const onPlaying = () => {
      clearTimers();
      if (alive) setState("playing");
    };
    const onPause = () => {
      if (alive && !v.ended) setState("paused");
    };
    const onError = () => {
      clearTimers();
      if (alive) setState("error");
    };

    v.addEventListener("waiting", onWaiting);
    v.addEventListener("stalled", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);

    const attempt = () =>
      v.play().then(
        () => alive && setState("playing"),
        () => alive && setState("blocked"),
      );

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
      v.addEventListener("loadedmetadata", attempt, { once: true });
    } else if (Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, attempt);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        clearTimers();
        // A 403 on the manifest is how a geo-blocked source announces itself.
        const status = (data.response as { code?: number } | undefined)?.code;
        if (alive) setState(status === 403 ? "forbidden" : "error");
      });
    } else {
      setState("error");
    }

    return () => {
      alive = false;
      clearTimers();
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("stalled", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onError);
      if (hls) hls.destroy();
      v.removeAttribute("src");
      v.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, src, enabled]);

  return { ref, state, muted, setMuted, play, pause };
};
