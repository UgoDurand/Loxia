# Loxia — Suivi d'avancement

> **Source de vérité** de l'état du projet. Ce fichier est mis à jour à chaque étape validée.
> Pour toute personne arrivant sur le dépôt : **lis ce fichier en premier** pour savoir où en est l'équipe et par où commencer.
>
> - Vue d'ensemble du projet : [`README.md`](README.md)
> - Architecture détaillée : [`docs/architecture.md`](docs/architecture.md)
> - Maquettes de référence : [`docs/mockups/`](docs/mockups/)

---

## Légende

- ✅ **Done** — étape terminée et validée
- 🚧 **In progress** — étape en cours
- ⏳ **Backlog** — à faire
- 📌 **Notes** — décisions, dette technique, points d'attention

---

## ✅ Done

- **Étape 1 — Fondations locales** _(2026-04-10)_
  - [x] Création du dossier `docs/mockups/` et déplacement des 16 captures PNG
  - [x] Création de `.gitignore` (avec `CLAUDE.md` exclu)
  - [x] Création de `.dockerignore`
  - [x] Création de `.env.example`
  - [x] Création de `README.md` (vitrine GitHub)
  - [x] Création de `TASKS.md` (ce fichier)
  - [x] Création de `CLAUDE.md` local (gitignored)
  - [x] Création de `docs/architecture.md` (squelette)

---

## 🚧 In progress

