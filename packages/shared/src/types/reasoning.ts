/**
 * A structured reasoning entry. The agent emits one of these for every
 * step of the pipeline so the dashboard can render the decision-trail
 * without re-running anything.
 */
export interface ReasoningStep {
  step:
    | "intent"
    | "resolve"
    | "policy_select"
    | "quotes_fetched"
    | "score"
    | "validate"
    | "agent_token_switch"
    | "execute"
    | "tx_confirmed"
    | "rejected"
    | "error";
  message: string;
  /** Optional structured payload for the dashboard to render richly. */
  data?: Record<string, unknown>;
  timestamp: string;
}
