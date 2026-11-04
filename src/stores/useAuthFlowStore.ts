import { create } from "zustand";

interface AuthFlowState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // Global "please sign in" prompt — features that need auth (watchlist star,
  // stream Remind me…) call openPrompt(); <AuthPromptHost /> (mounted once in
  // App) opens the standard sign-in: AuthDialog on desktop, AuthSheet on mobile.
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
