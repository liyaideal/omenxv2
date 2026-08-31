// ============================================================
// useHlsVideo — attaches an HLS source to a <video>.
// Safari plays .m3u8 natively; everywhere else uses hls.js.
//
// State discipline: the <video> element is the ONLY source of
// truth. Every listener just calls sync(), which reads the
// element and derives the state. Nothing — not a resolved
// play() promise, not a late timer — ever writes a state
// directly, because an async callback that fires after the
// user has moved on will otherwise stamp a stale state over
// a newer one. That race is what put the UI and the element
// out of step in the first place.
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

  // Facts the element cannot tell us on its own.
  const blockedRef = useRef(false); // autoplay was refused, no user gesture yet
  const fatalRef = useRef<null | "error" | "forbidden">(null);
  const notReadySince = useRef<number | null>(null);

  const setMuted = useCallback(
    (next: boolean) => {
      setMutedState(next);
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (el) el.muted = next;
    },
    [el],
  );

  const play = useCallback(() => {
    const v = el;
    if (!v) return;
    // Resuming a live stream must jump to the live edge — replaying stale
    // buffer while the order book is real-time is how someone trades on a
    // picture from a minute ago. But only a true live stream has an infinite
    // duration; seeking to the end of a finite (VOD) playlist lands on the
    // last frame and stalls there.
    try {
      if (v.duration === Infinity && v.seekable.length) {
        v.currentTime = v.seekable.end(v.seekable.length - 1);
      }
    } catch {
      /* ignore */
    }
    // Deliberately no setState here: the element will emit play/playing/pause
    // and sync() will read the truth from it.
    v.play().then(
      () => {
        blockedRef.current = false;
      },
      () => {
        blockedRef.current = true;
      },
    );
  }, [el]);

  const pause = useCallback(() => {
    el?.pause();
  }, [el]);

  useEffect(() => {
    const v = el;
    if (!v || !src || !enabled) {
      setState("idle");
      return;
    }
    let hls: Hls | null = null;
    let alive = true;
    let graceTimer: number | null = null;

    blockedRef.current = false;
    fatalRef.current = null;
    notReadySince.current = null;
    v.muted = muted;

    /** Derive the state from the element. The only place setState is called. */
    const sync = () => {
      if (!alive) return;
      if (fatalRef.current) {
        setState(fatalRef.current);
        return;
      }
      if (v.error) {
        setState("error");
        return;
      }
      if (v.paused) {
        notReadySince.current = null;
        // Never played yet + autoplay refused = "tap to play", not "paused".
        setState(blockedRef.current ? "blocked" : v.readyState === 0 ? "loading" : "paused");
        return;
      }
      if (v.readyState >= 3) {
        notReadySince.current = null;
        setState("playing");
        return;
      }
      // Playing but short of data. Give it a grace window before saying so:
      // a hiccup must not flash a spinner over a picture that is already back.
      const t = Date.now();
      if (notReadySince.current == null) notReadySince.current = t;
      const waited = t - notReadySince.current;
      if (waited >= STALL_FAIL_MS) setState("error");
      else if (waited >= BUFFER_GRACE_MS) setState("buffering");
      else setState((s) => (s === "idle" ? "loading" : s));
    };

    // A repeating poll, not one-shot timers: it re-reads the element rather
    // than firing a decision made 1.5s ago, so it can never land stale.
    graceTimer = window.setInterval(sync, 500);

    const events = [
      "loadstart",
      "loadedmetadata",
      "canplay",
      "play",
      "playing",
      "pause",
      "waiting",
      "stalled",
      "timeupdate",
      "ended",
      "error",
    ];
    events.forEach((e) => v.addEventListener(e, sync));

    const attempt = () =>
      v.play().then(
        () => {
          blockedRef.current = false;
          sync();
        },
        () => {
          blockedRef.current = true;
          sync();
        },
      );

    setState("loading");

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
        // A 403 on the manifest is how a geo-blocked source announces itself.
        const status = (data.response as { code?: number } | undefined)?.code;
        fatalRef.current = status === 403 ? "forbidden" : "error";
        sync();
      });
    } else {
      fatalRef.current = "error";
      sync();
    }

    return () => {
      alive = false;
      if (graceTimer) window.clearInterval(graceTimer);
      events.forEach((e) => v.removeEventListener(e, sync));
      if (hls) hls.destroy();
      v.removeAttribute("src");
      v.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, src, enabled]);

  return { ref, state, muted, setMuted, play, pause };
};
