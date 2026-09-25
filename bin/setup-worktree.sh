#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  bin/setup-worktree.sh <branch-name> [options]

Creates a git worktree for local development with Herd and an isolated MySQL
database. The script copies the root .env when it exists; otherwise it falls
back to .env.example and rewrites it for local Herd services.

Examples:
  bin/setup-worktree.sh feature/my-feature
  bin/setup-worktree.sh fix/chat-bug --skip-seed
  bin/setup-worktree.sh feature/something --base main --db-name gtech_custom
  bin/setup-worktree.sh feature/something --db-user=root --db-password=secret

Adopting a worktree someone else created:
  bin/setup-worktree.sh --adopt          # provisions the worktree you are in

  Editors and agent tools (T3 Code, Claude Code) create the git worktree
  themselves, then run a setup command inside it. --adopt skips worktree
  creation and provisions the current one, taking the branch from HEAD.

  Set WORKTREE_PROVISIONER to delegate provisioning to a host-specific command
  instead -- useful where the host also assigns a hostname, queue workers or a
  web server pool. It is called as: $WORKTREE_PROVISIONER <worktree-path>

Options:
  --adopt                   Provision the current worktree instead of creating one
  --base <branch>           Base branch to branch from (default: main)
  --app-url <url>           Override APP_URL (default: https://<worktree-name>.test)
  --db-name <name>          Override DB_DATABASE (default: gtech_<feature_snake>)
  --db-user <user>          Override DB_USERNAME
  --db-password <password>  Override DB_PASSWORD
  --db-host <host>          Override DB_HOST
  --db-port <port>          Override DB_PORT
  --env KEY=VALUE           Override any additional .env value (repeatable)
  --seeder <class>          Seeder class to run
  --skip-database           Do not create a new MySQL database
  --skip-install            Do not run composer install / bun install
  --skip-build              Do not run bun run build
  --skip-storage-link       Do not run php artisan storage:link
  --skip-migrate            Do not run migrations
  --skip-seed               Run migrations but do not seed
  --skip-herd               Do not link + secure in Herd
  --help, -h                Show this help
EOF
    exit "${1:-0}"
}

abort() {
    printf 'Error: %s\n' "$*" >&2
    exit 1
}

info() {
    printf '==> %s\n' "$*"
}

