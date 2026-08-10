// ============================================================
// Lite page-node shell. Structure only — every section rendered inside a
// page node is imported as-is from sections/ and is NEVER rewritten here.
// ============================================================
import { cn } from "@/lib/utils";

export type RevampStatus = "done" | "wip" | "todo";

export const STATUS_META: Record<RevampStatus, { icon: string; label: string; cls: string }> = {
  done: { icon: "✅", label: "已改版", cls: "border-[#CFFF4A]/40 text-[#CFFF4A]" },
  wip: { icon: "🔧", label: "进行中", cls: "border-[#FF8A3D]/40 text-[#FF8A3D]" },
  todo: { icon: "⏳", label: "未开始", cls: "border-border text-muted-foreground" },
};

export const StatusBadge = ({ status }: { status: RevampStatus }) => {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        m.cls,
      )}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
};

/** One user page = one node. Title carries the revamp status badge. */
export const LitePage = ({
  id,
  title,
  route,
  status,
  note,
  children,
}: {
  id: string;
  title: string;
  route: string;
  status: RevampStatus;
  note?: string;
  children?: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-20">
    <div className="mb-4 border-b border-border pb-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <StatusBadge status={status} />
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {route}
        </code>
      </div>
      {note && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{note}</p>}
    </div>
    <div className="space-y-14">{children}</div>
  </section>
);

/** Placeholder for pages whose revamp hasn't started. */
export const NotStartedPage = ({
  id,
  title,
  route,
  what,
}: {
  id: string;
  title: string;
  route: string;
  what: string;
}) => (
  <LitePage id={id} title={title} route={route} status="todo">
    <div className="rounded-xl border border-dashed border-border p-6">
      <p className="text-sm text-muted-foreground">
        改版未开始 — 该页面还没有进入 Lite 改版轮，此节暂无 demo。改版启动后，所有状态展示直接进入本节。
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{what}</p>
    </div>
  </LitePage>
);
