#!/usr/bin/env bash
# =====================================================================
# Loxia — seed script
#
# Populates a running Loxia stack with demo accounts, 20+ listings
# covering all property types, cities, amenities and price ranges,
# plus a few pending applications so the demo is immediately usable.
#
# Idempotent: re-running is safe. Accounts that already exist return
# 409 and the script logs in instead. Listings are not de-duplicated —
# wipe the stack (`docker compose down -v`) before re-seeding for a
# clean slate.
#
# Usage:
#   ./scripts/seed.sh
#   API_URL=http://localhost:8080 ./scripts/seed.sh
# =====================================================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"

ALICE_EMAIL="alice@loxia.dev"
BOB_EMAIL="bob@loxia.dev"
CHARLIE_EMAIL="charlie@loxia.dev"
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
  local token="$1" listingId="$2" income="$3" status_emp="$4" msg="$5" out status
  out=$(curl -s -o /tmp/loxia_seed_body -w "%{http_code}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"listingId\":\"${listingId}\",\"monthlyIncome\":${income},\"employmentStatus\":\"${status_emp}\",\"message\":\"${msg}\"}" \
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
BOB_TOKEN=$(register_or_login "${BOB_EMAIL}"     "Bob Durand")
CHARLIE_TOKEN=$(register_or_login "${CHARLIE_EMAIL}" "Charlie Leroy")

# ─── Bob's listings ──────────────────────────────────────────────────
log "Seeding Bob's listings…"

BOB_1=$(create_listing "${BOB_TOKEN}" '{
  "title": "T2 lumineux en cœur de ville",
  "description": "Charmant T2 rénové avec parquet, calme et lumineux. Proche des transports et commerces. Idéal jeune actif.",
  "propertyType": "Appartement",
  "city": "Lyon",
  "price": 820,
  "surface": 42,
  "rooms": 2,
  "floor": 3,
  "energyClass": "C",
  "deposit": 1640,
  "amenities": ["elevator","digicode","internet"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
  ]
}')
log "  + Lyon T2 → ${BOB_1}"

BOB_2=$(create_listing "${BOB_TOKEN}" '{
  "title": "Studio meublé République — Paris 11e",
  "description": "Studio entièrement meublé, au cœur du 11e. Cuisine équipée, internet fibré. Idéal pour une prise de poste rapide.",
  "propertyType": "Studio",
  "city": "Paris",
  "price": 1100,
  "surface": 24,
  "rooms": 1,
  "floor": 2,
  "energyClass": "E",
  "deposit": 2200,
  "amenities": ["furnished","internet","digicode"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
  ]
}')
log "  + Paris studio → ${BOB_2}"

BOB_3=$(create_listing "${BOB_TOKEN}" '{
  "title": "Maison familiale avec jardin — Marseille",
  "description": "Maison de 4 chambres avec grand jardin et garage double. Quartier résidentiel calme, école à 5 minutes.",
  "propertyType": "Maison",
  "city": "Marseille",
  "price": 1650,
  "surface": 120,
  "rooms": 4,
  "floor": 0,
  "energyClass": "D",
  "deposit": 3300,
  "amenities": ["parking","terrace","petsAllowed","cellar"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"
  ]
}')
log "  + Marseille maison → ${BOB_3}"

BOB_4=$(create_listing "${BOB_TOKEN}" '{
  "title": "Loft industriel avec terrasse — Bordeaux",
  "description": "Magnifique loft 80m² en rez-de-chaussée surélevé. Grandes fenêtres atelier, terrasse privative de 20m², cuisine ouverte.",
  "propertyType": "Loft",
  "city": "Bordeaux",
  "price": 1380,
  "surface": 80,
  "rooms": 2,
  "floor": 1,
  "energyClass": "B",
  "deposit": 2760,
  "amenities": ["terrace","parking","internet","airConditioning"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800"
  ]
}')
log "  + Bordeaux loft → ${BOB_4}"

BOB_5=$(create_listing "${BOB_TOKEN}" '{
  "title": "T3 avec balcon vue mer — Nice",
  "description": "Superbe T3 en étage élevé, vue dégagée sur la baie des Anges. Balcon filant, résidence gardée avec piscine.",
  "propertyType": "Appartement",
  "city": "Nice",
  "price": 1550,
  "surface": 68,
  "rooms": 3,
  "floor": 7,
  "energyClass": "C",
  "deposit": 3100,
  "amenities": ["pool","balcony","elevator","concierge","airConditioning","parking"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"
  ]
}')
log "  + Nice T3 → ${BOB_5}"

BOB_6=$(create_listing "${BOB_TOKEN}" '{
  "title": "Studio étudiant — Strasbourg Robertsau",
  "description": "Studio refait à neuf en résidence sécurisée, à 10 min des campus à vélo. Tout équipé.",
  "propertyType": "Studio",
  "city": "Strasbourg",
  "price": 680,
  "surface": 22,
  "rooms": 1,
  "floor": 4,
  "energyClass": "D",
  "deposit": 1360,
  "amenities": ["furnished","internet","elevator","digicode"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800"
  ]
}')
log "  + Strasbourg studio → ${BOB_6}"

BOB_7=$(create_listing "${BOB_TOKEN}" '{
  "title": "T4 dans villa avec piscine — Aix-en-Provence",
  "description": "Appartement dans villa provençale, 4 pièces avec accès piscine privée. Terrasse couverte, garage, cave.",
  "propertyType": "Appartement",
  "city": "Aix-en-Provence",
  "price": 2100,
  "surface": 95,
  "rooms": 4,
  "floor": 0,
  "energyClass": "B",
  "deposit": 4200,
  "amenities": ["pool","terrace","parking","cellar","airConditioning","petsAllowed"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800"
  ]
}')
log "  + Aix T4 → ${BOB_7}"

# ─── Charlie's listings ───────────────────────────────────────────────
log "Seeding Charlie's listings…"

CHARLIE_1=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "T2 cosy proche métro — Toulouse Capitole",
  "description": "Appartement T2 avec parquet et moulures, idéalement situé à 5 min du Capitole. Double vitrage, cave incluse.",
  "propertyType": "Appartement",
  "city": "Toulouse",
  "price": 750,
  "surface": 38,
  "rooms": 2,
  "floor": 2,
  "energyClass": "D",
  "deposit": 1500,
  "amenities": ["cellar","digicode","internet"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800"
  ]
}')
log "  + Toulouse T2 → ${CHARLIE_1}"

