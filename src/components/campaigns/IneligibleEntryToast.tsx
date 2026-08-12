import { toast } from "sonner";

/**
 * Toast body shown when an exclusive campaign link refuses to bind
 * (cap reached, already locked to another entry, account not eligible,
 * link expired…). Copy is deliberately generic — new refusal reasons
 * never need a new string.
 */
export const IneligibleEntryToastBody = () => (
  <div className="flex w-full items-start gap-3 rounded-lg border border-border bg-background px-4 py-3.5 shadow-lg">
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-semibold leading-5 text-foreground">This entry is not available</p>
      <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">
        Your account isn't eligible for this exclusive link. Redirecting you to the home page.
      </p>
    </div>
  </div>
);

/** Fires the single ineligible-entry toast (desktop top-center, mobile full-width). */
export const showIneligibleEntryToast = () =>
  toast.custom(() => <IneligibleEntryToastBody />, {
    id: "campaign-entry-ineligible",
    position: "top-center",
    duration: 4000,
    className: "w-full md:w-auto md:max-w-[420px]",
  });
