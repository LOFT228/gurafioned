#!/usr/bin/env bash
# ============================================================
# RouteGuardian — Zerion CLI setup
#
# Idempotent: safe to re-run. Creates (if missing) the trading
# wallet, three scoped policies (small / medium / large), and
# one agent token per policy. Echoes the IDs to stdout so the
# .env file can be filled in by hand.
#
# Requires:
#   - zerion-cli installed globally:    npm install -g zerion-cli
#   - ZERION_API_KEY exported in env
#
# Usage:
#   bash scripts/setup-zerion.sh
# ============================================================

set -euo pipefail

WALLET_NAME="${ZERION_WALLET_NAME:-routeguardian-bot}"

if ! command -v zerion >/dev/null 2>&1; then
  echo "ERROR: zerion CLI not found. Install with: npm install -g zerion-cli" >&2
  exit 1
fi

if [[ -z "${ZERION_API_KEY:-}" ]]; then
  echo "ERROR: ZERION_API_KEY env var is required." >&2
  echo "       Get a free key at https://dashboard.zerion.io" >&2
  exit 1
fi

echo "==> RouteGuardian — Zerion setup"
echo "    wallet: ${WALLET_NAME}"
echo

# --- Wallet ----------------------------------------------------------------
echo "==> 1/3  Wallet"
if zerion wallet list 2>/dev/null | grep -q "\"${WALLET_NAME}\""; then
  echo "    ✓ Wallet '${WALLET_NAME}' already exists, skipping."
else
  echo "    Creating new wallet '${WALLET_NAME}'..."
  echo "    You'll be prompted for a passphrase — keep it safe."
  zerion wallet create --name "${WALLET_NAME}"
fi
echo

# --- Policies --------------------------------------------------------------
echo "==> 2/3  Policies (Solana-only, deny-transfers, deny-approvals)"

create_policy() {
  local name="$1"
  local expires="$2"

  if zerion agent list-policies 2>/dev/null | grep -q "\"${name}\""; then
    echo "    ✓ Policy '${name}' already exists, skipping."
    return 0
  fi

  echo "    Creating policy '${name}' (expires=${expires})..."
  zerion agent create-policy \
    --name "${name}" \
    --chains solana \
    --expires "${expires}" \
    --deny-transfers \
    --deny-approvals
}

create_policy "small-trade-policy"  "7d"
create_policy "medium-trade-policy" "7d"
create_policy "large-trade-policy"  "24h"
echo

# --- Agent tokens ----------------------------------------------------------
echo "==> 3/3  Agent tokens (one per policy)"

create_token() {
  local token_name="$1"
  local policy_name="$2"

  if zerion agent list-tokens 2>/dev/null | grep -q "\"${token_name}\""; then
    echo "    ✓ Token '${token_name}' already exists, skipping."
    return 0
  fi

  # Resolve the policy ID by name from list-policies output.
  local policy_id
  policy_id=$(zerion agent list-policies 2>/dev/null \
    | python3 -c "import sys, json; data=json.load(sys.stdin); print(next((p['id'] for p in data.get('policies', []) if p['name']==sys.argv[1]), ''))" \
    "${policy_name}" 2>/dev/null || true)

  if [[ -z "${policy_id}" ]]; then
    echo "    ! Could not resolve policy ID for '${policy_name}'." >&2
    echo "      Check 'zerion agent list-policies' output." >&2
    return 1
  fi

  echo "    Creating token '${token_name}' bound to policy ${policy_id}..."
  echo "    You'll be prompted for the wallet passphrase."
  zerion agent create-token \
    --name "${token_name}" \
    --wallet "${WALLET_NAME}" \
    --policy "${policy_id}"
}

create_token "rg-small"  "small-trade-policy"
create_token "rg-medium" "medium-trade-policy"
create_token "rg-large"  "large-trade-policy"
echo

# --- Summary ---------------------------------------------------------------
echo "==> Done."
echo
echo "    Verify with:"
echo "      zerion wallet list"
echo "      zerion agent list-policies"
echo "      zerion agent list-tokens"
echo
echo "    Make sure your .env has:"
echo "      ZERION_WALLET_NAME=${WALLET_NAME}"
echo "      ZERION_AGENT_TOKEN_SMALL=rg-small"
echo "      ZERION_AGENT_TOKEN_MEDIUM=rg-medium"
echo "      ZERION_AGENT_TOKEN_LARGE=rg-large"
echo
echo "    Fund the wallet with SOL + USDC, then start the agent:  pnpm dev"
