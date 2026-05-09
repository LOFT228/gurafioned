import { request } from "undici";
import {
  type ResolvedIntent,
  SwapIntentSchema,
  type SwapIntent,
} from "@routeguardian/shared";
import { resolveToken } from "../zerion/index.js";
import { KNOWN_SOLANA_TOKENS } from "../../config/constants.js";
import { logger } from "../../lib/logger.js";

/**
 * Parses and enriches a raw swap intent:
 *   - validates shape with zod
 *   - resolves both tokens to (symbol, mint, decimals)
 *   - prices the input amount in USD
 *
 * Pricing strategy:
 *   1. Try Jupiter Price API for the input mint (free, no key, ~50ms).
 *   2. Fall back to CoinGecko for known tokens.
 *   3. If both fail, throw — refusing to proceed with an unpriced trade
 *      is safer than guessing wrong and tripping the wrong policy tier.
 */

export async function parseAndResolveIntent(raw: unknown): Promise<ResolvedIntent> {
  const intent = SwapIntentSchema.parse(raw) as SwapIntent;

  const [from, to] = await Promise.all([
    resolveToken(intent.fromToken),
    resolveToken(intent.toToken),
  ]);

  const usdValue = await priceUsdValue(from.mint, from.symbol, intent.amount);

  return {
    ...intent,
    fromMint: from.mint,
    toMint: to.mint,
    fromTokenSymbol: from.symbol,
    toTokenSymbol: to.symbol,
    fromTokenDecimals: from.decimals,
    toTokenDecimals: to.decimals,
    usdValue,
  };
}

const JUPITER_PRICE_URL = "https://lite-api.jup.ag/price/v3";

async function priceUsdValue(
  mint: string,
  symbol: string,
  amount: string,
): Promise<number> {
  // 1. Jupiter Price API
  try {
    const url = `${JUPITER_PRICE_URL}?ids=${encodeURIComponent(mint)}`;
    const res = await request(url, {
      method: "GET",
      headers: { accept: "application/json" },
      headersTimeout: 1500,
      bodyTimeout: 1500,
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const json = (await res.body.json()) as {
        data?: Record<string, { price?: number | string; usdPrice?: number | string }>;
      } & Record<string, { usdPrice?: number | string; price?: number | string }>;
      // Both shapes have been seen across Jupiter price endpoints;
      // accept either.
      const entry = json.data?.[mint] ?? json[mint];
      if (entry) {
        const px =
          typeof entry.price === "number"
            ? entry.price
            : typeof entry.price === "string"
              ? parseFloat(entry.price)
              : typeof entry.usdPrice === "number"
                ? entry.usdPrice
                : typeof entry.usdPrice === "string"
                  ? parseFloat(entry.usdPrice)
                  : NaN;
        if (Number.isFinite(px) && px > 0) {
          return parseFloat(amount) * px;
        }
      }
    }
  } catch (err) {
    logger.warn("price.jupiter_failed", { err: (err as Error).message });
  }

  // 2. CoinGecko fallback
  const cg = KNOWN_SOLANA_TOKENS[symbol]?.coingeckoId;
  if (cg) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cg}&vs_currencies=usd`;
      const res = await request(url, {
        method: "GET",
        headers: { accept: "application/json" },
        headersTimeout: 2000,
        bodyTimeout: 2000,
      });
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const json = (await res.body.json()) as Record<string, { usd?: number }>;
        const px = json[cg]?.usd;
        if (typeof px === "number" && px > 0) {
          return parseFloat(amount) * px;
        }
      }
    } catch (err) {
      logger.warn("price.coingecko_failed", { err: (err as Error).message });
    }
  }

  throw new Error(
    `Unable to price ${symbol} (${mint}) in USD — Jupiter and CoinGecko both failed.`,
  );
}
