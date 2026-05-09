import type { ReasoningStep } from "@routeguardian/shared";
import { cn } from "@/lib/cn";

const STEP_STYLES: Record<
  ReasoningStep["step"],
  { dot: string; label: string }
> = {
  intent: { dot: "bg-purple", label: "INTENT" },
  resolve: { dot: "bg-purple-soft", label: "RESOLVE" },
  policy_select: { dot: "bg-yellow", label: "POLICY" },
  quotes_fetched: { dot: "bg-sky", label: "QUOTES" },
  score: { dot: "bg-sky", label: "SCORE" },
  validate: { dot: "bg-mint", label: "VALIDATE" },
  agent_token_switch: { dot: "bg-purple-soft", label: "TOKEN" },
  execute: { dot: "bg-orange", label: "EXECUTE" },
  tx_confirmed: { dot: "bg-mint", label: "TX" },
  rejected: { dot: "bg-coral", label: "REJECTED" },
  error: { dot: "bg-coral", label: "ERROR" },
};

export function ReasoningTrail({ steps }: { steps: ReasoningStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="rounded-petal border-2 border-dashed border-ink/20 px-5 py-6 text-center text-sm text-ink-soft">
        Decision trail will appear here.
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 pl-6">
      <span
        aria-hidden
        className="absolute left-2.5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-ink/30"
      />
      {steps.map((step, i) => {
        const style = STEP_STYLES[step.step];
        return (
          <li key={i} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-ink",
                style.dot,
              )}
            />
            <div className="rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full border-2 border-ink px-2 py-0.5 font-bold uppercase tracking-wider",
                    style.dot,
                    style.dot === "bg-purple" || style.dot === "bg-orange" || style.dot === "bg-coral"
                      ? "text-cream"
                      : "text-ink",
                  )}
                >
                  {style.label}
                </span>
                <span className="text-ink-soft">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink">{step.message}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
