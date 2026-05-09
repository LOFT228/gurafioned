/**
 * Typed fetch wrappers around the RouteGuardian backend.
 *
 * Every page imports from here — no raw `fetch` calls in components.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw new Error(
      `API ${path} ${res.status}: ${JSON.stringify(body ?? {}).slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => jsonFetch<{ status: string; time: string }>("/api/health"),
  policies: () =>
    jsonFetch<{
      policies: Array<{
        preset: import("@routeguardian/shared").PolicyPreset;
        usage: import("@routeguardian/shared").PolicyUsage | null;
      }>;
    }>("/api/policies"),
  preview: (body: { fromToken: string; toToken: string; amount: string }) =>
    jsonFetch<{
      intent: import("@routeguardian/shared").ResolvedIntent;
      policy: import("@routeguardian/shared").PolicyPreset;
      results: import("@routeguardian/shared").QuoteResult[];
      scored: import("@routeguardian/shared").ScoredQuote[];
      best: import("@routeguardian/shared").ScoredQuote | null;
    }>("/api/quotes", { method: "POST", body: JSON.stringify(body) }),
  swap: (body: {
    fromToken: string;
    toToken: string;
    amount: string;
    label?: string;
  }) =>
    jsonFetch<{
      kind: "approved_and_executed" | "rejected" | "awaiting_confirmation";
      decision: import("@routeguardian/shared").Decision;
      txHash?: string;
    }>("/api/swaps", { method: "POST", body: JSON.stringify(body) }),
  audit: (limit = 50) =>
    jsonFetch<{ decisions: AuditRow[] }>(`/api/audit?limit=${limit}`),
  decision: (id: string) => jsonFetch<AuditDetail>(`/api/audit/${id}`),
};

export interface AuditRow {
  id: string;
  intentId: string;
  policyName: string;
  policyTier: "small" | "medium" | "large";
  status: string;
  rejectionCode?: string;
  rejectionReason?: string;
  chosenSource?: string;
  createdAt: string;
  intent?: {
    fromToken: string;
    toToken: string;
    amount: string;
    usdValue: number;
  };
  execution?: {
    txHash?: string | null;
    txStatus?: string | null;
    receivedAmount?: string | null;
  };
}

export interface AuditDetail extends AuditRow {
  scoredQuotes: import("@routeguardian/shared").ScoredQuote[];
  reasoning: import("@routeguardian/shared").ReasoningStep[];
}
