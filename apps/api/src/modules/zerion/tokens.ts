import { runZerion } from "./client.js";
import { KNOWN_SOLANA_TOKENS, SOLANA_CHAIN } from "../../config/constants.js";
import { logger } from "../../lib/logger.js";

/**
 * Token resolution: symbol (or mint) → { mint, decimals, symbol }.
 *
 * Strategy:
 * 1. Local lookup against KNOWN_SOLANA_TOKENS (fast, zero RPC).
 * 2. Fallback: `zerion swap tokens solana` to fetch the full list and cache.
 *
 * The cache lives for the process lifetime — short enough that we'll pick up
 * new tokens on a restart, long enough that we don't pay the CLI cost on
 * every swap.
 */

export interface ResolvedToken {
  symbol: string;
  mint: string;
  decimals: number;
}

interface ZerionToken {
  symbol?: string;
  mint?: string;
  address?: string;
  decimals?: number;
  name?: string;
}

let remoteTokenCache: Map<string, ResolvedToken> | null = null;

export async function resolveToken(symbolOrMint: string): Promise<ResolvedToken> {
  const upper = symbolOrMint.toUpperCase();

  // 1. Local lookup by symbol
  const local = KNOWN_SOLANA_TOKENS[upper];
  if (local) {
    return { symbol: upper, mint: local.mint, decimals: local.decimals };
  }

  // 2. Local lookup by mint
  for (const [sym, info] of Object.entries(KNOWN_SOLANA_TOKENS)) {
    if (info.mint === symbolOrMint) {
      return { symbol: sym, mint: info.mint, decimals: info.decimals };
    }
  }

  // 3. Remote lookup via Zerion CLI
  const cache = await getRemoteTokenCache();
  const byMint = cache.get(symbolOrMint);
  if (byMint) return byMint;
  const bySymbol = cache.get(upper);
  if (bySymbol) return bySymbol;

  throw new Error(
    `Unable to resolve Solana token "${symbolOrMint}" — not in local table or zerion swap tokens output.`,
  );
}

async function getRemoteTokenCache(): Promise<Map<string, ResolvedToken>> {
  if (remoteTokenCache) return remoteTokenCache;

  const result = await runZerion<{ tokens?: ZerionToken[] }>({
    args: ["swap", "tokens", SOLANA_CHAIN],
    timeoutMs: 15_000,
  });

  if (!result.ok) {
    logger.warn("zerion.tokens.list_failed", { message: result.message });
    remoteTokenCache = new Map();
    return remoteTokenCache;
  }

  const map = new Map<string, ResolvedToken>();
  for (const t of result.data.tokens ?? []) {
    const mint = t.mint ?? t.address;
    if (!mint || typeof t.decimals !== "number" || !t.symbol) continue;
    const entry: ResolvedToken = {
      symbol: t.symbol.toUpperCase(),
      mint,
      decimals: t.decimals,
    };
    map.set(mint, entry);
    map.set(entry.symbol, entry);
  }
  remoteTokenCache = map;
  logger.info("zerion.tokens.cache_built", { size: map.size });
  return map;
}
