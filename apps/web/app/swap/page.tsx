"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { QuoteRow } from "@/components/QuoteRow";
import { ReasoningTrail } from "@/components/ReasoningTrail";
import type {
  Decision,
  PolicyPreset,
  ScoredQuote,
} from "@routeguardian/shared";

const TOKENS = ["SOL", "USDC", "USDT", "JUP", "JTO", "BONK", "WIF"] as const;

interface PreviewState {
  policy: PolicyPreset;
  scored: ScoredQuote[];
  best: ScoredQuote | null;
}

export default function SwapPage() {
  const [fromToken, setFromToken] = useState<string>("USDC");
  const [toToken, setToToken] = useState<string>("SOL");
  const [amount, setAmount] = useState<string>("10");
  const [loading, setLoading] = useState<"" | "preview" | "execute">("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPreview() {
    setError(null);
    setDecision(null);
    setLoading("preview");
    try {
      const res = await api.preview({ fromToken, toToken, amount });
      setPreview({ policy: res.policy, scored: res.scored, best: res.best });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading("");
    }
  }

  async function runExecute() {
    setError(null);
    setLoading("execute");
    try {
      const res = await api.swap({ fromToken, toToken, amount });
      setDecision(res.decision);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="inline-block rounded-full border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider">
          New swap
        </span>
        <h1 className="text-4xl font-bold tracking-tight">
          Pick a swap. <span className="text-purple">We'll guard the route.</span>
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* --- Form --- */}
        <div className="petal-purple p-7">
          <h2 className="text-lg font-bold tracking-tight">Intent</h2>
          <p className="mt-1 text-sm text-ink-soft">
            All swaps execute on Solana through{" "}
            <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs">
              zerion swap solana
            </code>
            .
          </p>

          <div className="mt-5 space-y-4">
            <Field label="From">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="select"
              >
                {TOKENS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="To">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="select"
              >
                {TOKENS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="input"
                placeholder="100"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={runPreview}
              disabled={loading !== ""}
              className="btn-chunky-ghost"
            >
              {loading === "preview" ? "Comparing routes…" : "Preview routes"}
            </button>
            <button
              onClick={runExecute}
              disabled={loading !== "" || !preview}
              className="btn-chunky"
            >
              {loading === "execute" ? "Executing…" : "Execute via Zerion CLI"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border-2 border-coral bg-coral-soft px-3 py-2 text-sm font-semibold text-ink">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* --- Quote table + reasoning --- */}
        <div className="space-y-6">
          {preview && (
            <section className="space-y-3">
              <header className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold tracking-tight">
                  Compared routes
                </h2>
                <span className="rounded-full bg-purple-mist px-2.5 py-0.5 text-xs font-semibold text-purple-ink">
                  {preview.policy.name} · max slippage{" "}
                  {preview.policy.maxSlippagePct}%
                </span>
              </header>
              {preview.scored.length === 0 ? (
                <p className="rounded-petal border-2 border-dashed border-ink/20 px-5 py-6 text-center text-sm text-ink-soft">
                  No sources answered.
                </p>
              ) : (
                <div className="space-y-3">
                  {preview.scored.map((s, i) => (
                    <QuoteRow
                      key={s.quote.source + i}
                      scored={s}
                      rank={i + 1}
                      isWinner={preview.best?.quote.source === s.quote.source}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {decision && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight">
                Decision trail
              </h2>
              <ReasoningTrail steps={decision.reasoning} />
            </section>
          )}
        </div>
      </div>

      <style jsx>{`
        .select,
        .input {
          width: 100%;
          background: white;
          border: 2px solid #1a1a2e;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .select:focus,
        .input:focus {
          outline: 3px solid #4f3cc9;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
