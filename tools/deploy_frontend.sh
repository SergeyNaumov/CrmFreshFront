#!/usr/bin/env bash
# Деплой фронта svcms-manager (CrmFreshFront dist/) на прод-сервер.
#
# Что делает:
#   1. rsync dist/ -> {REMOTE}/  БЕЗ перезаписи favicon.ico/favicon.svg
#      (в dist лежит чужой фавикон из public/ — затирал фирменный на проде);
#   2. фирменные favicon из build/favicon/ заливаются явно (источник истины).
#
# Запуск (из корня репозитория, после npm run build):
#   tools/deploy_frontend.sh
#   REMOTE_HOST=... REMOTE_PORT=7725 REMOTE_USER=naumov REMOTE_DIR=... tools/deploy_frontend.sh
#
# Устойчивость к флакающему SSH прод-сервера: RETRIES/RETRY_DELAY.
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-185.76.252.12}"
REMOTE_PORT="${REMOTE_PORT:-7725}"
REMOTE_USER="${REMOTE_USER:-naumov}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/svcms/manager/frontend}"
RETRIES="${RETRIES:-5}"
RETRY_DELAY="${RETRY_DELAY:-30}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[ -d dist ] || { echo "нет dist/ — сначала npm run build" >&2; exit 1; }
[ -d build/favicon ] || { echo "нет build/favicon/" >&2; exit 1; }

run_step() {
  local desc="$1"; shift
  local attempt=1
  while true; do
    echo "▶ $desc (попытка $attempt/$RETRIES)"
    if "$@"; then
      return 0
    fi
    if [ "$attempt" -ge "$RETRIES" ]; then
      echo "❌ $desc: не удалось после $RETRIES попыток" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$RETRY_DELAY"
  done
}

SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

# 1. dist/ без favicon (флаги как в syncsvcmsmanager.py)
run_step "dist/ -> ${SSH_TARGET}:${REMOTE_DIR}/ (без favicon*)" \
  rsync -rltvz -O --no-perms --no-owner --no-group \
    --exclude='favicon.ico' --exclude='favicon.svg' \
    --exclude='__pycache__/' \
    -e "ssh -p ${REMOTE_PORT}" \
    dist/ "${SSH_TARGET}:${REMOTE_DIR}/"

# 2. фирменные favicon (источник истины — build/favicon/)
run_step "build/favicon/ -> ${SSH_TARGET}:${REMOTE_DIR}/" \
  rsync -rltvz -O --no-perms --no-owner --no-group \
    -e "ssh -p ${REMOTE_PORT}" \
    build/favicon/ "${SSH_TARGET}:${REMOTE_DIR}/"

echo "✅ Готово: фронт задеплоен, favicon — фирменный (build/favicon/)."
