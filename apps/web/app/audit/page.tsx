import Link from "next/link";
import { api, type AuditRow } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  executed: "bg-mint text-ink",
  approved: "bg-mint-soft text-ink",
  rejected: "bg-coral text-ink",
  awaiting_confirmation: "bg-yellow text-ink",
  failed: "bg-coral text-ink",
};

export default async function AuditPage() {
  const data = await api.audit(100).catch(() => ({ decisions: [] }));

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="inline-block rounded-full border-2 border-ink bg-sky px-3 py-1 text-xs font-bold uppercase tracking-wider">
          Audit log
        </span>
        <h1 className="text-4xl font-bold tracking-tight">
          Every decision, <span className="text-purple">on the record</span>.
        </h1>
        <p className="max-w-2xl text-ink-soft">
          Both approved and rejected decisions are stored — including which
          quotes were considered and why a rejected route was rejected.
        </p>
      </header>

      <section className="space-y-3">
        {data.decisions.length === 0 ? (
          <p className="rounded-petal border-2 border-dashed border-ink/20 px-5 py-12 text-center text-ink-soft">
            No decisions yet.
          </p>
        ) : (
          data.decisions.map((d: AuditRow) => (
            <article
              key={d.id}
              id={d.id}
              className="rounded-petal border-2 border-ink/15 bg-cream p-5"
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">
                    {d.intent
                      ? `${d.intent.amount} ${d.intent.fromToken} → ${d.intent.toToken}`
                      : d.id}
                    {d.intent && (
                      <span className="ml-2 text-ink-soft">
                        (${d.intent.usdValue.toFixed(2)})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {new Date(d.createdAt).toLocaleString()} · {d.policyName}
                    {d.chosenSource ? ` · winner: ${d.chosenSource}` : ""}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase " +
                    (STATUS_STYLES[d.status] ?? "bg-cream-deep text-ink")
                  }
                >
                  {d.status}
                </span>
              </header>

              {d.rejectionReason && (
                <p className="mt-3 rounded-2xl border-2 border-coral/40 bg-coral-soft/50 px-3 py-2 text-sm">
                  <strong className="font-semibold">Rejected:</strong>{" "}
                  {d.rejectionReason}
                </p>
              )}

              {d.execution?.txHash && (
                <p className="mt-3 text-xs">
                  <span className="text-ink-soft">Tx:</span>{" "}
                  <Link
                    href={`https://solscan.io/tx/${d.execution.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-purple hover:underline"
                  >
                    {d.execution.txHash.slice(0, 8)}…
                    {d.execution.txHash.slice(-8)}
                  </Link>
                  <span className="ml-2 text-ink-soft">
                    {d.execution.txStatus}
                  </span>
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
