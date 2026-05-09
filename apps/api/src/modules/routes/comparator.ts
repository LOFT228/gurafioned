import type {
  PolicyPreset,
  Quote,
  QuoteResult,
  ScoredQuote,
} from "@routeguardian/shared";
import { getEnabledSources, type QuoteRequest } from "./sources/index.js";
import { pickBest, scoreQuotes } from "./scoring.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/**
 * Compares quotes across all enabled sources and returns:
 *   - every source's response (success or error) — for the audit log
 *   - the scored & ranked list of successful quotes
 *   - the winning quote (or null if none qualified)
 *
 * Failures are *not* fatal; if Titan is down but Jupiter answers, we still
 * proceed with whatever we got. The orchestrator decides whether one quote
 * is enough to execute (it usually isn't — see policy validators).
 */
export interface CompareResult {
  /** Every source's outcome — successes + failures. */
  results: QuoteResult[];
  /** Scored and ranked list (descending). Only contains successful quotes. */
  scored: ScoredQuote[];
  /** Best non-disqualified quote, or null. */
  best: ScoredQuote | null;
}

export async function compareRoutes(
  req: Omit<QuoteRequest, "timeoutMs">,
  policy: PolicyPreset,
): Promise<CompareResult> {
  const sources = getEnabledSources();
  if (sources.length === 0) {
    logger.warn("comparator.no_sources_enabled");
    return { results: [], scored: [], best: null };
  }

  const timeoutMs = env.ROUTE_SOURCE_TIMEOUT_MS;

  // Fan-out — every source is independent. allSettled so one slow/dead
  // source doesn't take down the whole batch.
  const settled = await Promise.allSettled(
    sources.map(async (s) => {
      const startedAt = performance.now();
      try {
        const quote = await withTimeout(
          s.getQuote({ ...req, timeoutMs }),
          timeoutMs,
          s.name,
        );
        return { ok: true as const, quote };
      } catch (err) {
        return {
          ok: false as const,
          source: s.name,
          error: (err as Error).message,
          responseTimeMs: Math.round(performance.now() - startedAt),
        };
      }
    }),
  );

  const results: QuoteResult[] = settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : {
          ok: false,
          source: "jupiter", // unreachable: rejections are caught above
          error: String(s.reason),
          responseTimeMs: 0,
        },
  );

  const successful: Quote[] = results
    .filter((r): r is { ok: true; quote: Quote } => r.ok)
    .map((r) => r.quote);

  const scored = scoreQuotes(successful, policy);
  // Sort descending so the dashboard renders ranked rows directly.
  scored.sort((a, b) => b.score - a.score);
  const best = pickBest(scored);

  logger.info("comparator.done", {
    sourcesQueried: sources.length,
    successful: successful.length,
    best: best ? best.quote.source : null,
  });

  return { results, scored, best };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
