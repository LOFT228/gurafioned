import type {
  Decision,
  PolicyPreset,
  ResolvedIntent,
  ScoredQuote,
} from "@routeguardian/shared";
import { compareRoutes } from "../routes/comparator.js";
import { selectPolicyForUsd } from "../policies/selector.js";
import { runAllValidators } from "../policies/validators.js";
import { getUsageForToday, recordSpend } from "../ledger/usage.js";
import {
  persistDecision,
  persistExecution,
  persistIntent,
} from "../ledger/audit.js";
import { useAgentToken, executeSwap, ZerionSwapError } from "../zerion/index.js";
import { ReasoningTrail } from "./reasoning.js";
import { parseAndResolveIntent } from "./intent.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/**
 * The end-to-end agent pipeline. This is the single entry point for all
 * autonomous behaviour — the HTTP layer and the scheduler both call this.
 *
 * Steps:
 *   1. Parse + resolve the intent (mints + USD value).
 *   2. Persist the intent so we have an audit anchor even if we crash mid-run.
 *   3. Select the policy tier.
 *   4. Fan out quotes to every enabled source, score and rank them.
 *   5. Run every validator.
 *   6. If approved (and not awaiting confirmation): switch agent token,
 *      execute via Zerion, persist execution, increment daily usage.
 *   7. Return a Decision the dashboard can render.
 */

export type OrchestratorOutcome =
  | { kind: "approved_and_executed"; decision: Decision; txHash: string }
  | { kind: "rejected"; decision: Decision }
  | { kind: "awaiting_confirmation"; decision: Decision };

export async function executeIntent(rawIntent: unknown): Promise<OrchestratorOutcome> {
  const trail = new ReasoningTrail();

  // --- Step 1+2: parse + resolve + persist intent ---
  const intent = await parseAndResolveIntent(rawIntent);
  trail.push("intent", buildIntentMessage(intent), {
    fromMint: intent.fromMint,
    toMint: intent.toMint,
    usdValue: intent.usdValue,
  });

  const intentId = await persistIntent(intent);
  trail.push("resolve", `Resolved mints + priced trade at $${intent.usdValue.toFixed(2)}.`);

  // --- Step 3: pick policy ---
  const policy = await selectPolicyForUsd(intent.usdValue);
  trail.push(
    "policy_select",
    `Selected ${policy.name} (tier=${policy.tier}, range=$${policy.usdRange.min}–${policy.usdRange.max ?? "∞"}).`,
    { policyName: policy.name, policyTier: policy.tier },
  );

  // --- Step 4: route comparison ---
  const amountIn = toBaseUnits(intent.amount, intent.fromTokenDecimals);
  const cmp = await compareRoutes(
    {
      inMint: intent.fromMint,
      outMint: intent.toMint,
      amountIn,
      slippageBps: Math.round(policy.maxSlippagePct * 100),
    },
    policy,
  );

  trail.push(
    "quotes_fetched",
    `Fetched ${cmp.results.filter((r) => r.ok).length}/${cmp.results.length} quotes.`,
    {
      results: cmp.results.map((r) =>
        r.ok
          ? { source: r.quote.source, ok: true, responseTimeMs: r.quote.responseTimeMs }
          : { source: r.source, ok: false, error: r.error },
      ),
    },
  );

  if (cmp.scored.length > 0) {
    trail.push(
      "score",
      buildScoreMessage(cmp.scored, cmp.best),
      { ranked: cmp.scored.map((s) => ({ source: s.quote.source, score: s.score, disqualified: s.disqualified })) },
    );
  }

  // --- Step 5: validation ---
  const usage = await getUsageForToday(policy.name);
  const validation = runAllValidators({
    intent,
    policy,
    usage,
    best: cmp.best,
  });

  if (!validation.ok) {
    trail.push("rejected", validation.message, {
      code: validation.code,
    });
    const decisionId = await persistDecision({
      intentId,
      policyName: policy.name,
      policyTier: policy.tier,
      status: "rejected",
      rejectionCode: validation.code,
      rejectionReason: validation.message,
      scoredQuotes: cmp.scored,
      chosenSource: undefined,
      reasoning: trail.snapshot(),
    });
    return {
      kind: "rejected",
      decision: buildDecisionView({
        id: decisionId,
        intentId,
        policy,
        status: "rejected",
        rejectionCode: validation.code,
        rejectionReason: validation.message,
        scoredQuotes: cmp.scored,
        chosenQuote: undefined,
        reasoning: trail.snapshot(),
      }),
    };
  }

  // From here `cmp.best` is non-null (validators guarantee it).
  const winner: ScoredQuote = cmp.best!;
  trail.push(
    "validate",
    `All validators passed. Winning route: ${winner.quote.source} (${winner.quote.routePlanSummary.join(" → ") || "direct"}).`,
  );

  // --- Step 5b: large-trade tier requires manual confirmation ---
  if (policy.requiresConfirmation) {
    trail.push(
      "rejected",
      `${policy.name} requires manual confirmation before execution.`,
    );
    const decisionId = await persistDecision({
      intentId,
      policyName: policy.name,
      policyTier: policy.tier,
      status: "awaiting_confirmation",
      scoredQuotes: cmp.scored,
      chosenSource: winner.quote.source,
      reasoning: trail.snapshot(),
    });
    return {
      kind: "awaiting_confirmation",
      decision: buildDecisionView({
        id: decisionId,
        intentId,
        policy,
        status: "awaiting_confirmation",
        scoredQuotes: cmp.scored,
        chosenQuote: winner.quote,
        reasoning: trail.snapshot(),
      }),
    };
  }

  // --- Step 6: execute ---
  const agentTokenName = env[policy.agentTokenEnvVar];
  await useAgentToken(env.ZERION_WALLET_NAME);
  trail.push("agent_token_switch", `Switched active wallet to ${env.ZERION_WALLET_NAME} (token=${agentTokenName}).`);

  let decisionId: string;
  try {
    const swapResult = await executeSwap({
      amount: intent.amount,
      fromToken: intent.fromTokenSymbol,
      toToken: intent.toTokenSymbol,
      slippagePct: policy.maxSlippagePct,
      timeoutSec: policy.txTimeoutSec,
      walletName: env.ZERION_WALLET_NAME,
    });

    trail.push("execute", `Submitted via Zerion CLI: zerion swap solana ${intent.amount} ${intent.fromTokenSymbol} ${intent.toTokenSymbol} --slippage ${policy.maxSlippagePct}.`);
    trail.push(
      "tx_confirmed",
      `Tx ${swapResult.txStatus}: ${swapResult.txHash}` +
        (swapResult.receivedAmount ? ` — received ${swapResult.receivedAmount}` : ""),
      {
        txHash: swapResult.txHash,
        txStatus: swapResult.txStatus,
        liquiditySource: swapResult.liquiditySource,
      },
    );

    decisionId = await persistDecision({
      intentId,
      policyName: policy.name,
      policyTier: policy.tier,
      status: swapResult.txStatus === "success" ? "executed" : "approved",
      scoredQuotes: cmp.scored,
      chosenSource: winner.quote.source,
      reasoning: trail.snapshot(),
    });
    await persistExecution({
      decisionId,
      agentTokenName,
      txHash: swapResult.txHash,
      txStatus: swapResult.txStatus,
      receivedAmount: swapResult.receivedAmount,
      cliStdout: swapResult.stdout,
      cliStderr: swapResult.stderr,
    });
    if (swapResult.txStatus === "success") {
      await recordSpend(policy.name, intent.usdValue);
    }

    return {
      kind: "approved_and_executed",
      txHash: swapResult.txHash,
      decision: buildDecisionView({
        id: decisionId,
        intentId,
        policy,
        status: swapResult.txStatus === "success" ? "executed" : "approved",
        scoredQuotes: cmp.scored,
        chosenQuote: winner.quote,
        reasoning: trail.snapshot(),
      }),
    };
  } catch (err) {
    const cliErr = err instanceof ZerionSwapError ? err : null;
    const message = (err as Error).message;
    trail.push("error", `Zerion CLI execution failed: ${message}`, {
      code: cliErr?.code,
    });
    logger.error("orchestrator.execute_failed", { message });

    decisionId = await persistDecision({
      intentId,
      policyName: policy.name,
      policyTier: policy.tier,
      status: "failed",
      rejectionReason: message,
      scoredQuotes: cmp.scored,
      chosenSource: winner.quote.source,
      reasoning: trail.snapshot(),
    });
    await persistExecution({
      decisionId,
      agentTokenName,
      txStatus: "failed",
      cliStdout: cliErr?.stdout,
      cliStderr: cliErr?.stderr,
    });
    return {
      kind: "rejected",
      decision: buildDecisionView({
        id: decisionId,
        intentId,
        policy,
        status: "failed",
        rejectionReason: message,
        scoredQuotes: cmp.scored,
        chosenQuote: winner.quote,
        reasoning: trail.snapshot(),
      }),
    };
  }
}

