/**
 * WithdrawSubmitContext — lets the full-screen /withdraw route render the
 * primary CTA in a sticky bottom bar while the form logic stays inside
 * WalletWithdraw (DESIGN.md §5 "Full-screen funding flows vs drawers").
 *
 * Flow unchanged: WalletWithdraw still owns validation and submission; it
 * only publishes the button state upward.
 */
import { createContext, useContext, useMemo, useState } from "react";

export interface WithdrawSubmitState {
  visible: boolean;
  disabled: boolean;
  loading: boolean;
  onSubmit: () => void;
}

const DEFAULT_STATE: WithdrawSubmitState = {
  visible: false,
  disabled: true,
  loading: false,
  onSubmit: () => {},
};

interface Ctx {
  state: WithdrawSubmitState;
  setState: (s: WithdrawSubmitState) => void;
}

const WithdrawSubmitCtx = createContext<Ctx | null>(null);

export const WithdrawSubmitProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WithdrawSubmitState>(DEFAULT_STATE);
  const value = useMemo(() => ({ state, setState }), [state]);
  return <WithdrawSubmitCtx.Provider value={value}>{children}</WithdrawSubmitCtx.Provider>;
};

/** Returns null when WalletWithdraw is not mounted inside the full-screen route. */
export const useWithdrawSubmit = () => useContext(WithdrawSubmitCtx);
