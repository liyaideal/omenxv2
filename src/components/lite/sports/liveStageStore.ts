// ============================================================
// A two-component store: the stage owns these facts, the
// matchboard's Watch key reads them. Module-level rather than a
// context so neither component has to know the other exists.
// Session-scoped on purpose — "I closed the mini player" must
// not outlive the tab.
// ============================================================
import { useSyncExternalStore } from "react";

export interface LiveStageState {
  /** The fixture currently owning the stage, or null. */
  fixtureId: string | null;
  /** Does this fixture have a playable source at all? */
  hasSource: boolean;
  /** Is the inline stage slot inside the viewport? */
  inlineVisible: boolean;
  /** Did the reader close the mini player this session? */
  miniDismissed: boolean;
}

let state: LiveStageState = {
  fixtureId: null,
  hasSource: false,
  inlineVisible: true,
  miniDismissed: false,
};

const listeners = new Set<() => void>();

export const setLiveStageState = (patch: Partial<LiveStageState>) => {
  const next = { ...state, ...patch };
  // A different fixture resets the dismissal — closing the mini player on
  // one match must not silence it on the next one.
  if (patch.fixtureId !== undefined && patch.fixtureId !== state.fixtureId) {
    next.miniDismissed = false;
  }
  if (
    next.fixtureId === state.fixtureId &&
    next.hasSource === state.hasSource &&
    next.inlineVisible === state.inlineVisible &&
    next.miniDismissed === state.miniDismissed
  ) {
    return;
  }
  state = next;
  listeners.forEach((l) => l());
};

export const useLiveStageState = (): LiveStageState =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );

/** The Watch key shows only when all three hold. */
export const useShowWatchKey = (fixtureId: string): boolean => {
  const s = useLiveStageState();
  return s.fixtureId === fixtureId && s.hasSource && !s.inlineVisible && s.miniDismissed;
};