- **Étape 2 — Initialisation git + repo GitHub privé + branches GitFlow** _(annoncée, en attente de go)_
  - [ ] Préflight : `git --version`, `gh --version`, `gh auth status`
  - [ ] `git init -b main` dans le dossier du projet
  - [ ] `git add .` puis `git status` pour vérifier que `CLAUDE.md` n'est PAS staged
  - [ ] Premier commit `chore: initial project structure and documentation` sur `main`
  - [ ] Création du repo GitHub **privé** `Loxia` via `gh repo create --private --source=. --remote=origin --push`
  - [ ] Création de la branche `develop` à partir de `main` et push avec tracking
  - [ ] Configuration de `develop` comme branche par défaut côté GitHub (`gh repo edit --default-branch develop`)
  - [ ] Vérification finale (`gh repo view Loxia`, contrôle que `CLAUDE.md` n'est pas sur le remote)

---

## ⏳ Backlog

### 🏗 Phase d'amorçage (squelette technique)

- [ ] **Étape 3** — Docker Compose minimal (PostgreSQL + Adminer)
  - `scripts/init-multi-db.sh` (création des 4 bases dans Postgres)
  - `docker-compose.yml` minimal : `loxia-db` + `adminer`
  - Test de boot, vérification que les 4 bases sont créées
  - Branche : `feat/infra-postgres-base`

- [ ] **Étape 4** — Parent POM Maven + squelette `auth-service`
  - `services/pom.xml` (Java 21, Spring Boot 3.3.x, Lombok, dépendances communes)
  - Squelette Spring Boot `auth-service` (boot vide + healthcheck)
  - `Dockerfile` multi-stage
  - Intégration au `docker-compose.yml`
  - Branche : `feat/services-parent-pom-and-auth-skeleton`

- [ ] **Étape 5** — Squelettes `catalog-service`, `rental-service`, `notification-service`
  - Même pattern que `auth-service` (boot vide + healthcheck + Dockerfile)
  - Intégration au compose
  - Branche : `feat/services-skeletons-catalog-rental-notification`

- [ ] **Étape 6** — Squelette `gateway` Spring Cloud Gateway
  - Routes vers les 4 services (vides pour l'instant)
  - CORS dev (ouvert)
  - Pas encore de filtre JWT
  - Branche : `feat/gateway-skeleton`

- [ ] **Étape 7** — Squelette frontend React
  - `npm create vite@latest frontend -- --template react-ts`
  - Installation Tailwind, shadcn/ui, React Router, TanStack Query, Zustand, Axios, React Hook Form, Zod, lucide-react
  - Page d'accueil placeholder Loxia
  - `Dockerfile` multi-stage + `nginx.conf`
  - Intégration au compose
  - Branche : `feat/frontend-skeleton`

- [ ] **Étape 8** — Vérification end-to-end Docker Compose
  - `docker compose up --build` → tous les services démarrent en `healthy`
  - Vérification que la gateway route vers chaque service
  - Vérification Adminer (4 bases + tables Flyway)
  - Premier release : merge `develop` → `main`, tag `v0.1.0`

### 🔐 Phase Authentification

- [ ] **Étape 9** — `auth-service` complet
  - Endpoints `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/me`
  - Endpoint interne `GET /internal/users/{id}`
  - Migration Flyway `V1__init.sql` (tables `users`, `refresh_tokens`)
  - JWT HS256 (access 15 min + refresh 7 jours)
  - Tests JUnit ciblés (JwtService, AuthController)
  - Branche : `feat/auth-jwt-and-user-management`

- [ ] **Étape 10** — Filtre JWT à la gateway + intégration front
  - Filtre Spring Cloud Gateway qui valide le JWT et propage `X-User-Id`, `X-User-Email`, `X-User-FullName`
  - Whitelist : `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `GET /api/listings/**`
  - Deny-list explicite sur `/internal/**`
  - Pages frontend Login + Register
  - Store Zustand `authStore`
  - Intercepteur Axios (attache token, refresh auto sur 401)
  - Branche : `feat/gateway-jwt-and-frontend-auth`

### 📚 Phase Catalogue

- [ ] **Étape 11** — `catalog-service` complet + pages frontend annonces
  - CRUD `Listing` (création, modification, suppression, recherche avec filtres)
  - Enrichissement owner via appel interne à `auth-service`
  - Migration Flyway
  - Pages front : `ListingsSearchPage`, `ListingDetailPage`, `ListingFormPage`, `MyListingsPage`
  - Toggle Locataire/Propriétaire dans le header (Zustand)
  - Branche : `feat/catalog-listings-crud-and-pages`

### 📋 Phase Candidatures

- [ ] **Étape 12** — `rental-service` complet + règle de verrouillage + pages frontend
  - CRUD `Application` (dépôt, accept, reject)
  - Endpoints internes `/internal/applications/listing/{id}/locked` et `/internal/applications/locks` (batch)
  - Intégration de l'appel `catalog → rental` pour le verrouillage
  - Pages front : `ApplyPage`, `MyApplicationsPage`, `ReceivedApplicationsPage`
  - Affichage du badge « Non modifiable »
  - Branche : `feat/rental-applications-and-lock-rule`

### 🔔 Phase Notifications

- [ ] **Étape 13** — `notification-service` + cloche front
  - CRUD `Notification`
  - Endpoint interne `POST /internal/notifications` appelé par `rental-service` lors des actions sur les candidatures
  - Composant `NotificationBell` dans le header (TanStack Query, polling 30s)
  - Page/dropdown de liste des notifications
  - Branche : `feat/notifications-service-and-bell`

### ✨ Phase Polish

- [ ] **Étape 14** — Page Paramètres + finitions UI
  - Page `SettingsPage` (modifier nom complet et email)
  - Empty states, toasts d'erreur, loaders
  - Branche : `feat/settings-and-ui-polish`

- [ ] **Étape 15** — Tests, données de seed, préparation démo
  - Tests unitaires ciblés (JwtService, lock rule, ApplicationService)
  - Script `scripts/seed.sh` avec quelques annonces et 2 comptes de démo
  - Vérification du parcours utilisateur complet (cf. `README.md` section démo)
  - Branche : `chore/tests-and-demo-seed`

- [ ] **Étape 16** — Documentation finale et rapport
  - Compléter `docs/architecture.md` (vue d'ensemble, ADRs, schémas C4, séquences UML)
  - Rapport pédagogique pour le prof (structuré selon les livrables exigés)
  - Mise à jour finale du `README.md` (démarrage rapide complet, parcours de démo)
  - Tag de release `v1.0.0`
  - Branche : `docs/final-architecture-and-report`

---

## 📌 Notes pour reprise

### Décisions architecturales actées
- **4 microservices métier** + 1 gateway, monorepo
- **Compte unifié** : un seul `ROLE_USER`, le toggle Locataire/Propriétaire est purement un filtre UI front
- **JWT validé uniquement à la gateway**, propagation via headers `X-User-*`. Les services downstream ne revalident pas la signature.
- **Communication inter-services en REST synchrone uniquement** (pas de message broker)
- **Règle de verrouillage** catalog → rental via `RestClient` synchrone (`/internal/applications/listing/{id}/locked` + version batch). Race condition assumée et documentée.
- **Spring Cloud Gateway** retenu (plutôt que Kong/Traefik) pour rester dans la stack Spring
- **PostgreSQL** : un conteneur unique avec 4 bases isolées (`auth_db`, `catalog_db`, `rental_db`, `notification_db`)
- **Pas de service discovery** (DNS Docker Compose suffit à cette échelle)
- **Pas de Spring Cloud Config** : `application.yml` + profil `docker` + variables d'environnement `.env`

### Conventions
- Java : package `com.loxia.<service>`, DTO séparés des entités, Lombok autorisé, Slf4j pour les logs
- React : composants fonctionnels uniquement, props typées, TanStack Query pour le fetch serveur, Zustand pour le state client global
- SQL : `snake_case`, UUID PK, `created_at` / `updated_at`, migrations Flyway `V<n>__<desc>.sql`
- Git : Conventional Commits en anglais, branches `feat/<scope>-<desc>`, GitFlow simplifié (`main` / `develop` / branches feature)
- **Aucune mention d'IA / Claude / assistant dans les commits, PR, code review, commentaires de code**

### Dette technique connue / à documenter dans le rapport
- **Race condition sur la règle de lock** : entre la vérification dans `catalog-service` et l'UPDATE, une candidature peut arriver. Acceptée pour le projet ; en production on ajouterait un verrou applicatif ou un événement compensatoire.
- **Stockage du refresh token côté front** : `localStorage` pour simplifier le dev local. En production : cookie `HttpOnly` `SameSite=Strict`.
- **JWT HS256 partagé** : secret unique entre auth-service et gateway via env var. En production : RS256 avec clé asymétrique ou JWKS.
- **Pas de tracing distribué** : pour le projet, on s'appuie sur les logs Spring Boot. En production : OpenTelemetry / Jaeger / Tempo.

### Périmètre HORS scope (ne PAS implémenter)
- Pas de paiement
- Pas de chat en direct
- Pas d'upload réel de fichiers (photos = URLs simulées)
- Pas de carte géographique
- Pas de notifications email/push
- Pas de Kubernetes, pas d'Istio, pas de Kafka

### Répartition d'équipe suggérée (3-4 membres)
- **Membre A** → `auth-service` + intercepteur JWT front
- **Membre B** → `catalog-service` + pages annonces front
- **Membre C** → `rental-service` + pages candidatures front
- **Membre D** → `gateway` + `notification-service` + header/cloche front (si seulement 3 membres : A ou D absorbe)