CHARLIE_2=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Maison de ville avec terrasse — Nantes",
  "description": "Maison de ville sur 3 niveaux, séjour double, 3 chambres, terrasse sud et jardinet. Garage intégré.",
  "propertyType": "Maison",
  "city": "Nantes",
  "price": 1400,
  "surface": 98,
  "rooms": 3,
  "floor": 0,
  "energyClass": "C",
  "deposit": 2800,
  "amenities": ["parking","terrace","cellar","petsAllowed"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800"
  ]
}')
log "  + Nantes maison → ${CHARLIE_2}"

CHARLIE_3=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Loft atypique Euralille — Lille",
  "description": "Loft de 65m² dans ancienne usine réhabilitée, plafonds 4m, verrières. Proche de la gare Lille-Europe.",
  "propertyType": "Loft",
  "city": "Lille",
  "price": 980,
  "surface": 65,
  "rooms": 2,
  "floor": 1,
  "energyClass": "E",
  "deposit": 1960,
  "amenities": ["digicode","internet","parking"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
  ]
}')
log "  + Lille loft → ${CHARLIE_3}"

CHARLIE_4=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "T3 neuf avec balcon — Montpellier Antigone",
  "description": "Appartement neuf (2023) dans résidence contemporaine, 3 pièces + balcon exposé sud. Climatisation réversible.",
  "propertyType": "Appartement",
  "city": "Montpellier",
  "price": 1050,
  "surface": 58,
  "rooms": 3,
  "floor": 5,
  "energyClass": "A",
  "deposit": 2100,
  "amenities": ["elevator","balcony","airConditioning","digicode","parking","internet"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"
  ]
}')
log "  + Montpellier T3 → ${CHARLIE_4}"

CHARLIE_5=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Studio meublé hyper-centre — Rennes",
  "description": "Studio meublé et équipé, idéal étudiant ou jeune actif. Proche gare et commerces. Loyer charges comprises.",
  "propertyType": "Studio",
  "city": "Rennes",
  "price": 620,
  "surface": 20,
  "rooms": 1,
  "floor": 3,
  "energyClass": "D",
  "deposit": 1240,
  "amenities": ["furnished","internet","elevator"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800"
  ]
}')
log "  + Rennes studio → ${CHARLIE_5}"

CHARLIE_6=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Appartement haussmannien — Paris 8e",
  "description": "Superbe haussmannien 90m² au 3e étage, parquet point de Hongrie, moulures, double séjour, 3 chambres. Gardien.",
  "propertyType": "Appartement",
  "city": "Paris",
  "price": 3200,
  "surface": 90,
  "rooms": 3,
  "floor": 3,
  "energyClass": "F",
  "deposit": 6400,
  "amenities": ["concierge","cellar","digicode"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800"
  ]
}')
log "  + Paris haussmannien → ${CHARLIE_6}"

