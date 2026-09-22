#!/usr/bin/env bash
# Runs the access-policy regression suite against a throwaway Postgres.
# Requires postgresql-16 client + server binaries.
#
#   ./tests/run.sh
#
# Any FAIL means the product is making a promise it does not keep.
set -euo pipefail

PORT="${PGPORT:-55432}"
DATA="${PGDATA_TEST:-/var/lib/postgresql/ndotest}"
SOCK="${PGSOCK:-/var/run/postgresql}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL=(psql -h "$SOCK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1)

if ! "${PSQL[@]}" -tAc 'select 1' >/dev/null 2>&1; then
  echo "starting throwaway postgres on :$PORT"
  rm -rf "$DATA"; mkdir -p "$DATA"; chown postgres:postgres "$DATA"
  su postgres -c "$(ls -d /usr/lib/postgresql/*/bin | tail -1)/initdb -D $DATA -A trust -U postgres" >/dev/null
  su postgres -c "$(ls -d /usr/lib/postgresql/*/bin | tail -1)/pg_ctl -D $DATA -o '-p $PORT -k $SOCK' -l $DATA/pg.log start" >/dev/null
  sleep 3
fi

"${PSQL[@]}" -c 'drop database if exists ndo_test;' -c 'create database ndo_test;' >/dev/null

# Supabase-alike environment: the auth schema, auth.uid(), and the two roles
# PostgREST assumes. Enough to exercise every RLS policy faithfully.
"${PSQL[@]}" -d ndo_test >/dev/null <<'SQL'
create extension if not exists pgcrypto;
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
end $$;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;

-- Supabase grants table rights via default privileges at creation time, so
-- revokes inside migrations take effect. Granting after would mask them.
grant usage on schema public, auth to authenticated, anon;
grant select on auth.users to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, anon;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, anon;
SQL

for f in "$ROOT"/supabase/migrations/*.sql; do
  "${PSQL[@]}" -d ndo_test -f "$f" >/dev/null
done

echo
"${PSQL[@]}" -d ndo_test -f "$ROOT/tests/access_policy_test.sql" 2>&1 \
  | grep -E 'PASS|FAIL|ERROR|All access' \
  | sed -E 's/^psql:[^ ]+ //; s/^NOTICE:  //'
