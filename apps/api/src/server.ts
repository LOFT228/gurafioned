import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { loadPolicies } from "./modules/policies/registry.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPolicyRoutes } from "./routes/policies.js";
import { registerQuoteRoutes } from "./routes/quotes.js";
import { registerSwapRoutes } from "./routes/swaps.js";
import { registerAuditRoutes } from "./routes/audit.js";

async function main() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty", options: { translateTime: "HH:MM:ss.l" } },
    },
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Validate policies up-front — if a preset is malformed, fail fast at boot.
  await loadPolicies();

  await registerHealthRoutes(app);
  await registerPolicyRoutes(app);
  await registerQuoteRoutes(app);
  await registerSwapRoutes(app);
  await registerAuditRoutes(app);

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, "request_failed");
    reply.status(500).send({
      error: { code: "internal_error", message: err.message },
    });
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info("api.listening", { port: env.PORT });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API:", err);
  process.exit(1);
});