CHARLIE_7=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Villa avec piscine chauffée — Cannes",
  "description": "Villa plain-pied 160m² avec piscine chauffée, jardin paysagé 600m², 4 chambres, garage double. Résidence fermée.",
  "propertyType": "Maison",
  "city": "Cannes",
  "price": 4500,
  "surface": 160,
  "rooms": 4,
  "floor": 0,
  "energyClass": "B",
  "deposit": 9000,
  "amenities": ["pool","parking","terrace","airConditioning","petsAllowed","cellar","internet"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1613490493576-5e6dce2ce9cb?w=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"
  ]
}')
log "  + Cannes villa → ${CHARLIE_7}"

CHARLIE_8=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "T2 atypique sous les toits — Lyon Croix-Rousse",
  "description": "Duplex sous combles avec vue panoramique sur Lyon. Poutres apparentes, espace bureau, terrasse privée.",
  "propertyType": "Appartement",
  "city": "Lyon",
  "price": 970,
  "surface": 48,
  "rooms": 2,
  "floor": 6,
  "energyClass": "D",
  "deposit": 1940,
  "amenities": ["terrace","internet","digicode"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800"
  ]
}')
log "  + Lyon duplex → ${CHARLIE_8}"

CHARLIE_9=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "Studio avec mezzanine — Grenoble",
  "description": "Studio tout équipé avec mezzanine couchage, au pied des montagnes. Résidence sécurisée, proche tramway.",
  "propertyType": "Studio",
  "city": "Grenoble",
  "price": 560,
  "surface": 25,
  "rooms": 1,
  "floor": 2,
  "energyClass": "C",
  "deposit": 1120,
  "amenities": ["furnished","internet","elevator","digicode"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800"
  ]
}')
log "  + Grenoble studio → ${CHARLIE_9}"

CHARLIE_10=$(create_listing "${CHARLIE_TOKEN}" '{
  "title": "T4 terrasse panoramique — Bordeaux Chartrons",
  "description": "Grand T4 en dernier étage, terrasse de 40m² avec vue sur la Garonne. Parquet, double séjour, cave et parking.",
  "propertyType": "Appartement",
  "city": "Bordeaux",
  "price": 1850,
  "surface": 88,
  "rooms": 4,
  "floor": 8,
  "energyClass": "C",
  "deposit": 3700,
  "amenities": ["terrace","elevator","parking","cellar","internet","airConditioning"],
  "photoUrls": [
    "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800",
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800"
  ]
}')
log "  + Bordeaux T4 → ${CHARLIE_10}"

# ─── Applications ────────────────────────────────────────────────────
log "Seeding applications…"

# Alice applies on several of Bob's listings
create_application "${ALICE_TOKEN}" "${BOB_1}" 2800 "CDI" \
  "Bonjour, je suis très intéressée par votre annonce. Je suis en CDI depuis 3 ans."

create_application "${ALICE_TOKEN}" "${CHARLIE_4}" 2500 "CDI" \
  "Votre appartement correspond exactement à ce que je recherche. Disponible immédiatement."

# Charlie applies on Bob's listings
create_application "${CHARLIE_TOKEN}" "${BOB_2}" 3200 "FREELANCE" \
  "Freelance développeur, revenus stables. Je cherche un pied-à-terre parisien."

create_application "${CHARLIE_TOKEN}" "${BOB_5}" 4100 "CDI" \
  "En CDI à Nice depuis 2 ans, je souhaite quitter mon logement actuel pour ce beau T3."

# Bob applies on Charlie's listings
create_application "${BOB_TOKEN}" "${CHARLIE_2}" 3500 "CDI" \
  "Famille de 3 personnes, nous cherchons une maison avec jardin. Références disponibles."

create_application "${BOB_TOKEN}" "${CHARLIE_6}" 6000 "CDI" \
  "Cadre dirigeant, je recherche un logement de standing à Paris. Garant solide."

# ─── Done ────────────────────────────────────────────────────────────
rm -f /tmp/loxia_seed_body

echo
echo -e "${GREEN}Done.${RESET} Stack seeded at ${API_URL}."
echo
echo "Demo accounts (password: ${PASSWORD}):"
echo "  · ${ALICE_EMAIL}   — Alice Martin  (2 applications pending)"
echo "  · ${BOB_EMAIL}     — Bob Durand    (7 listings, 2 applications pending)"
echo "  · ${CHARLIE_EMAIL} — Charlie Leroy (10 listings, 4 applications pending)"
echo
echo "Tip: log in as Bob or Charlie and visit \"Demandes reçues\" to accept or reject applications."
