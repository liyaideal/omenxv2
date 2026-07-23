import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRecoveryRequests } from '@/hooks/useRecoveryRequests';

const NETWORKS = [
  'Ethereum',
  'BNB Smart Chain (BEP20)',
  'Polygon',
  'Arbitrum One',
  'Optimism',
  'Avalanche C-Chain',
  'Solana',
  'Tron',
  'Other',
];

const TOKENS = ['USDT', 'USDC', 'ETH', 'BNB', 'MATIC', 'SOL', 'Other'];

const FEE_PERCENT = 10;

const schema = z.object({
  tx_hash: z
    .string()
    .trim()
    .min(10, 'Enter a valid transaction hash')
    .max(120, 'Transaction hash too long'),
  wrong_network: z.string().min(1, 'Select the network you sent to'),
  wrong_token: z.string().min(1, 'Select the token you sent'),
  wrong_token_other: z.string().max(40).optional(),
  claimed_amount: z
    .number({ invalid_type_error: 'Enter the amount you sent' })
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount too large'),
  sender_address: z
    .string()
    .trim()
    .min(10, 'Enter your sending wallet address')
    .max(120, 'Address too long'),
  user_note: z.string().max(500, 'Max 500 characters').optional(),
});

export const RecoveryForm = () => {
  const navigate = useNavigate();
  const { create } = useRecoveryRequests();
  const [form, setForm] = useState({
    tx_hash: '',
    wrong_network: '',
    wrong_token: '',
    wrong_token_other: '',
    claimed_amount: '',
    sender_address: '',
    user_note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountNum = parseFloat(form.claimed_amount) || 0;
  const estimatedReturn = useMemo(() => amountNum * (1 - FEE_PERCENT / 100), [amountNum]);

  const update = (k: string, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    const parsed = schema.safeParse({
      ...form,
      claimed_amount: parseFloat(form.claimed_amount),
    });
    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        if (e.path[0]) newErrors[e.path[0] as string] = e.message;
      });
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const finalToken =
      parsed.data.wrong_token === 'Other'
        ? (parsed.data.wrong_token_other || '').trim() || 'Other'
        : parsed.data.wrong_token;

    if (parsed.data.wrong_token === 'Other' && !parsed.data.wrong_token_other?.trim()) {
      setErrors({ wrong_token_other: 'Specify the token symbol' });
      return;
    }

    try {
      const created = await create.mutateAsync({
        tx_hash: parsed.data.tx_hash,
        wrong_network: parsed.data.wrong_network,
        wrong_token: finalToken,
        claimed_amount: parsed.data.claimed_amount,
        sender_address: parsed.data.sender_address,
        user_note: parsed.data.user_note,
      });
      toast.success('Recovery request submitted. We will review within 48h.');
      navigate(`/wallet/recovery/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Transaction hash" error={errors.tx_hash}>
        <Input
          placeholder="0x..."
          value={form.tx_hash}
          onChange={(e) => update('tx_hash', e.target.value)}
          className="font-mono text-sm"
        />
      </Field>

      <Field label="Network you sent to (wrong network)" error={errors.wrong_network}>
        <Select value={form.wrong_network} onValueChange={(v) => update('wrong_network', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Token you sent" error={errors.wrong_token}>
        <Select value={form.wrong_token} onValueChange={(v) => update('wrong_token', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {TOKENS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.wrong_token === 'Other' && (
          <Input
            placeholder="Specify token symbol"
            value={form.wrong_token_other}
            onChange={(e) => update('wrong_token_other', e.target.value)}
            className="mt-2"
          />
        )}
        {errors.wrong_token_other && (
          <p className="mt-1 text-xs text-destructive">{errors.wrong_token_other}</p>
        )}
      </Field>

      <Field label="Amount sent" error={errors.claimed_amount}>
        <Input
          type="number"
          step="any"
          placeholder="0.00"
          value={form.claimed_amount}
          onChange={(e) => update('claimed_amount', e.target.value)}
          className="font-mono"
        />
      </Field>

      <Field label="Your sending wallet address" error={errors.sender_address}>
        <Input
          placeholder="0x... (the wallet you sent from)"
          value={form.sender_address}
          onChange={(e) => update('sender_address', e.target.value)}
          className="font-mono text-sm"
        />
      </Field>

      <Field label="Additional notes (optional)" error={errors.user_note}>
        <Textarea
          placeholder="Any extra details that may help us locate your funds..."
          value={form.user_note}
          onChange={(e) => update('user_note', e.target.value)}
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {form.user_note.length}/500
        </p>
      </Field>

      {/* Fee preview */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <Row label="Amount sent" value={`$${(amountNum || 0).toFixed(2)}`} />
        <Row label={`Recovery fee (${FEE_PERCENT}%)`} value={`-$${((amountNum * FEE_PERCENT) / 100).toFixed(2)}`} />
        <div className="border-t pt-2 flex items-center justify-between">
          <span className="font-medium">You will receive</span>
          <span className="font-mono font-semibold text-primary">
            ${(estimatedReturn || 0).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Flat {FEE_PERCENT}% fee covers source-chain gas, bridge cost, and manual processing. Typical turnaround: 3–7 business days.
        </p>
      </div>


      <Button
        onClick={submit}
        disabled={create.isPending}
        className="w-full h-12 rounded-xl"
      >
        {create.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          'Submit recovery request'
        )}
      </Button>
    </div>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);