function buildIntentMessage(intent: ResolvedIntent): string {
  return `Swap ${intent.amount} ${intent.fromTokenSymbol} → ${intent.toTokenSymbol} ($${intent.usdValue.toFixed(2)}, source=${intent.source}).`;
}

function buildScoreMessage(
  ranked: ScoredQuote[],
  best: ScoredQuote | null,
): string {
  if (ranked.length === 0) return "No quotes to score.";
  if (!best) {
    return `All ${ranked.length} quotes were disqualified by policy gates.`;
  }
  const others = ranked.filter((r) => r !== best);
  if (others.length === 0) {
    return `${best.quote.source} won (only viable quote).`;
  }
  const runnerUp = others[0]!;
  return `${best.quote.source} won (out=${best.quote.outAmountWithSlippage}) over ${runnerUp.quote.source} (out=${runnerUp.quote.outAmountWithSlippage}); priceImpact ${(best.quote.priceImpactPct * 100).toFixed(3)}% vs ${(runnerUp.quote.priceImpactPct * 100).toFixed(3)}%.`;
}

/**
 * Converts a decimal amount to the smallest unit (base units) for the given
 * decimals. Uses string math so we don't lose precision on tiny tokens.
 */
function toBaseUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  // Strip leading zeros (but keep at least one digit).
  const combined = `${whole ?? "0"}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return combined === "" ? "0" : combined;
}

function buildDecisionView(input: {
  id: string;
  intentId: string;
  policy: PolicyPreset;
  status: Decision["status"];
  rejectionCode?: Decision["rejectionCode"];
  rejectionReason?: string;
  scoredQuotes: ScoredQuote[];
  chosenQuote?: Decision["chosenQuote"];
  reasoning: Decision["reasoning"];
}): Decision {
  return {
    id: input.id,
    intentId: input.intentId,
    policyName: input.policy.name,
    policyTier: input.policy.tier,
    status: input.status,
    rejectionCode: input.rejectionCode,
    rejectionReason: input.rejectionReason,
    scoredQuotes: input.scoredQuotes,
    chosenQuote: input.chosenQuote,
    reasoning: input.reasoning,
    createdAt: new Date().toISOString(),
  };
}
