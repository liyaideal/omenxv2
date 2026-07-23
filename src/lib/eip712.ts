/**
 * EIP-712 domain and types for OmenX wallet connection verification.
 */
export const EIP712_DOMAIN = {
  name: "OmenX",
  version: "1",
  chainId: 1,
};

export const EIP712_TYPES = {
  ConnectAccount: [
    { name: "platform", type: "string" },
    { name: "account", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" },
  ],
};

export interface EIP712Message {
  platform: string;
  account: string;
  timestamp: string;
  nonce: string;
}

export const buildSignMessage = (
  platform: string,
  accountId: string
): EIP712Message => ({
  platform,
  account: accountId,
  timestamp: String(Math.floor(Date.now() / 1000)),
  nonce: crypto.randomUUID(),
});
