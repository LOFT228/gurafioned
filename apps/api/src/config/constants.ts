/**
 * Solana constants and well-known mint addresses.
 *
 * The agent only operates on Solana mainnet — there is no testnet
 * fallback. Every public mint listed here is one that Zerion CLI
 * understands (`zerion swap tokens solana` lists them).
 */

export const SOLANA_CHAIN = "solana" as const;

/**
 * Canonical mints we recognise by symbol. The Zerion CLI itself accepts
 * symbols and resolves them, but having this table client-side lets us
 * (1) compute USD values, (2) validate "allowed token" policy rules,
 * (3) avoid an extra CLI roundtrip per swap.
 */
export const KNOWN_SOLANA_TOKENS: Record<
  string,
  { mint: string; decimals: number; coingeckoId?: string }
> = {
  SOL: {
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    coingeckoId: "solana",
  },
  USDC: {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    coingeckoId: "tether",
  },
  JUP: {
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    coingeckoId: "jupiter-exchange-solana",
  },
  JTO: {
    mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    decimals: 9,
    coingeckoId: "jito-governance-token",
  },
  BONK: {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    coingeckoId: "bonk",
  },
  WIF: {
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    decimals: 6,
    coingeckoId: "dogwifcoin",
  },
};

/**
 * Default scoring weights — overridden per policy via `policy.scoringWeights`.
 */
export const DEFAULT_SCORING_WEIGHTS = {
  out: 1.0,
  impact: 0.4,
  fee: 0.2,
  gas: 0.1,
} as const;

/**
 * Hard penalty added when a quote violates a policy gate. Large enough that
 * any disqualified quote is guaranteed to lose to a qualified one regardless
 * of weights.
 */
export const HARD_DISQUALIFY_PENALTY = -1e9;

/**
 * Lamports per SOL. Used for fee math.
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;
