import type { Quote, ScoredQuote } from "./quote.js";
import type { PolicyTier, ValidationFailureCode } from "./policy.js";
import type { ReasoningStep } from "./reasoning.js";

export type DecisionStatus =
  | "approved"
  | "rejected"
  | "awaiting_confirmation"
  | "executed"
  | "failed";

export interface Decision {
  id: string;
  intentId: string;
  policyName: string;
  policyTier: PolicyTier;
  status: DecisionStatus;
  rejectionCode?: ValidationFailureCode;
  rejectionReason?: string;
  /** All quotes considered (including disqualified ones, for the audit). */
  scoredQuotes: ScoredQuote[];
  /** The winning quote, if any. */
  chosenQuote?: Quote;
  /** Structured reasoning shown in the dashboard. */
  reasoning: ReasoningStep[];
  createdAt: string;
}

export interface Execution {
  id: string;
  decisionId: string;
  agentTokenName: string;
  txHash?: string;
  txStatus: "pending" | "success" | "failed";
  receivedAmount?: string;
  cliStdout?: string;
  cliStderr?: string;
  createdAt: string;
}
