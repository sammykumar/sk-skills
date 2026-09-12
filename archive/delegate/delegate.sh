#!/usr/bin/env bash
# delegate.sh <work|personal> "<task>" [--read]
# Posts a task to the other machine's Claude and waits for the result.
set -uo pipefail
CONF="${DEVLAB_RELAY_CONFIG:-$HOME/.config/devlab-relay/config}"
# shellcheck disable=SC1090
source "$CONF"
: "${RELAY_URL:?}" ; : "${TOKEN:?}" ; : "${MACHINE:?}"
RELAY_PROXY="${RELAY_PROXY:-}"
WAIT_BUDGET="${WAIT_BUDGET:-300}"

TARGET="${1:?usage: delegate.sh <work|personal> \"task\" [--read]}"
TASK="${2:?task text required}"
PERM=full; [ "${3:-}" = "--read" ] && PERM=read

jq_get() { python3 -c 'import sys,json;print(json.load(sys.stdin).get(sys.argv[1],""))' "$1"; }
curl_relay() { curl -fsS ${RELAY_PROXY:+--proxy "$RELAY_PROXY"} -H "Authorization: Bearer $TOKEN" "$@"; }

BODY=$(python3 -c 'import sys,json;print(json.dumps({"to":sys.argv[1],"from":sys.argv[2],"task":sys.argv[3],"perm":sys.argv[4]}))' \
        "$TARGET" "$MACHINE" "$TASK" "$PERM")
ID=$(curl_relay -X POST -H "Content-Type: application/json" -d "$BODY" "$RELAY_URL/tasks" | jq_get id)
[ -n "$ID" ] || { echo "error: relay did not return a task id" >&2; exit 1; }
echo "→ delegated to '$TARGET' (id=$ID, perm=$PERM); waiting up to ${WAIT_BUDGET}s..." >&2

DEADLINE=$(( $(date +%s) + WAIT_BUDGET ))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  R=$(curl_relay "$RELAY_URL/tasks/$ID" 2>/dev/null) || { sleep 3; continue; }
  ST=$(printf '%s' "$R" | jq_get status)
  if [ "$ST" = "done" ] || [ "$ST" = "failed" ]; then
    printf '%s' "$R" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("[OK]" if d.get("ok") else "[FAILED]");print(d.get("result") or "")'
    [ "$ST" = "done" ] && exit 0 || exit 2
  fi
  sleep 3
done
echo "timeout after ${WAIT_BUDGET}s; task $ID still running. Re-check: curl ... $RELAY_URL/tasks/$ID" >&2
exit 3
