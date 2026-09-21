#!/usr/bin/env bash
set -euo pipefail

# Clean up a git worktree, its Herd site, and optionally its database.
#
# Usage:
#   bin/cleanup-worktree.sh <worktree-name> [--drop-db]
#
# Example:
#   bin/cleanup-worktree.sh feature-my-feature
#   bin/cleanup-worktree.sh feature-my-feature --drop-db
#
# This will:
#   1. Unsecure and unlink the Herd site
#   2. Remove the git worktree
#   3. (with --drop-db) Drop the MySQL database recorded in the worktree .env

DROP_DB=0
WORKTREE_NAME=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --drop-db)  DROP_DB=1; shift ;;
        -h|--help)
            sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        -*)
            echo "Error: Unknown option [$1]." >&2
            exit 1
            ;;
        *)
            if [[ -n "$WORKTREE_NAME" ]]; then
                echo "Error: Worktree name was already provided." >&2
                exit 1
            fi
            WORKTREE_NAME="$1"
            shift
            ;;
    esac
done

if [[ -z "$WORKTREE_NAME" ]]; then
    echo "Usage: bin/cleanup-worktree.sh <worktree-name> [--drop-db]" >&2
    exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.worktrees/${WORKTREE_NAME}"

if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Error: Worktree not found at ${WORKTREE_PATH}" >&2
    exit 1
fi

# Capture DB details before removing the worktree (drop happens last).
DB_TO_DROP=""
DB_HOST=""
DB_PORT=""
DB_USER=""
DB_PASS=""

if [[ "$DROP_DB" -eq 1 && -f "${WORKTREE_PATH}/.env" ]]; then
    DB_TO_DROP=$(grep -E "^DB_DATABASE=" "${WORKTREE_PATH}/.env" | head -1 | cut -d= -f2-)
    DB_HOST=$(grep -E "^DB_HOST=" "${WORKTREE_PATH}/.env" | head -1 | cut -d= -f2-)
    DB_PORT=$(grep -E "^DB_PORT=" "${WORKTREE_PATH}/.env" | head -1 | cut -d= -f2-)
    DB_USER=$(grep -E "^DB_USERNAME=" "${WORKTREE_PATH}/.env" | head -1 | cut -d= -f2-)
    DB_PASS=$(grep -E "^DB_PASSWORD=" "${WORKTREE_PATH}/.env" | head -1 | cut -d= -f2-)
fi

echo "==> Unsecuring Herd site '${WORKTREE_NAME}'"
herd unsecure "$WORKTREE_NAME" 2>/dev/null || true

echo "==> Unlinking Herd site '${WORKTREE_NAME}'"
herd unlink "$WORKTREE_NAME" 2>/dev/null || true

echo "==> Removing worktree at ${WORKTREE_PATH}"
git worktree remove "$WORKTREE_PATH" --force

if [[ "$DROP_DB" -eq 1 && -n "$DB_TO_DROP" ]]; then
    if [[ ! "$DB_TO_DROP" =~ ^[A-Za-z0-9_]+$ ]]; then
        echo "Refusing to drop database with unusual name [${DB_TO_DROP}]. Drop it manually."
    else
        echo "==> Dropping database [${DB_TO_DROP}]"
        DB_HOST="${DB_HOST:-127.0.0.1}"
        DB_PORT="${DB_PORT:-3306}"
        DB_USER="${DB_USER:-root}"

        if [[ -n "$DB_PASS" ]]; then
            MYSQL_PWD="$DB_PASS" mysql --user="$DB_USER" --host="$DB_HOST" --port="$DB_PORT" \
                --execute="DROP DATABASE IF EXISTS \`${DB_TO_DROP}\`;"
        else
            mysql --user="$DB_USER" --host="$DB_HOST" --port="$DB_PORT" \
                --execute="DROP DATABASE IF EXISTS \`${DB_TO_DROP}\`;"
        fi
    fi
fi

echo ""
echo "Worktree '${WORKTREE_NAME}' cleaned up."
if [[ "$DROP_DB" -eq 0 ]]; then
    echo "Database (if any) left intact. Pass --drop-db next time to remove it."
fi
echo "Branch still exists — delete it manually with: git branch -D <branch-name>"
