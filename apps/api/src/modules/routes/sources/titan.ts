import { request } from "undici";
import type { Quote } from "@routeguardian/shared";
import type { QuoteSource, QuoteRequest } from "./source.types.js";
import { env } from "../../../config/env.js";

/**
 * Titan Gateway quote adapter.
 *
 * Titan is itself a meta-aggregator — it pulls Jupiter and other sources
 * through its own router (Argos). That makes it a high-signal "second
 * opinion" for the comparator.
 *
 * Disabled if `TITAN_API_URL` isn't configured — the comparator skips it
 * silently rather than failing every quote request.
 *
 * Note: Titan's exact public REST schema is finalized at integration
 * time; this adapter targets the documented Gateway shape and falls back
 * to common field aliases. If Titan onboarding is delayed, the adapter
 * can be swapped for OKX DEX or Raydium-direct without touching anything
 * else.
 */
interface TitanQuoteResponse {
  inputMint?: string;
  outputMint?: string;
  inMint?: string;
  outMint?: string;
  inAmount?: string;
  amountIn?: string;
  outAmount?: string;
  amountOut?: string;
  minOutAmount?: string;
  outAmountWithSlippage?: string;
  priceImpactPct?: number | string;
  feeBps?: number;
  /** Some Titan endpoints embed a sub-object with the same fields. */
  bestQuote?: TitanQuoteResponse;
  routes?: Array<{ label?: string; name?: string }>;
  routePlan?: Array<{ label?: string; name?: string }>;
}

export class TitanSource implements QuoteSource {
  readonly name = "titan" as const;
  readonly enabled: boolean;

  constructor() {
    this.enabled = Boolean(env.TITAN_API_URL);
  }

  async getQuote(req: QuoteRequest): Promise<Quote> {
    if (!env.TITAN_API_URL) {
      throw new Error("TITAN_API_URL not configured");
    }
    const url = new URL(env.TITAN_API_URL);
    url.searchParams.set("inputMint", req.inMint);
    url.searchParams.set("outputMint", req.outMint);
    url.searchParams.set("amountIn", req.amountIn);
    url.searchParams.set("slippageBps", String(req.slippageBps));

    const headers: Record<string, string> = { accept: "application/json" };
    if (env.TITAN_API_KEY) headers.authorization = `Bearer ${env.TITAN_API_KEY}`;

    const startedAt = performance.now();
    const res = await request(url.toString(), {
      method: "GET",
      headers,
      headersTimeout: req.timeoutMs,
      bodyTimeout: req.timeoutMs,
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      const body = await res.body.text();
      throw new Error(`Titan ${res.statusCode}: ${body.slice(0, 200)}`);
    }

    const json = (await res.body.json()) as TitanQuoteResponse;
    const responseTimeMs = Math.round(performance.now() - startedAt);

    return normalizeTitan(json, req, responseTimeMs);
  }
}

function normalizeTitan(
  resp: TitanQuoteResponse,
  req: QuoteRequest,
  responseTimeMs: number,
): Quote {
  // Some Titan endpoints wrap the answer in `bestQuote`.
  const q = resp.bestQuote ?? resp;

  const inMint = q.inputMint ?? q.inMint ?? req.inMint;
  const outMint = q.outputMint ?? q.outMint ?? req.outMint;
  const inAmount = q.inAmount ?? q.amountIn ?? req.amountIn;
  const outAmount = q.outAmount ?? q.amountOut ?? "0";
  const minOut =
    q.outAmountWithSlippage ??
    q.minOutAmount ??
    applySlippageFloor(outAmount, req.slippageBps);

  const priceImpactPct =
    typeof q.priceImpactPct === "number"
      ? q.priceImpactPct
      : typeof q.priceImpactPct === "string"
        ? parseFloat(q.priceImpactPct) || 0
        : 0;

  const routePlanSummary = (q.routePlan ?? q.routes ?? [])
    .map((step) => step.label ?? step.name)
    .filter((label): label is string => Boolean(label));

  return {
    source: "titan",
    inMint,
    outMint,
    inAmount,
    outAmount,
    outAmountWithSlippage: minOut,
    priceImpactPct,
    feeBps: q.feeBps ?? 0,
    estimatedNetworkFeeLamports: 5_000,
    routePlanSummary,
    responseTimeMs,
    raw: resp,
  };
}

/**
 * If Titan didn't return an explicit minOutAmount, derive one from
 * `outAmount * (1 - slippageBps/10000)`. Conservative fallback — keeps
 * the comparator's contract intact regardless of the exact Titan shape.
 */
function applySlippageFloor(outAmount: string, slippageBps: number): string {
  try {
    const n = BigInt(outAmount);
    const num = BigInt(10_000 - slippageBps);
    return ((n * num) / 10_000n).toString();
  } catch {
    return outAmount;
  }
}