sanitize_kebab() {
    printf '%s' "$1" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's|/|-|g; s/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

to_snake() {
    printf '%s' "$1" | tr '-' '_'
}

quote_env_value() {
    local value="$1"

    if [[ -z "$value" ]]; then
        printf ''
        return
    fi

    if [[ "$value" == *[[:space:]#]* || "$value" == *\"* ]]; then
        value="${value//\\/\\\\}"
        value="${value//\"/\\\"}"
        printf '"%s"' "$value"
        return
    fi

    printf '%s' "$value"
}

set_env_value() {
    local env_file="$1"
    local key="$2"
    local value="$3"
    local formatted_value
    local temp_file

    formatted_value="$(quote_env_value "$value")"
    temp_file="$(mktemp)"

    awk -v key="$key" -v value="$formatted_value" '
        BEGIN { found = 0 }
        $0 ~ "^" key "=" { print key "=" value; found = 1; next }
        { print }
        END { if (!found) print key "=" value }
    ' "$env_file" > "$temp_file"

    mv "$temp_file" "$env_file"
}

read_env_value() {
    local env_file="$1"
    local key="$2"
    local line
    local value

    line="$(grep -E "^${key}=" "$env_file" | tail -n 1 || true)"

    if [[ -z "$line" ]]; then
        printf ''
        return
    fi

    value="${line#*=}"

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
    fi

    printf '%s' "$value"
}

resolve_binary() {
    local preferred="$1"
    local fallback="$2"

    if command -v "$preferred" >/dev/null 2>&1; then
        command -v "$preferred"
        return
    fi

    if [[ -n "$fallback" && -x "$fallback" ]]; then
        printf '%s' "$fallback"
        return
    fi

    abort "Required command [$preferred] was not found."
}

extract_host() {
    local url="$1"

    url="${url#*://}"
    url="${url%%/*}"
    url="${url%%:*}"

    printf '%s' "$url"
}

BRANCH_NAME=""
ADOPT_EXISTING=0
BASE_BRANCH="main"
APP_URL_OVERRIDE=""
DB_NAME_OVERRIDE=""
DB_USER_OVERRIDE=""
DB_PASSWORD_OVERRIDE=""
DB_HOST_OVERRIDE=""
DB_PORT_OVERRIDE=""
HAS_DB_USER_OVERRIDE=0
HAS_DB_PASSWORD_OVERRIDE=0
HAS_DB_HOST_OVERRIDE=0
HAS_DB_PORT_OVERRIDE=0
SEEDER_CLASS="DatabaseSeeder"
SHOULD_CREATE_DB=1
SHOULD_INSTALL=1
SHOULD_BUILD=1
SHOULD_STORAGE_LINK=1
SHOULD_MIGRATE=1
SHOULD_SEED=1
SHOULD_HERD=1
declare -a ENV_OVERRIDES=()
ENV_OVERRIDE_COUNT=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --adopt)        ADOPT_EXISTING=1; shift ;;
        --base=*)       BASE_BRANCH="${1#*=}"; shift ;;
        --base)         BASE_BRANCH="${2:?Missing value for --base}"; shift 2 ;;
        --app-url=*)    APP_URL_OVERRIDE="${1#*=}"; shift ;;
        --app-url)      APP_URL_OVERRIDE="${2:?Missing value for --app-url}"; shift 2 ;;
        --db-name=*)    DB_NAME_OVERRIDE="${1#*=}"; shift ;;
        --db-name)      DB_NAME_OVERRIDE="${2:?Missing value for --db-name}"; shift 2 ;;
        --db-user=*)    DB_USER_OVERRIDE="${1#*=}"; HAS_DB_USER_OVERRIDE=1; shift ;;
        --db-user)      DB_USER_OVERRIDE="${2:?Missing value for --db-user}"; HAS_DB_USER_OVERRIDE=1; shift 2 ;;
        --db-password=*) DB_PASSWORD_OVERRIDE="${1#*=}"; HAS_DB_PASSWORD_OVERRIDE=1; shift ;;
        --db-password)  DB_PASSWORD_OVERRIDE="${2:?Missing value for --db-password}"; HAS_DB_PASSWORD_OVERRIDE=1; shift 2 ;;
        --db-host=*)    DB_HOST_OVERRIDE="${1#*=}"; HAS_DB_HOST_OVERRIDE=1; shift ;;
        --db-host)      DB_HOST_OVERRIDE="${2:?Missing value for --db-host}"; HAS_DB_HOST_OVERRIDE=1; shift 2 ;;
        --db-port=*)    DB_PORT_OVERRIDE="${1#*=}"; HAS_DB_PORT_OVERRIDE=1; shift ;;
        --db-port)      DB_PORT_OVERRIDE="${2:?Missing value for --db-port}"; HAS_DB_PORT_OVERRIDE=1; shift 2 ;;
        --env=*)
            ENV_OVERRIDE="${1#*=}"
            [[ "$ENV_OVERRIDE" == *=* ]] || abort "--env expects KEY=VALUE."
            ENV_OVERRIDES+=("$ENV_OVERRIDE")
            ENV_OVERRIDE_COUNT=$((ENV_OVERRIDE_COUNT + 1))
            shift
            ;;
        --env)
            [[ "${2:-}" == *=* ]] || abort "--env expects KEY=VALUE."
            ENV_OVERRIDES+=("$2")
            ENV_OVERRIDE_COUNT=$((ENV_OVERRIDE_COUNT + 1))
            shift 2
            ;;
        --seeder=*)     SEEDER_CLASS="${1#*=}"; shift ;;
        --seeder)       SEEDER_CLASS="${2:?Missing value for --seeder}"; shift 2 ;;
        --skip-database) SHOULD_CREATE_DB=0; shift ;;
        --skip-install)  SHOULD_INSTALL=0;   shift ;;
        --skip-build)    SHOULD_BUILD=0;     shift ;;
        --skip-storage-link) SHOULD_STORAGE_LINK=0; shift ;;
        --skip-migrate)  SHOULD_MIGRATE=0;   shift ;;
        --skip-seed)     SHOULD_SEED=0;      shift ;;
        --skip-herd)     SHOULD_HERD=0;      shift ;;
        --help|-h)       usage 0 ;;
        -*)              abort "Unknown option [$1]. Run with --help for usage." ;;
        *)
            [[ -z "$BRANCH_NAME" ]] || abort "Branch name was already provided."
            BRANCH_NAME="$1"
            shift
            ;;
    esac
