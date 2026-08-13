import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CampaignRulesDisclosureProps {
  paragraphs: string[];
  heading?: string;
}

/**
 * Read-only campaign rules, authored in campaign_entries.rules.details.
 * Collapsed to a single 44px line; expands in place to the long-form body.
 */
export const CampaignRulesDisclosure = ({ paragraphs, heading }: CampaignRulesDisclosureProps) => {
  const [open, setOpen] = useState(false);
  if (!paragraphs.length) return null;

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 text-left"
        style={{ minHeight: 44 }}
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
          {heading ?? "Campaign rules"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-[10px] px-4 pb-[14px] pt-[12px]" style={{ borderTop: "1px solid #1D2026" }}>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[12.5px] leading-5 text-[#9AA1AC]">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
