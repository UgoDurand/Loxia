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

- **Étape 2 — Initialisation git + repo GitHub privé + branches GitFlow** _(2026-04-10)_
  - [x] Préflight : `git` 2.47, `gh` 2.89, `gh auth status` (logged as `UgoDurand`)
  - [x] `git init -b main` + `git add .` + vérification que `CLAUDE.md` n'est PAS staged
  - [x] Commit initial sur `main` : `chore: initial project structure and documentation` (`b5c2a98`, 22 fichiers / 919 insertions)
  - [x] Création du repo GitHub **privé** `UgoDurand/Loxia` via `gh repo create`
  - [x] `gh auth setup-git` pour le credential helper, puis `git push -u origin main`
  - [x] Création de la branche `develop` depuis `main` et `git push -u origin develop`
  - [x] `main` conservée comme branche par défaut du dépôt (ajustement GitFlow suite au retour utilisateur)
  - [x] Correction doc sur `develop` : `docs: clarify main is the default branch in gitflow strategy` (`fab0cab`)
  - [x] Vérifications finales : `CLAUDE.md` et `.env` absents du remote (404 confirmés), repo privé, 2 branches présentes

- **Étape 4 — Parent POM Maven + squelette `auth-service`** _(2026-04-10)_
  - [x] Branche `feat/services-parent-pom-and-auth-skeleton` créée depuis `develop`
  - [x] Parent POM `services/pom.xml` (packaging `pom`, hérite de `spring-boot-starter-parent` 3.3.5, Java 21 LTS, `pluginManagement` pour le plugin Spring Boot avec exclusion Lombok, `dependencyManagement` pour pinner springdoc-openapi 2.6.0)
  - [x] **Maven Wrapper unique à la racine `services/`** (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties` → Maven 3.9.9) — choix multi-module : un seul wrapper partagé par tous les services au lieu d'un par module
  - [x] Squelette `services/auth-service/` : `pom.xml` (hérite du parent, `finalName: auth-service`), `AuthApplication.java` minimaliste dans `com.loxia.auth`, `application.yml` (port 8081, profil par défaut localhost) + `application-docker.yml` (override JDBC vers `loxia-db`), dossier `db/migration/` prêt pour Flyway (avec `.gitkeep`)
  - [x] Dépendances auth-service : `spring-boot-starter-web`, `spring-boot-starter-actuator`, `spring-boot-starter-data-jpa`, `postgresql` (runtime), `flyway-core` + `flyway-database-postgresql`, `lombok` (optional), `spring-boot-starter-test`
  - [x] `/actuator/health` exposé (seul endpoint activé via `management.endpoints.web.exposure.include=health`)
  - [x] `Dockerfile` multi-stage : stage 1 `maven:3.9-eclipse-temurin-21` (copie pom parent + pom module → `mvn dependency:go-offline` → copie sources → `mvn package -DskipTests`), stage 2 `eclipse-temurin:21-jre-alpine` (user non-root `loxia`, `EXPOSE 8081`, `ENTRYPOINT java -jar`)
  - [x] `build context: ./services` + `dockerfile: auth-service/Dockerfile` pour permettre au Dockerfile de lire à la fois le parent POM et le module POM
  - [x] Intégration `docker-compose.yml` : service `auth-service` **non exposé sur l'hôte** (`expose: 8081`), `SPRING_PROFILES_ACTIVE=docker`, `depends_on: loxia-db service_healthy`, healthcheck `wget http://localhost:8081/actuator/health` (interval 10s, retries 10, start_period 60s)
  - [x] `.gitattributes` étoffé : `mvnw` forcé en LF (exécuté par Linux), `*.cmd`/`*.bat` forcés en CRLF (exécutés par Windows)
  - [x] Build Docker testé : `docker compose build auth-service` → OK (143s dep download + 9s package), image `loxia-auth-service:latest` produite
  - [x] Boot testé : `docker compose up -d auth-service` → conteneur `healthy` en ~50s, logs Spring Boot propres (Java 21.0.10, Spring Boot 3.3.5, profil docker actif, Hikari connecté à `jdbc:postgresql://loxia-db:5432/auth_db`, Flyway a créé `flyway_schema_history` avec warning "No migrations found" attendu)
  - [x] `/actuator/health` retourne `{"status":"UP","groups":["liveness","readiness"]}` via `docker compose exec`
  - [x] Vérification visuelle utilisateur OK : table `flyway_schema_history` visible dans pgAdmin sous `auth_db.public` avec ses 10 colonnes
  - [x] 3 commits atomiques sur `feat/services-parent-pom-and-auth-skeleton` : `feat(services): ...` (`a1610a3`) + `feat(auth): ...` (`e334ba8`) + `feat(infra): ...` (`b70ef0f`)
  - [x] Merge `--no-ff` dans `develop` (`b7c07e9`), branche feature à supprimer (local + remote)

- **Étape 3 — Docker Compose minimal (PostgreSQL + pgAdmin)** _(2026-04-10)_
  - [x] Branche `feat/infra-postgres-base` créée depuis `develop`
  - [x] `.gitattributes` : LF forcé pour `.sh`, `.yml`, `Dockerfile` (évite les soucis CRLF sous Windows)
  - [x] `scripts/init-multi-db.sh` (POSIX sh) : crée les 4 bases `auth_db`, `catalog_db`, `rental_db`, `notification_db` au premier boot de Postgres
  - [x] `config/pgadmin/servers.json` : pré-enregistrement du serveur `Loxia DB` dans pgAdmin
  - [x] `docker-compose.yml` minimal : `loxia-db` (`postgres:16`, **non exposé** sur l'hôte) + `pgadmin` (`dpage/pgadmin4:8`, port 8090) avec healthcheck `pg_isready` et `depends_on: service_healthy`
  - [x] Volumes nommés `loxia-db-data` et `loxia-pgadmin-data` pour la persistance
  - [x] `.env.example` étoffé : `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` (TLD `.dev` obligatoire, pgAdmin refuse `.local`)
  - [x] Tests CLI : `docker compose up -d` → `loxia-db` healthy en <20s, 4 bases créées, pgAdmin `HTTP 200` sur `/browser/`
  - [x] Vérification visuelle utilisateur OK : serveur `Loxia DB` pré-enregistré, 4 bases visibles dans l'Object Explorer
  - [x] Docs mises à jour : `README.md` + `docs/architecture.md` (pgAdmin au lieu d'Adminer)
  - [x] 2 commits atomiques sur `feat/infra-postgres-base` : `feat(infra): ...` (`831200a`) + `docs(infra): ...` (`2f5b869`)
  - [x] Merge `--no-ff` dans `develop` (`46eb471`), branche feature supprimée en local et sur le remote

---

## 🚧 In progress

_(rien en cours — prochaine étape à annoncer sur demande)_

---

## ⏳ Backlog

### 🏗 Phase d'amorçage (squelette technique)

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
  - Vérification pgAdmin (4 bases + tables Flyway)
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

### Conventions d'avancement
- **`TASKS.md` est mis à jour directement sur `develop`** par commits atomiques `docs(tasks): ...` après chaque étape validée (convention simple, pas de mini-branche dédiée).
- Les branches `feat/*` et `fix/*` sont mergées dans `develop` via `git merge --no-ff` après validation utilisateur, puis supprimées localement et sur le remote.
- À chaque jalon majeur (ex: fin de l'amorçage Docker, fin de l'auth, etc.) : merge `develop → main` + tag `vX.Y.Z`.

### Conventions de code
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
