import { request } from "undici";
import type { Quote } from "@routeguardian/shared";
import type { QuoteSource, QuoteRequest } from "./source.types.js";
import { env } from "../../../config/env.js";

/**
 * Jupiter quote adapter.
 *
 * Endpoint: GET <JUPITER_QUOTE_URL>
 *   query: inputMint, outputMint, amount, slippageBps, swapMode=ExactIn,
 *          restrictIntermediateTokens=true, onlyDirectRoutes=false
 *
 * We never call Jupiter's `/swap` endpoint — execution is always Zerion.
 */
interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  /** Worst-case output after slippage. */
  otherAmountThreshold: string;
  /** May be a number, string, or null depending on Jupiter's mood. */
  priceImpactPct: number | string | null;
  routePlan?: Array<{
    swapInfo?: { label?: string; ammKey?: string };
  }>;
  platformFee?: { feeBps?: number; amount?: string };
  contextSlot?: number;
}

export class JupiterSource implements QuoteSource {
  readonly name = "jupiter" as const;
  readonly enabled = true; // Jupiter has no API key — always on.

  async getQuote(req: QuoteRequest): Promise<Quote> {
    const url = new URL(env.JUPITER_QUOTE_URL);
    url.searchParams.set("inputMint", req.inMint);
    url.searchParams.set("outputMint", req.outMint);
    url.searchParams.set("amount", req.amountIn);
    url.searchParams.set("slippageBps", String(req.slippageBps));
    url.searchParams.set("swapMode", "ExactIn");
    url.searchParams.set("restrictIntermediateTokens", "true");
    url.searchParams.set("onlyDirectRoutes", "false");

    const startedAt = performance.now();
    const res = await request(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      headersTimeout: req.timeoutMs,
      bodyTimeout: req.timeoutMs,
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      const body = await res.body.text();
      throw new Error(`Jupiter ${res.statusCode}: ${body.slice(0, 200)}`);
    }

    const json = (await res.body.json()) as JupiterQuoteResponse;
    const responseTimeMs = Math.round(performance.now() - startedAt);

    return normalizeJupiter(json, responseTimeMs);
  }
}

function normalizeJupiter(
  resp: JupiterQuoteResponse,
  responseTimeMs: number,
): Quote {
  const priceImpactPct =
    typeof resp.priceImpactPct === "number"
      ? resp.priceImpactPct
      : typeof resp.priceImpactPct === "string"
        ? parseFloat(resp.priceImpactPct) || 0
        : 0;

  const routePlanSummary = (resp.routePlan ?? [])
    .map((step) => step.swapInfo?.label ?? step.swapInfo?.ammKey ?? "?")
    .filter((label): label is string => Boolean(label));

  return {
    source: "jupiter",
    inMint: resp.inputMint,
    outMint: resp.outputMint,
    inAmount: resp.inAmount,
    outAmount: resp.outAmount,
    outAmountWithSlippage: resp.otherAmountThreshold,
    priceImpactPct,
    feeBps: resp.platformFee?.feeBps ?? 0,
    // Jupiter doesn't return a network-fee estimate in /quote; use a
    // conservative default that scoring will treat as "tied" across sources
    // unless someone provides a better estimate.
    estimatedNetworkFeeLamports: 5_000,
    routePlanSummary,
    responseTimeMs,
    raw: resp,
  };
}
