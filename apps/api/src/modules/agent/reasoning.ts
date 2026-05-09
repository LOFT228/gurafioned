import type { ReasoningStep } from "@routeguardian/shared";

/**
 * Mutable reasoning trail builder. The orchestrator mints one of these
 * per intent and appends a step at every meaningful checkpoint so the
 * dashboard can render the agent's decision-trail without re-running
 * anything.
 */
export class ReasoningTrail {
  private readonly steps: ReasoningStep[] = [];

  push(
    step: ReasoningStep["step"],
    message: string,
    data?: Record<string, unknown>,
  ): this {
    this.steps.push({
      step,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
    return this;
  }

  snapshot(): ReasoningStep[] {
    // Defensive copy so consumers can't mutate the live trail.
    return this.steps.map((s) => ({ ...s }));
  }
}
