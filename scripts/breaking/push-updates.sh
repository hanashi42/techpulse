#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if git diff --quiet data/breaking.json 2>/dev/null; then
  echo "[breaking] No changes to data/breaking.json"
  exit 0
fi

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

git add data/breaking.json
git commit -m "breaking: update ${TIMESTAMP}"
git push

echo "[breaking] Pushed update at ${TIMESTAMP}"

if [ -n "${VERCEL_DEPLOY_HOOK:-}" ]; then
  curl -s -X POST "$VERCEL_DEPLOY_HOOK" > /dev/null
  echo "[breaking] Triggered Vercel deploy hook"
fi
