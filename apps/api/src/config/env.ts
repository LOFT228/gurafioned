import { z } from "zod";

/**
 * Centralised, validated env access. Importing from `process.env` directly
 * is forbidden anywhere else in the codebase — always import from here.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("file:./prisma/dev.db"),

  // Zerion
  ZERION_API_KEY: z.string().min(1, "ZERION_API_KEY is required"),
  ZERION_WALLET_NAME: z.string().min(1).default("routeguardian-bot"),
  ZERION_AGENT_TOKEN_SMALL: z.string().min(1).default("rg-small"),
  ZERION_AGENT_TOKEN_MEDIUM: z.string().min(1).default("rg-medium"),
  ZERION_AGENT_TOKEN_LARGE: z.string().min(1).default("rg-large"),

  // Route sources
  ROUTE_SOURCES: z
    .string()
    .default("jupiter,titan")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
  ROUTE_SOURCE_TIMEOUT_MS: z.coerce.number().int().positive().default(1500),

  // Jupiter
  JUPITER_QUOTE_URL: z.string().url().default("https://lite-api.jup.ag/swap/v1/quote"),

  // Titan (optional)
  TITAN_API_URL: z.string().url().optional(),
  TITAN_API_KEY: z.string().optional(),

  // Demo overrides
  DEMO_LARGE_TIER_USD_OVERRIDE: z.coerce.number().positive().optional(),
});

function parseEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`\nInvalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = parseEnv();
export type Env = typeof env;
