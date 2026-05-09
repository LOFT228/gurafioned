import { env } from "../config/env.js";

/**
 * Tiny structured logger. Uses pino-pretty in dev for human output;
 * Fastify wires its own pino instance, but we use this one inside
 * non-request code paths (scheduler, CLI wrapper, scoring) so the
 * format stays consistent.
 */
export const logger = {
  info: (msg: string, data?: Record<string, unknown>) =>
    write("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) =>
    write("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) =>
    write("error", msg, data),
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (env.NODE_ENV !== "production") write("debug", msg, data);
  },
};

function write(level: string, msg: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg,
    ...(data ?? {}),
  });
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}
