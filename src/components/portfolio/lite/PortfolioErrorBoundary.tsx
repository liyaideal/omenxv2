// ============================================================
// Local error boundary for the Lite /portfolio detail views.
// A throwing detail view must degrade to an in-page error state —
// never unmount the whole page into a white screen.
// ============================================================
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Called by the "Back to settled" action. */
  onReset?: () => void;
  /** Remount the boundary when this changes (e.g. the series key). */
  resetKey?: string | null;
}

interface State {
  hasError: boolean;
}

export class PortfolioErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.error("[portfolio] detail view crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex flex-col items-center gap-3 py-14">
        <p className="text-[13px] text-[#6B7280]">Something went wrong</p>
        <button
          type="button"
          onClick={() => {
            this.setState({ hasError: false });
            this.props.onReset?.();
          }}
          className="h-10 rounded-[10px] px-4 text-[13px] font-semibold text-[#F2F3F5]"
          style={{ border: "1px solid #2A2F38" }}
        >
          Back to settled
        </button>
      </div>
    );
  }
}
