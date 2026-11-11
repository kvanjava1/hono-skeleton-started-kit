import { randomBytes } from "node:crypto";

export interface GeneratedApiKey {
  rawToken: string;
  keyPrefix: string;
  secretHash: string;
}

const API_KEY_PREFIX = "hon_live_";

/**
 * Generates a cryptographically secure API key.
 * Format: hon_live_<64-hex-characters>
 * Prefix: first 16 characters (e.g. "hon_live_a1b2c3d4")
 * Hash: SHA-256 digest of the entire raw token.
 */
export const generateApiKey = (): GeneratedApiKey => {
  const randomHex = randomBytes(32).toString("hex"); // 64 hex chars
  const rawToken = `${API_KEY_PREFIX}${randomHex}`;
  const keyPrefix = rawToken.slice(0, 17); // "hon_live_" (9) + 8 chars = 17 chars
  const secretHash = hashApiKey(rawToken);

  return {
    rawToken,
    keyPrefix,
    secretHash,
  };
};

/**
 * Computes deterministic SHA-256 hash for database comparison and indexing.
 */
export const hashApiKey = (rawToken: string): string => {
  return new Bun.CryptoHasher("sha256").update(rawToken).digest("hex");
};
