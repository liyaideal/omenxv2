import { create } from "zustand";

interface AuthFlowState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // Global "please sign in" prompt — used by features that require auth
  // (e.g. watchlist star button) to ask the host page to open its auth modal.
  promptOpen: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
}

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  promptOpen: false,
  openPrompt: () => set({ promptOpen: true }),
  closePrompt: () => set({ promptOpen: false }),
}));
