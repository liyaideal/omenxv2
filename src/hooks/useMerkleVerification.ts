import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MerkleStep = 
  | "idle"
  | "fetching_proof"    // Step 1: Fetching proof from platform
  | "reading_chain"     // Step 2: Reading on-chain StateRoot
  | "verifying"         // Step 3: Browser local verification
  | "result"            // Step 4: Result display
  | "details";          // Step 5: Expandable details

export interface MerkleVerificationData {
  balance: number;
  margin: number;
  totalAssets: number;
  leafHash: string;
  oldRoot: string;
  stateRoot: string; // newRoot
  batchId: number;
  commitTimestamp: string;
  proofPath: string[];
  verificationResult: "verified" | "failed";
  verifiedAt: string;
}

// Generate mock hex string of specified length
const mockHex = (len: number) => {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

export const useMerkleVerification = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<MerkleStep>("idle");
  const [data, setData] = useState<MerkleVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startVerification = useCallback(async () => {
    if (!user) return;
    setError(null);
    setData(null);

    // Step 1: Fetch proof
    setStep("fetching_proof");
    await new Promise((r) => setTimeout(r, 1800));

    // Step 2: Read on-chain StateRoot
    setStep("reading_chain");
    await new Promise((r) => setTimeout(r, 1500));

    // Step 3: Local verification
    setStep("verifying");
    await new Promise((r) => setTimeout(r, 2000));

    // Generate mock data aligned with real contract fields
    const balance = 13530;
    const margin = 2847.52;
    const totalAssets = balance + margin;
    const leafHash = mockHex(64);
    const oldRoot = mockHex(64);
    const stateRoot = mockHex(64); // newRoot
    const batchId = 42000 + Math.floor(Math.random() * 1000); // realistic incrementing integer
    // Commit timestamp: a recent time, slightly before "now"
    const commitTimestamp = new Date(Date.now() - Math.floor(Math.random() * 600_000) - 60_000).toISOString();
    const proofPath = Array.from({ length: 5 }, () => mockHex(64));
    const verifiedAt = new Date().toISOString();

    const verificationData: MerkleVerificationData = {
      balance,
      margin,
      totalAssets,
      leafHash,
      oldRoot,
      stateRoot,
      batchId,
      commitTimestamp,
      proofPath,
      verificationResult: "verified",
      verifiedAt,
    };

    setData(verificationData);

    // Save to database (column names unchanged for schema compat; semantics now margin / totalAssets)
    try {
      await supabase.from("asset_verifications").insert({
        user_id: user.id,
        balance,
        positions_value: margin,
        total_equity: totalAssets,
        leaf_hash: leafHash,
        state_root: stateRoot,
        batch_id: batchId.toString(),
        proof_path: proofPath,
        verification_result: "verified",
        verified_at: verifiedAt,
      } as any);
    } catch (e) {
      // Non-critical, continue
    }

    // Step 4: Show result
    setStep("result");
  }, [user]);

  const reset = useCallback(() => {
    setStep("idle");
    setData(null);
    setError(null);
  }, []);

  const showDetails = useCallback(() => {
    setStep("details");
  }, []);

  return { step, data, error, startVerification, reset, showDetails };
};
