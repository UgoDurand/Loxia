#!/usr/bin/env bash
# =====================================================================
# Loxia — seed script
#
# Populates a running Loxia stack with two demo accounts, a handful of
# listings and one pending application so the demo has something to
# show without clicking around for 10 minutes.
#
# Idempotent: re-running the script is safe. Accounts that already
# exist return 409 from /api/auth/register; the script logs in instead
# and carries on. Listings are not de-duplicated — wipe the stack
# (`docker compose down -v`) before re-seeding if you want a clean
# slate.
#
# Usage:
#   ./scripts/seed.sh                           # defaults to http://localhost:8080
#   API_URL=http://localhost:8080 ./scripts/seed.sh
# =====================================================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"

ALICE_EMAIL="alice@loxia.dev"
BOB_EMAIL="bob@loxia.dev"
PASSWORD="password123"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

log()  { echo -e "${GREEN}[seed]${RESET} $*" >&2; }
warn() { echo -e "${YELLOW}[seed]${RESET} $*" >&2; }
fail() { echo -e "${RED}[seed]${RESET} $*" >&2; exit 1; }

command -v curl >/dev/null || fail "curl is required"
command -v jq   >/dev/null || fail "jq is required (brew install jq)"

# ─── Readiness probe ─────────────────────────────────────────────────
log "Probing gateway at ${API_URL}…"
if ! curl -sf "${API_URL}/actuator/health" >/dev/null; then
  fail "Gateway not reachable at ${API_URL}. Run 'docker compose up -d' first."
fi

# ─── Helpers ─────────────────────────────────────────────────────────
register_or_login() {
  local email="$1" fullName="$2" out status

  out=$(curl -s -o /tmp/loxia_seed_body -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\",\"fullName\":\"${fullName}\"}" \
    "${API_URL}/api/auth/register")
  status="${out}"

  if [[ "${status}" == "200" || "${status}" == "201" ]]; then
    log "  + registered ${email}"
  elif [[ "${status}" == "409" ]]; then
    warn "  · ${email} already exists — logging in"
    curl -s -o /tmp/loxia_seed_body \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}" \
      "${API_URL}/api/auth/login" >/dev/null
  else
    cat /tmp/loxia_seed_body >&2
    fail "Unexpected status ${status} while registering ${email}"
  fi

  jq -r '.accessToken' /tmp/loxia_seed_body
}

create_listing() {
  local token="$1" payload="$2" out status
  out=$(curl -s -o /tmp/loxia_seed_body -w "%{http_code}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    "${API_URL}/api/listings")
  status="${out}"
  if [[ "${status}" == "200" || "${status}" == "201" ]]; then
    jq -r '.id' /tmp/loxia_seed_body
  else
    cat /tmp/loxia_seed_body >&2
    fail "Failed to create listing (status ${status})"
  fi
}

create_application() {
  local token="$1" listingId="$2" out status
  out=$(curl -s -o /tmp/loxia_seed_body -w "%{http_code}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"listingId\":\"${listingId}\",\"monthlyIncome\":2800,\"employmentStatus\":\"CDI\",\"message\":\"Bonjour, je suis très intéressée par votre annonce.\"}" \
    "${API_URL}/api/applications")
  status="${out}"
  if [[ "${status}" == "200" || "${status}" == "201" ]]; then
    log "  + application created on listing ${listingId}"
  elif [[ "${status}" == "409" ]]; then
    warn "  · application already exists on listing ${listingId}"
  else
    cat /tmp/loxia_seed_body >&2
    fail "Failed to create application (status ${status})"
  fi
}

# ─── Users ───────────────────────────────────────────────────────────
log "Seeding users…"
ALICE_TOKEN=$(register_or_login "${ALICE_EMAIL}" "Alice Martin")
BOB_TOKEN=$(register_or_login "${BOB_EMAIL}"   "Bob Durand")

# ─── Listings (Bob is the landlord) ──────────────────────────────────
log "Seeding listings…"

BOB_LISTING_1=$(create_listing "${BOB_TOKEN}" '{
  "title": "Appartement T2 lumineux — Canut",
  "description": "Charmant T2 rénové, calme et proche des transports. Idéal jeune actif ou étudiant.",
  "propertyType": "Appartement",
  "city": "Lyon",
  "price": 820,
  "surface": 42,
  "rooms": 2,
  "photoUrls": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"]
}')
log "  + Lyon T2 → ${BOB_LISTING_1}"

BOB_LISTING_2=$(create_listing "${BOB_TOKEN}" '{
  "title": "Studio moderne — République",
  "description": "Studio entièrement meublé, au cœur du 11e. Cuisine équipée, internet fibré.",
  "propertyType": "Studio",
  "city": "Paris",
  "price": 1100,
  "surface": 24,
  "rooms": 1,
  "photoUrls": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]
}')
log "  + Paris studio → ${BOB_LISTING_2}"

BOB_LISTING_3=$(create_listing "${BOB_TOKEN}" '{
  "title": "Maison familiale avec jardin",
  "description": "Maison de 4 chambres avec jardin et garage, quartier résidentiel calme.",
  "propertyType": "Maison",
  "city": "Marseille",
  "price": 1650,
  "surface": 120,
  "rooms": 4,
  "photoUrls": ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"]
}')
log "  + Marseille maison → ${BOB_LISTING_3}"

# ─── Applications ────────────────────────────────────────────────────
log "Seeding applications…"
create_application "${ALICE_TOKEN}" "${BOB_LISTING_1}"

# ─── Done ────────────────────────────────────────────────────────────
rm -f /tmp/loxia_seed_body

echo
echo -e "${GREEN}Done.${RESET} Stack seeded at ${API_URL}."
echo
echo "Demo accounts (password: ${PASSWORD}):"
echo "  · ${ALICE_EMAIL}  — Alice Martin  (tenant — 1 pending application)"
echo "  · ${BOB_EMAIL}    — Bob Durand    (landlord — 3 listings in Lyon/Paris/Marseille)"
echo
echo "Alice has a PENDING application on Bob's Lyon listing — log in as Bob"
echo "and head to \"Profil → Demandes reçues\" to accept or refuse it."
