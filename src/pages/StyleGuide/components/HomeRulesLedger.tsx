// ============================================================
// 首页 All 改版 · 规则台账（HA-R）— renders the one rule list the code,
// the delivery doc and the acceptance table all cite (homeAllRules.ts).
// ============================================================
import { HOME_ALL_RULES } from "@/components/lite/home/homeAllRules";

export const HomeRulesLedger = () => (
  <div className="space-y-6">
    {HOME_ALL_RULES.map((g) => (
      <div key={g.code}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#CFFF4A]">
            {g.code} · {g.title}
          </span>
          {g.status && <span className="font-mono text-[10px] text-muted-foreground">{g.status}</span>}
        </div>
        <table className="mt-2 w-full border-collapse text-[12.5px] leading-relaxed">
          <tbody>
            {g.rules.map((r) => (
              <tr key={r.id} className="border-t border-border/60 align-top">
                <td className="w-12 py-2 pr-3 font-mono font-bold text-[#CFFF4A]">{r.id}</td>
                <td className="py-2 text-foreground/90">{r.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
);

export default HomeRulesLedger;
