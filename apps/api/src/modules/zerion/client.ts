import { spawn } from "node:child_process";
import { logger } from "../../lib/logger.js";

/**
 * Thin wrapper around the `zerion` CLI binary. Every other module in
 * `modules/zerion/` calls into this one — keeping the `spawn` surface
 * area in a single file makes the CLI integration testable and lets
 * us swap in a mock for unit tests.
 *
 * The CLI emits structured JSON to stdout and structured errors to
 * stderr. We capture both, parse stdout as JSON when possible, and
 * return a tagged result.
 */

export interface ZerionInvocation {
  args: string[];
  /** Extra env vars merged on top of process.env (e.g. ZERION_API_KEY). */
  env?: NodeJS.ProcessEnv;
  /** Hard timeout in ms. Default 90s — Zerion swaps usually settle in <30s. */
  timeoutMs?: number;
}

export type ZerionResult<T = unknown> =
  | { ok: true; data: T; stdout: string; stderr: string }
  | {
      ok: false;
      code: string;
      message: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
    };

const DEFAULT_TIMEOUT_MS = 90_000;

export async function runZerion<T = unknown>(
  invocation: ZerionInvocation,
): Promise<ZerionResult<T>> {
  const { args, env, timeoutMs = DEFAULT_TIMEOUT_MS } = invocation;

  // Redact anything that looks like a passphrase or key in logs.
  logger.debug("zerion.spawn", { args: redactArgs(args) });

  return new Promise((resolve) => {
    const child = spawn("zerion", args, {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        code: "spawn_error",
        message: err.message,
        stdout,
        stderr,
        exitCode: null,
      });
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);

      if (timedOut) {
        resolve({
          ok: false,
          code: "timeout",
          message: `zerion ${args[0] ?? ""} timed out after ${timeoutMs}ms`,
          stdout,
          stderr,
          exitCode,
        });
        return;
      }

      if (exitCode !== 0) {
        // The CLI emits structured errors to stderr; try to parse one out.
        const parsed = tryParseError(stderr);
        resolve({
          ok: false,
          code: parsed.code,
          message: parsed.message,
          stdout,
          stderr,
          exitCode,
        });
        return;
      }

      // Success path — try to parse stdout as JSON.
      try {
        const data = JSON.parse(stdout) as T;
        resolve({ ok: true, data, stdout, stderr });
      } catch (err) {
        resolve({
          ok: false,
          code: "invalid_json",
          message: `Zerion stdout was not valid JSON: ${(err as Error).message}`,
          stdout,
          stderr,
          exitCode,
        });
      }
    });
  });
}

/**
 * Best-effort structured-error parser. The Zerion CLI emits errors as a
 * single JSON line on stderr like:
 *   { "error": { "code": "insufficient_funds", "message": "..." } }
 * but some commands print plain text on partial failure, so we fall back
 * to the whole stderr as the message.
 */
function tryParseError(stderr: string): { code: string; message: string } {
  const trimmed = stderr.trim();
  if (!trimmed) return { code: "unknown_error", message: "Empty stderr" };

  // Try the last non-empty line first (CLI often emits a banner before).
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    try {
      const obj = JSON.parse(line);
      if (obj && typeof obj === "object" && obj.error) {
        const code = obj.error.code ?? "unknown_error";
        const message = obj.error.message ?? line;
        return { code, message };
      }
    } catch {
      // not JSON, keep looking
    }
  }
  return { code: "cli_error", message: trimmed };
}

/**
 * Redacts arg values that look like sensitive material so they don't end up
 * in logs. Conservative — strips anything passed to `--passphrase`/`--key`.
 */
function redactArgs(args: string[]): string[] {
  const redacted: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    redacted.push(a);
    if (/^--(passphrase|key|api-key|policy-secret)$/.test(a) && i + 1 < args.length) {
      redacted.push("[REDACTED]");
      i++;
    }
  }
  return redacted;
}
