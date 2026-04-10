#!/bin/sh
# =====================================================================
# Loxia — Multi-database init script
# Executed automatically by the postgres image on first container start
# (hook: /docker-entrypoint-initdb.d/). Creates the 4 isolated databases
# used by the Loxia microservices, all inside the single loxia-db
# container.
#
# POSIX sh on purpose: this file may be sourced by the postgres entrypoint
# if its executable bit is not preserved through Windows file systems.
# =====================================================================

set -e

create_database() {
  db=$1
  echo "  Creating database '$db'"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE "$db";
EOSQL
}

echo "Loxia: creating per-service databases..."

for db in "$AUTH_DB_NAME" "$CATALOG_DB_NAME" "$RENTAL_DB_NAME" "$NOTIFICATION_DB_NAME"; do
  create_database "$db"
done

echo "Loxia: all databases created successfully."