done

if [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    [[ -z "$BRANCH_NAME" ]] || abort "--adopt takes no branch name; the branch is read from HEAD."
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
    [[ "$BRANCH_NAME" != "HEAD" ]] || abort "Worktree is in detached HEAD; cannot derive a name."
else
    [[ -n "$BRANCH_NAME" ]] || usage 1
fi

# In a linked worktree, --show-toplevel is the WORKTREE, not the checkout that
# holds the .env and the installed dependencies. The shared git dir's parent is
# the main checkout, whatever it is called and wherever it lives.
PROJECT_ROOT=$(git rev-parse --show-toplevel)
if [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    PROJECT_ROOT=$(cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")" && pwd)
fi
WORKTREE_DIR_NAME=$(sanitize_kebab "$BRANCH_NAME")
[[ -n "$WORKTREE_DIR_NAME" ]] || abort "Branch name must contain letters or numbers."

FEATURE_SNAKE=$(to_snake "$WORKTREE_DIR_NAME")
if [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    WORKTREE_PATH=$(git rev-parse --show-toplevel)
else
    WORKTREE_PATH="${PROJECT_ROOT}/.worktrees/${WORKTREE_DIR_NAME}"
fi
APP_URL="${APP_URL_OVERRIDE:-https://${WORKTREE_DIR_NAME}.test}"
APP_HOST=$(extract_host "$APP_URL")
DB_NAME="${DB_NAME_OVERRIDE:-gtech_${FEATURE_SNAKE}}"
CACHE_PREFIX="gtech_${FEATURE_SNAKE}_"
SOURCE_ENV="${PROJECT_ROOT}/.env"
SOURCE_ENV_IS_EXAMPLE=0
BASE_REF="$BASE_BRANCH"

if [[ ! -f "$SOURCE_ENV" ]]; then
    SOURCE_ENV="${PROJECT_ROOT}/.env.example"
    SOURCE_ENV_IS_EXAMPLE=1
fi

[[ -f "$SOURCE_ENV" ]] || abort "No .env or .env.example file was found in ${PROJECT_ROOT}."
if [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    [[ "$WORKTREE_PATH" != "$PROJECT_ROOT" ]] || abort "--adopt must be run inside a worktree, not the main checkout."
else
    [[ ! -e "$WORKTREE_PATH" ]] || abort "Worktree already exists at ${WORKTREE_PATH}."
fi

if [[ "$ADOPT_EXISTING" -eq 0 ]] && ! git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/heads/${BASE_BRANCH}"; then
    if git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/remotes/origin/${BASE_BRANCH}"; then
        BASE_REF="origin/${BASE_BRANCH}"
    else
        abort "Base branch [${BASE_BRANCH}] was not found."
    fi
fi

PHP_BIN="$(resolve_binary "php" "$HOME/Library/Application Support/Herd/bin/php")"
COMPOSER_BIN="$(resolve_binary "composer" "$HOME/Library/Application Support/Herd/bin/composer")"
BUN_BIN=""
if [[ "$SHOULD_INSTALL" -eq 1 || "$SHOULD_BUILD" -eq 1 ]]; then
    BUN_BIN="$(resolve_binary "bun" "$HOME/.bun/bin/bun")"
fi

cleanup_note() {
    local exit_code="$?"

    if [[ "$exit_code" -ne 0 && -d "$WORKTREE_PATH" ]]; then
        printf '\nSetup stopped early. The worktree still exists at:\n%s\n' "$WORKTREE_PATH" >&2
        printf 'Clean it up with:\nbin/cleanup-worktree.sh %s\n' "$WORKTREE_DIR_NAME" >&2
    fi

    exit "$exit_code"
}

trap cleanup_note EXIT

# A host may know how to do this better than we can -- assigning a hostname,
# a web server pool and queue workers alongside the database. If one is
# configured, hand the whole job over.
if [[ -n "${WORKTREE_PROVISIONER:-}" ]] && [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    info "Delegating to \$WORKTREE_PROVISIONER [${WORKTREE_PROVISIONER}]"
    trap - EXIT
    exec "$WORKTREE_PROVISIONER" "$WORKTREE_PATH"
fi

if [[ "$ADOPT_EXISTING" -eq 1 ]]; then
    info "Adopting existing worktree at ${WORKTREE_PATH} (branch ${BRANCH_NAME})"
elif git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
elif git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/remotes/origin/${BRANCH_NAME}"; then
    git -C "$PROJECT_ROOT" worktree add --track -b "$BRANCH_NAME" "$WORKTREE_PATH" "origin/${BRANCH_NAME}"
else
    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" "$BASE_REF"
fi

info "Copying environment file from ${SOURCE_ENV}"
cp "$SOURCE_ENV" "${WORKTREE_PATH}/.env"

if [[ "$SOURCE_ENV_IS_EXAMPLE" -eq 1 ]]; then
    info "Using local Herd defaults because root .env was not found"
    set_env_value "${WORKTREE_PATH}/.env" "DB_HOST" "127.0.0.1"
    set_env_value "${WORKTREE_PATH}/.env" "DB_PORT" "3306"
    set_env_value "${WORKTREE_PATH}/.env" "DB_USERNAME" "root"
    set_env_value "${WORKTREE_PATH}/.env" "DB_PASSWORD" ""
    set_env_value "${WORKTREE_PATH}/.env" "REDIS_HOST" "127.0.0.1"
    set_env_value "${WORKTREE_PATH}/.env" "MAIL_HOST" "127.0.0.1"
    set_env_value "${WORKTREE_PATH}/.env" "FILESYSTEM_DISK" "local"
fi

info "Rewriting APP_URL / DB_CONNECTION / DB_DATABASE / SESSION_DOMAIN / CACHE_PREFIX"
set_env_value "${WORKTREE_PATH}/.env" "APP_URL" "$APP_URL"
set_env_value "${WORKTREE_PATH}/.env" "APP_SERVICE" "$APP_HOST"
# The isolated database this script creates is a MySQL one, so pin the driver.
# Without it a copied .env that leaves DB_CONNECTION unset falls back to the
# sqlite default, and migrations open DB_DATABASE as a file path instead.
set_env_value "${WORKTREE_PATH}/.env" "DB_CONNECTION" "mysql"
set_env_value "${WORKTREE_PATH}/.env" "DB_DATABASE" "$DB_NAME"
set_env_value "${WORKTREE_PATH}/.env" "SESSION_DOMAIN" "$APP_HOST"
set_env_value "${WORKTREE_PATH}/.env" "CACHE_PREFIX" "$CACHE_PREFIX"
set_env_value "${WORKTREE_PATH}/.env" "ZOOM_REDIRECT_URI" "${APP_URL}/coach/zoom/callback"
set_env_value "${WORKTREE_PATH}/.env" "GOOGLE_CALENDAR_REDIRECT_URI" "${APP_URL}/coach/google-calendar/callback"

if [[ "$HAS_DB_USER_OVERRIDE" -eq 1 ]]; then
    set_env_value "${WORKTREE_PATH}/.env" "DB_USERNAME" "$DB_USER_OVERRIDE"
fi

if [[ "$HAS_DB_PASSWORD_OVERRIDE" -eq 1 ]]; then
    set_env_value "${WORKTREE_PATH}/.env" "DB_PASSWORD" "$DB_PASSWORD_OVERRIDE"
fi

if [[ "$HAS_DB_HOST_OVERRIDE" -eq 1 ]]; then
    set_env_value "${WORKTREE_PATH}/.env" "DB_HOST" "$DB_HOST_OVERRIDE"
fi

if [[ "$HAS_DB_PORT_OVERRIDE" -eq 1 ]]; then
    set_env_value "${WORKTREE_PATH}/.env" "DB_PORT" "$DB_PORT_OVERRIDE"
fi

if [[ "$ENV_OVERRIDE_COUNT" -gt 0 ]]; then
    for ENV_OVERRIDE in "${ENV_OVERRIDES[@]}"; do
        ENV_KEY="${ENV_OVERRIDE%%=*}"
        ENV_VALUE="${ENV_OVERRIDE#*=}"
        set_env_value "${WORKTREE_PATH}/.env" "$ENV_KEY" "$ENV_VALUE"
    done
fi

cd "$WORKTREE_PATH"

if [[ "$SHOULD_CREATE_DB" -eq 1 ]]; then
    command -v mysql >/dev/null 2>&1 || abort "mysql client not found. Use --skip-database if you want to skip DB creation."
    [[ "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]] || abort "Database name [$DB_NAME] must contain only letters, numbers, and underscores."

    DB_HOST=$(read_env_value .env "DB_HOST")
    DB_PORT=$(read_env_value .env "DB_PORT")
    DB_USER=$(read_env_value .env "DB_USERNAME")
    DB_PASS=$(read_env_value .env "DB_PASSWORD")

    DB_HOST="${DB_HOST:-127.0.0.1}"
    DB_PORT="${DB_PORT:-3306}"
    DB_USER="${DB_USER:-root}"

    info "Creating isolated database [${DB_NAME}]"
    if [[ -n "$DB_PASS" ]]; then
        MYSQL_PWD="$DB_PASS" mysql --user="$DB_USER" --host="$DB_HOST" --port="$DB_PORT" \
            --execute="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    else
        mysql --user="$DB_USER" --host="$DB_HOST" --port="$DB_PORT" \
            --execute="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    fi
fi

if [[ "$SHOULD_INSTALL" -eq 1 ]]; then
    info "Installing PHP dependencies"
    "$COMPOSER_BIN" install --no-interaction --working-dir="$WORKTREE_PATH"

    info "Installing Node dependencies"
    "$BUN_BIN" install
fi

if [[ "$SHOULD_BUILD" -eq 1 ]]; then
    info "Building frontend assets"
    "$BUN_BIN" run build
fi

if [[ "$SHOULD_STORAGE_LINK" -eq 1 ]]; then
    info "Linking public storage"
    "$PHP_BIN" artisan storage:link --no-interaction --force
fi

if [[ "$SHOULD_MIGRATE" -eq 1 ]]; then
    if [[ "$SHOULD_SEED" -eq 1 ]]; then
        info "Running migrate:fresh --seeder=${SEEDER_CLASS} --seed"
        "$PHP_BIN" artisan migrate:fresh --seeder="$SEEDER_CLASS" --seed --no-interaction --force
    else
        info "Running migrate:fresh"
        "$PHP_BIN" artisan migrate:fresh --no-interaction --force
    fi
fi

if [[ "$SHOULD_HERD" -eq 1 ]] && ! command -v herd >/dev/null 2>&1; then
    info "herd not found; skipping the link/secure step"
    SHOULD_HERD=0
fi

if [[ "$SHOULD_HERD" -eq 1 ]]; then

    info "Linking to Herd as '${WORKTREE_DIR_NAME}'"
    herd link "$WORKTREE_DIR_NAME"

    info "Securing with HTTPS"
    herd secure "$WORKTREE_DIR_NAME"
fi

cat <<EOF

Worktree ready!
  Path:      ${WORKTREE_PATH}
  Branch:    ${BRANCH_NAME}
  URL:       ${APP_URL}
  Database:  ${DB_NAME}

Clean up later: bin/cleanup-worktree.sh ${WORKTREE_DIR_NAME}
EOF
