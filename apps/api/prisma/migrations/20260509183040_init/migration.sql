-- CreateTable
CREATE TABLE "SwapIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromToken" TEXT NOT NULL,
    "toToken" TEXT NOT NULL,
    "fromMint" TEXT NOT NULL,
    "toMint" TEXT NOT NULL,
    "fromSymbol" TEXT NOT NULL,
    "toSymbol" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "usdValue" REAL NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "source" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intentId" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "policyTier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rejectionCode" TEXT,
    "rejectionReason" TEXT,
    "scoredQuotes" TEXT NOT NULL,
    "chosenSource" TEXT,
    "reasoning" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "SwapIntent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "agentTokenName" TEXT NOT NULL,
    "txHash" TEXT,
    "txStatus" TEXT NOT NULL,
    "receivedAmount" TEXT,
    "cliStdout" TEXT,
    "cliStderr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Execution_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyName" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "spentUsd" REAL NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Decision_intentId_key" ON "Decision"("intentId");

-- CreateIndex
CREATE INDEX "Decision_status_idx" ON "Decision"("status");

-- CreateIndex
CREATE INDEX "Decision_policyName_idx" ON "Decision"("policyName");

-- CreateIndex
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Execution_decisionId_key" ON "Execution"("decisionId");

-- CreateIndex
CREATE INDEX "Execution_txStatus_idx" ON "Execution"("txStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyUsage_policyName_day_key" ON "PolicyUsage"("policyName", "day");
