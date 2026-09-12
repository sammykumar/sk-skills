#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO"
find . -path './archive' -prune -o -name SKILL.md -not -path '*/node_modules/*' -print | sed 's|^\./||' | sort
