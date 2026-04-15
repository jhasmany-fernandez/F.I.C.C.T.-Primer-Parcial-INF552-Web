#!/bin/sh
set -eu

POSTGRES_USER_VALUE="${POSTGRES_USER:-postgres}"
POSTGRES_DB_VALUE="${POSTGRES_DB:-postgres}"
POSTGRES_PASSWORD_VALUE="${POSTGRES_PASSWORD:-postgres}"

docker-entrypoint.sh postgres &
postgres_pid="$!"

cleanup() {
  if kill -0 "$postgres_pid" >/dev/null 2>&1; then
    kill -TERM "$postgres_pid" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM

until pg_isready -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" >/dev/null 2>&1; do
  sleep 1
done

psql \
  -v ON_ERROR_STOP=1 \
  -U "$POSTGRES_USER_VALUE" \
  -d "$POSTGRES_DB_VALUE" \
  --set=db_user="$POSTGRES_USER_VALUE" \
  --set=db_password="$POSTGRES_PASSWORD_VALUE" <<'SQL'
SELECT format(
  'ALTER USER %I WITH PASSWORD %L',
  :'db_user',
  :'db_password'
) \gexec
SQL

wait "$postgres_pid"
