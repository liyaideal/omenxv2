// usePlayStream — what the play button on a stream preview does (CPO 2026-11-09, R2 / R3).
//   signed in → the match's trade page, which starts the stream (muted; the browser
//               won't let a page that was just opened start with sound).
//   guest     → the standard sign-in (AuthDialog / AuthSheet via AuthPromptHost).
//               After a successful sign-in the viewer lands on that trade page
//               and the stream starts there. Closing the sign-in without signing
//               in leaves them where they were.
// The destination is parked in sessionStorage so it survives the Google
// redirect (same tab, same origin); AuthPromptHost consumes it.
import { useNavigate } from "react-router-dom";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import { storedSignedIn } from "./useSignedIn";

export const AFTER_SIGN_IN_KEY = "omenx.afterSignIn";

export const watchUrl = (eventId: string) => `/trade?event=${encodeURIComponent(eventId)}&play=1`;

export const setAfterSignIn = (url: string | null) => {
  try {
    if (url) sessionStorage.setItem(AFTER_SIGN_IN_KEY, url);
    else sessionStorage.removeItem(AFTER_SIGN_IN_KEY);
  } catch {
    /* private mode: the guest simply stays on the page after signing in */
  }
};

export const takeAfterSignIn = (): string | null => {
  try {
    const v = sessionStorage.getItem(AFTER_SIGN_IN_KEY);
    if (v) sessionStorage.removeItem(AFTER_SIGN_IN_KEY);
    // Only same-site paths — never follow an absolute URL out of the app.
    return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
  } catch {
    return null;
  }
};

export const usePlayStream = () => {
  const navigate = useNavigate();
  const openPrompt = useAuthFlowStore((s) => s.openPrompt);
  return (eventId: string) => {
    const url = watchUrl(eventId);
    if (storedSignedIn()) {
      navigate(url);
      return;
    }
    setAfterSignIn(url);
    openPrompt();
  };
};
