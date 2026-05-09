import type { PolicyUsage } from "@routeguardian/shared";
import { prisma } from "../../db/prisma.js";

/**
 * Daily-spend tracking per policy. Stored in UTC YYYY-MM-DD buckets so the
 * cap rolls over consistently regardless of the host timezone.
 */

export function todayUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export async function getUsageForToday(policyName: string): Promise<PolicyUsage | null> {
  const day = todayUtc();
  const row = await prisma.policyUsage.findUnique({
    where: { policyName_day: { policyName, day } },
  });
  if (!row) return null;
  return {
    policyName: row.policyName,
    day: row.day,
    spentUsd: row.spentUsd,
    count: row.count,
  };
}

export async function recordSpend(policyName: string, usdValue: number): Promise<void> {
  const day = todayUtc();
  await prisma.policyUsage.upsert({
    where: { policyName_day: { policyName, day } },
    create: { policyName, day, spentUsd: usdValue, count: 1 },
    update: { spentUsd: { increment: usdValue }, count: { increment: 1 } },
  });
}
