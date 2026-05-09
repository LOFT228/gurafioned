import type { QuoteSource } from "./source.types.js";
import { JupiterSource } from "./jupiter.js";
import { TitanSource } from "./titan.js";
import { env } from "../../../config/env.js";

/**
 * Returns the list of route sources enabled for this run.
 *
 * The set is filtered by `ROUTE_SOURCES` in env (default: "jupiter,titan")
 * AND by each source's own `enabled` flag (e.g. Titan disables itself if
 * `TITAN_API_URL` isn't set, so the comparator silently skips it instead
 * of throwing on every request).
 */
export function getEnabledSources(): QuoteSource[] {
  const requested = new Set(env.ROUTE_SOURCES);
  const all: QuoteSource[] = [new JupiterSource(), new TitanSource()];
  return all.filter((s) => requested.has(s.name) && s.enabled);
}

export type { QuoteSource, QuoteRequest } from "./source.types.js";
