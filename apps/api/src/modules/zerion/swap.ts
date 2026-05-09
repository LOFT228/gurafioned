import { runZerion } from "./client.js";
import { SOLANA_CHAIN } from "../../config/constants.js";
import { logger } from "../../lib/logger.js";

/**
 * Wraps `zerion swap solana <amount> <from> <to>`.
 *
 * IMPORTANT: this is the *only* place in the codebase that triggers
 * an on-chain transaction. Every guard rail (policy validators, agent
 * token switching, token allowlist) must run *before* this function
 * is called. By the time we get here, the decision has already been
 * approved.
 */

export interface ExecuteSwapInput {
  /** Decimal amount of `fromToken`, e.g. "100", "0.5". */
  amount: string;
  /** Symbol or SPL mint of the input token. */
  fromToken: string;
  /** Symbol or SPL mint of the output token. */
  toToken: string;
  /** Slippage tolerance in percent (0–100). Always set from the active policy. */
  slippagePct: number;
  /** Confirmation timeout in seconds. From the active policy. */
  timeoutSec: number;
  /** Wallet name (matches `zerion wallet create --name <name>`). */
  walletName: string;
}

export interface ExecuteSwapResult {
  txHash: string;
  txStatus: "success" | "pending" | "failed";
  receivedAmount?: string;
  liquiditySource?: string;
  raw: unknown;
  stdout: string;
  stderr: string;
}

interface ZerionSwapStdout {
  swap?: {
    chain?: string;
    input?: string;
    output?: string;
    minOutput?: string;
    fee?: string;
    source?: string;
    estimatedTime?: string;
    sender?: string;
  };
  tx?: {
    hash?: string;
    status?: "success" | "pending" | "failed";
    blockNumber?: number;
    gasUsed?: number;
  };
  executed?: boolean;
}

export async function executeSwap(
  input: ExecuteSwapInput,
): Promise<ExecuteSwapResult> {
  const args = [
    "swap",
    SOLANA_CHAIN,
    input.amount,
    input.fromToken,
    input.toToken,
    "--wallet",
    input.walletName,
    "--slippage",
    String(input.slippagePct),
    "--timeout",
    String(input.timeoutSec),
  ];

  logger.info("zerion.swap.start", {
    chain: SOLANA_CHAIN,
    from: input.fromToken,
    to: input.toToken,
    amount: input.amount,
    slippagePct: input.slippagePct,
    wallet: input.walletName,
  });

  const result = await runZerion<ZerionSwapStdout>({
    args,
    timeoutMs: (input.timeoutSec + 30) * 1000,
  });

  if (!result.ok) {
    logger.error("zerion.swap.failed", {
      code: result.code,
      message: result.message,
    });
    throw new ZerionSwapError(result.code, result.message, result.stdout, result.stderr);
  }

  const data = result.data;
  const txHash = data.tx?.hash;
  if (!txHash) {
    throw new ZerionSwapError(
      "missing_tx_hash",
      "Zerion CLI returned success but no tx.hash field",
      result.stdout,
      result.stderr,
    );
  }

  const txStatus = (data.tx?.status ?? "pending") as "success" | "pending" | "failed";

  logger.info("zerion.swap.success", { txHash, txStatus });

  return {
    txHash,
    txStatus,
    receivedAmount: data.swap?.output,
    liquiditySource: data.swap?.source,
    raw: data,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export class ZerionSwapError extends Error {
  readonly code: string;
  readonly stdout: string;
  readonly stderr: string;

  constructor(code: string, message: string, stdout: string, stderr: string) {
    super(message);
    this.name = "ZerionSwapError";
    this.code = code;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}
