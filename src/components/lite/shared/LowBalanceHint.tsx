import { t } from "@/i18n";

const SLOT = "\u0000";

/**
 * Low-balance line under the Lite order card's amount box (TR-30 / SP-20).
 * The sentence is one i18n template with a `{{link}}` slot so each language
 * keeps its own word order; the slot renders `linkKey` as an inline button.
 * Click → `onAddMoney` (useInsufficientBalanceToast().addMoney): Transfer when
 * the other account has money, otherwise /deposit. CPO 2026-11-12.
 */
export const LowBalanceHint = ({
  id,
  templateKey,
  linkKey,
  onAddMoney,
}: {
  id: string;
  templateKey: string;
  linkKey: string;
  onAddMoney: () => void;
}) => {
  const parts = t(templateKey, { link: SLOT }).split(SLOT);
  return (
    <p id={id} className="text-xs leading-[17px] text-foreground/75">
      {parts.length < 2 ? (
        parts[0]
      ) : (
        <>
          {parts[0]}
          <button
            type="button"
            onClick={onAddMoney}
            className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
          >
            {t(linkKey)}
          </button>
          {parts[1]}
        </>
      )}
    </p>
  );
};
