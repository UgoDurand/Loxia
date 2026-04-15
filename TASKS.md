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
  - [x] Création de `.gitignore`
  - [x] Création de `.dockerignore`
  - [x] Création de `.env.example`
  - [x] Création de `README.md` (vitrine GitHub)
  - [x] Création de `TASKS.md` (ce fichier)
  - [x] Création de `docs/architecture.md` (squelette)

- **Étape 2 — Initialisation git + repo GitHub privé + branches GitFlow** _(2026-04-10)_
  - [x] Préflight : `git` 2.47, `gh` 2.89, `gh auth status` (logged as `UgoDurand`)
  - [x] `git init -b main` + `git add .` + commit initial
  - [x] Commit initial sur `main` : `chore: initial project structure and documentation` (`b5c2a98`, 22 fichiers / 919 insertions)
  - [x] Création du repo GitHub **privé** `UgoDurand/Loxia` via `gh repo create`
  - [x] `gh auth setup-git` pour le credential helper, puis `git push -u origin main`
  - [x] Création de la branche `develop` depuis `main` et `git push -u origin develop`
  - [x] `main` conservée comme branche par défaut du dépôt (ajustement GitFlow suite au retour utilisateur)
  - [x] Correction doc sur `develop` : `docs: clarify main is the default branch in gitflow strategy` (`fab0cab`)
  - [x] Vérifications finales : `.env` absent du remote (404 confirmé), repo privé, 2 branches présentes

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

- **Étape 5 — Squelettes `catalog-service`, `rental-service`, `notification-service`** _(2026-04-10)_
  - [x] Branche `feat/services-skeletons-catalog-rental-notification` créée depuis `develop`
  - [x] Parent POM `services/pom.xml` : 3 nouveaux modules déclarés (`catalog-service`, `rental-service`, `notification-service`) → le parent contient maintenant les 4 microservices
  - [x] Squelettes créés sur le même pattern qu'`auth-service` (pom.xml qui hérite du parent, classe main `@SpringBootApplication`, `application.yml` + `application-docker.yml`, dossier Flyway `db/migration/.gitkeep`, Dockerfile multi-stage)
  - [x] `catalog-service` : port 8082, base `catalog_db`, package `com.loxia.catalog`, class `CatalogApplication`
  - [x] `rental-service` : port 8083, base `rental_db`, package `com.loxia.rental`, class `RentalApplication`
  - [x] `notification-service` : port 8084, base `notification_db`, package `com.loxia.notification`, class `NotificationApplication`
  - [x] Fix critique sur les 4 Dockerfiles : le parent POM déclarant 4 modules, chaque Dockerfile doit copier **les 4 POMs enfants** (pas juste le sien) avant `dependency:go-offline`, sinon Maven refuse de lire le parent. Auth-service Dockerfile mis à jour en conséquence.
  - [x] Intégration `docker-compose.yml` : 3 nouveaux services, tous non exposés (`expose:` uniquement), `depends_on: loxia-db healthy`, healthcheck wget sur `/actuator/health`, variables d'env `SPRING_PROFILES_ACTIVE=docker` + credentials DB
  - [x] Build parallèle testé : `docker compose build --parallel auth-service catalog-service rental-service notification-service` → 4 images produites
  - [x] Stack complète testée : `docker compose up -d` → 6 conteneurs (db + pgAdmin + 4 services) **tous `(healthy)` en ~90s**
  - [x] 4× `/actuator/health` → `{"status":"UP","groups":["liveness","readiness"]}`
  - [x] 4× Flyway : chaque base a bien sa table `flyway_schema_history`
  - [x] Logs Spring Boot propres pour les 3 nouveaux services (Started in ~12s, profil docker actif, HikariPool connecté à la bonne base)
  - [x] Vérification visuelle utilisateur OK dans pgAdmin : 4 bases visibles avec chacune sa `flyway_schema_history`
  - [x] Docs `README.md` (section Démarrage rapide réécrite pour refléter l'état actuel) et `docs/architecture.md` (table de topologie avec colonne "Statut actuel") mises à jour sur la feature branch
  - [x] 6 commits atomiques sur `feat/services-skeletons-catalog-rental-notification` : `feat(services)` (`9a12e5a`) + `feat(catalog)` (`d41abd3`) + `feat(rental)` (`39b0548`) + `feat(notification)` (`09df8c4`) + `feat(infra)` (`3da7799`) + `docs(infra)` (`6c08cde`)
  - [x] Merge `--no-ff` dans `develop` (`5387ade`), branche feature supprimée en local et sur le remote

- **Étape 6 — Squelette `gateway` Spring Cloud Gateway** _(2026-04-10)_
  - [x] Branche `feat/gateway-skeleton` créée depuis `develop`
  - [x] `gateway/pom.xml` standalone (hérite de `spring-boot-starter-parent` 3.3.5, importe Spring Cloud BOM 2023.0.3), pas intégré dans `services/pom.xml` (dépendances WebFlux distinctes des services JPA)
  - [x] `GatewayApplication.java` dans `com.loxia.gateway`
  - [x] `application.yml` (port 8080, 4 routes localhost, CORS dev ouvert) + `application-docker.yml` (override URIs vers DNS Docker)
  - [x] Routes : `/api/auth/**` → `auth-service:8081`, `/api/listings/**` → `catalog-service:8082`, `/api/applications/**` → `rental-service:8083`, `/api/notifications/**` → `notification-service:8084`
  - [x] `Dockerfile` multi-stage (Maven 3.9 + Temurin 21 JRE Alpine, user non-root `loxia`, `EXPOSE 8080`)
  - [x] Intégration `docker-compose.yml` : seul service avec `ports: 8080:8080`, `depends_on` les 4 microservices `service_healthy`, healthcheck `/actuator/health`
  - [x] Build testé : `docker compose build gateway` → image `loxia-gateway` produite (Spring Cloud deps ~75s, package ~8s)
  - [x] Boot testé : `docker compose up -d gateway` → `loxia-gateway` passe `(healthy)`, Java 21.0.10, Spring Boot 3.3.5, profil docker actif, démarrage en ~2s
  - [x] `curl http://localhost:8080/actuator/health` → `{"status":"UP","groups":["liveness","readiness"]}`
  - [x] Logs gateway : `New routes count: 4` — 4 routes chargées
  - [x] 2 commits atomiques sur `feat/gateway-skeleton` : `feat(gateway): ...` (`3860c9b`) + `feat(infra): ...` (`b812f93`)
  - [x] Merge `--no-ff` dans `develop` (`31e7ef6`), branche feature supprimée en local et sur le remote

---

- **Étape 7 — Squelette frontend React** _(2026-04-10)_
  - [x] Branche `feat/frontend-skeleton` créée depuis `develop`
  - [x] `npm create vite@latest frontend -- --template react-ts` (React 18, TypeScript, Vite 8)
  - [x] Dépendances installées : Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (Radix, thème par défaut), React Router v6, TanStack Query v5, Zustand, Axios, React Hook Form, Zod, lucide-react
  - [x] Alias `@/` → `src/` configuré dans `vite.config.ts` + `tsconfig.app.json` + `tsconfig.json`
  - [x] `src/pages/HomePage.tsx` : page placeholder (icône, titre Loxia, sous-titre, boutons auth désactivés)
  - [x] Dossiers créés : `src/pages/`, `src/hooks/`, `src/api/`, `src/store/`, `src/types/`
  - [x] `nginx.conf` : SPA fallback `try_files → index.html`, cache assets Vite, endpoint `/health`
  - [x] `Dockerfile` multi-stage (Node 20 Alpine build + Nginx Alpine runtime)
  - [x] `frontend/.dockerignore` : exclut `node_modules`, `dist`, `.env*`
  - [x] Intégration `docker-compose.yml` : service `frontend` exposé `:3000`, `depends_on: gateway healthy`
  - [x] Build Docker testé : `docker compose build frontend` → image `loxia-frontend` produite (npm ci ~13s, Vite build ~3s)
  - [x] Boot testé : `docker compose up -d frontend` → `loxia-frontend` passe `(healthy)` en ~15s
  - [x] `curl http://localhost:3000/health` → `ok`
  - [x] `http://localhost:3000/` → `200`, page placeholder visible dans le navigateur
  - [x] Fallback SPA : `/route-inexistante` → `200` (Nginx sert `index.html`)
  - [x] Stack complète : 8 conteneurs tous `healthy` (db + 4 services + gateway + frontend + pgAdmin)
  - [x] 2 commits atomiques sur `feat/frontend-skeleton` : `feat(frontend): ...` (`8ffadd0`) + `feat(infra): ...` (`1bd86f0`)
  - [x] Merge `--no-ff` dans `develop` (`7f8c5bb`), branche feature supprimée en local et sur le remote

---

- **Étape 8 — Vérification E2E + release `v0.1.0`** _(2026-04-10)_
  - [x] `docker compose down` + `docker compose up --build -d` → tous les builds depuis le cache, démarrage propre en ordre
  - [x] 8 conteneurs `(healthy)` : `loxia-db`, `auth-service`, `catalog-service`, `rental-service`, `notification-service`, `gateway`, `frontend`, `pgadmin`
  - [x] `curl http://localhost:8080/actuator/health` → `{"status":"UP",...}` (gateway)
  - [x] `curl http://localhost:3000/health` → `ok` (frontend Nginx)
  - [x] 4× `/actuator/health` via `docker compose exec` → `UP` pour chaque microservice
  - [x] SPA fallback : `GET /route-inexistante` → HTTP 200 (Nginx sert `index.html`)
  - [x] 4 bases PostgreSQL présentes (`auth_db`, `catalog_db`, `rental_db`, `notification_db`)
  - [x] 4× `flyway_schema_history` présente dans chaque base
  - [x] Merge `develop → main` (`--no-ff`) + tag `v0.1.0` + push remote

---

- **Étape 9 — `auth-service` complet** _(2026-04-10)_
  - [x] Branche `feat/auth-jwt-and-user-management` créée depuis `develop`
  - [x] `pom.xml` : ajout `spring-boot-starter-validation`, `spring-boot-starter-security`, `jjwt-api/impl/jackson` 0.12.6
  - [x] Flyway `V1__init.sql` : tables `users` (email unique, password_hash, full_name) + `refresh_tokens` (token_hash SHA-256, expires_at), indexes sur email et token_hash
  - [x] Entités JPA : `User`, `RefreshToken` (Lombok `@Builder`, `@PrePersist`/`@PreUpdate`)
  - [x] Repositories : `UserRepository`, `RefreshTokenRepository` (JPQL delete by userId)
  - [x] DTOs : `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `UpdateProfileRequest`, `AuthResponse`, `UserResponse`
  - [x] `JwtService` : génération HS256 (15 min), extraction claims, validation
  - [x] `RefreshTokenService` : génération UUID, stockage hash SHA-256 Base64url, validation, révocation, rotation
  - [x] `AuthService` : register (BCrypt), login, refresh (rotation), logout, getProfile, updateProfile
  - [x] `AuthController` : `POST /api/auth/register|login|refresh|logout`, `GET|PUT /api/auth/me` (X-User-Id header)
  - [x] `InternalUserController` : `GET /internal/users/{id}`
  - [x] `SecurityConfig` : stateless, CSRF off, tous endpoints permit (gateway enforce JWT à l'étape 10)
  - [x] `JWT_SECRET` injecté via env var (docker-compose + application.yml)
  - [x] Tests : `JwtServiceTest` (6 cas), `AuthServiceTest` (4 cas) — **10/10 verts**
  - [x] Build Docker OK, service `healthy`, migration Flyway exécutée (tables `users` + `refresh_tokens` visibles dans pgAdmin)
  - [x] Tests E2E : register (201), register duplicate (409), login (200 + tokens), login bad password (401), refresh (200 + nouveau refresh token)
  - [x] Merge `--no-ff` dans `develop` (`8ae54db`), branche supprimée

- **Étape 10 — Filtre JWT gateway + pages Login/Register front** _(2026-04-10)_
  - [x] Branche `feat/gateway-jwt-and-frontend-auth` créée depuis `develop`
  - [x] `gateway/pom.xml` : ajout jjwt-api/impl/jackson 0.12.6
  - [x] `gateway/application.yml` : `jwt.secret` branché sur env var
  - [x] `JwtAuthenticationFilter` : valide le JWT HS256, bloque `/internal/**` (403), autorise les chemins publics (`/api/auth/**`, `GET /api/listings/**`, `/actuator/**`), propage `X-User-Id`, `X-User-Email`, `X-User-FullName`
  - [x] `docker-compose.yml` : `JWT_SECRET` injecté dans gateway
  - [x] `authStore.ts` (Zustand persist) : accessToken, refreshToken, user, setAuth, clearAuth
  - [x] `axiosInstance.ts` : intercepteur Bearer + refresh auto sur 401 (queue des requêtes en attente, fallback clearAuth)
  - [x] `authApi.ts` : login, register, refresh, logout, getMe
  - [x] `LoginPage.tsx` : React Hook Form + Zod, gestion 401
  - [x] `RegisterPage.tsx` : React Hook Form + Zod, gestion 409 (email déjà utilisé)
  - [x] `App.tsx` : routes `/login` et `/register` avec `GuestRoute` (redirect si déjà authentifié)
  - [x] `HomePage.tsx` : boutons Se connecter / S'inscrire fonctionnels, affichage nom + déconnexion si connecté
  - [x] `nginx.conf` : proxy `/api → loxia-gateway:8080` (Docker)
  - [x] `vite.config.ts` : proxy `/api → localhost:8080` (dev local)
  - [x] Tests E2E : inscription, connexion, affichage nom, déconnexion — OK
  - [x] Merge `--no-ff` dans `develop` (`28b68b7`), branche supprimée

---

## 🚧 In progress

_(rien en cours — prochaine étape = Étape 16 documentation finale + README + release v1.0.0)_

---

- **Étape 11** — `catalog-service` complet + pages frontend annonces _(2026-04-13)_
  - [x] Migration Flyway `V1__create_listings_table.sql` (table `listings` avec 12 colonnes + 3 indexes)
  - [x] Entité JPA `Listing` + `StringListConverter` (photo_urls stockées en TEXT avec séparateur `|||`)
  - [x] Repository `ListingRepository` + `ListingSpecifications` (filtres dynamiques : ville, type de bien, prix min/max)
  - [x] DTOs : `CreateListingRequest`, `UpdateListingRequest`, `ListingResponse`, `ListingSummaryResponse`
  - [x] `RestClientConfig` : deux `RestClient` beans (auth + rental) avec timeout 3s
  - [x] `AuthClientService` : enrichissement du nom du propriétaire via `/internal/users/{id}` (graceful degradation)
  - [x] `RentalClientService` : vérification du verrouillage via `/internal/applications/listing/{id}/locked` (fail-safe : bloque si rental-service indisponible)
  - [x] `ListingService` : CRUD complet avec vérification ownership + lock + enrichissement owner name
  - [x] `ListingController` : 6 endpoints (search, mine, getById, create, update, delete) avec contrainte regex UUID sur `/{id}` pour éviter le conflit avec `/mine`
  - [x] Tests unitaires `ListingServiceTest` : 7 cas (create, update reject non-owner, update reject locked, delete reject non-owner, delete reject locked, getById, getMyListings)
  - [x] Gateway `JwtAuthenticationFilter` : exclusion de `/api/listings/mine` du whitelist public pour propager `X-User-Id`
  - [x] `docker-compose.yml` : ajout `AUTH_SERVICE_URL` et `RENTAL_SERVICE_URL` pour catalog-service
  - [x] `application.yml` / `application-docker.yml` : config URLs inter-services
  - [x] Frontend `listingsApi.ts` : couche API typée (search, getById, getMine, create, update, delete)
  - [x] Frontend `roleStore.ts` : store Zustand persisté pour toggle Locataire/Propriétaire
  - [x] Frontend `Header.tsx` : header avec logo, toggle rôle (avec navigation vers `/`), zone auth
  - [x] Frontend `Layout.tsx` : wrapper Header + contenu
  - [x] Frontend `ListingCard.tsx` : carte résumé d'annonce
  - [x] Frontend `HomePage.tsx` : double vue (locataire : hero + recherche + grille ; propriétaire : hero + CTA + liste)
  - [x] Frontend `ListingDetailPage.tsx` : détail annonce avec photo, nom propriétaire, CTA contextuel
  - [x] Frontend `ListingFormPage.tsx` : formulaire création/édition (react-hook-form + Zod), gestion photos simulées
  - [x] Frontend `MyListingsPage.tsx` : liste des annonces du propriétaire avec actions edit/delete
  - [x] Frontend `App.tsx` : routes protégées (listings/new, listings/:id/edit, my-listings)
  - [x] Branche : `feat/catalog-listings-crud-and-pages`

---

- **Étape 12** — `rental-service` complet + règle de verrouillage + pages frontend _(2026-04-15)_
  - [x] Branche `feat/rental-applications-and-lock-rule` créée depuis `develop`
  - [x] Migration Flyway `V1__create_applications_table.sql` (table `applications`, 10 colonnes + 3 indexes sur listing/applicant/status)
  - [x] Enum `ApplicationStatus` (PENDING / ACCEPTED / REJECTED) + entité JPA `Application` (`@PrePersist` default PENDING, `@PreUpdate`)
  - [x] `ApplicationRepository` : 4 finders dérivés + `findLockedListingIds` en JPQL (`select distinct a.listingId ... where status in (PENDING, ACCEPTED)`)
  - [x] DTOs d'entrée/sortie : `CreateApplicationRequest` (Bean Validation), `ApplicationResponse` (avec enrichissement listing + applicant), `LockStatusResponse`, `BatchLockRequest`, `BatchLockResponse`
  - [x] `RestClientConfig` : deux `RestClient` beans (auth + catalog) avec timeout 3s (connect + read)
  - [x] `CatalogClientService` : `getListing(UUID)` + `getListingIdsByOwner(UUID)` via `/internal/listings/**` (graceful degradation)
  - [x] `AuthClientService` : `getUser(UUID)` via `/internal/users/{id}` (graceful degradation)
  - [x] `ApplicationService` : create (reject own-listing 400, duplicate 409), `getMyApplications`, `getReceivedApplications` (via catalog owner lookup), transitions accept/reject (404/403/409) avec cache en mémoire des listings/users pour dédupliquer les RestClient calls
  - [x] `LockService` : `isListingLocked(UUID)` + `getLockStatuses(List<UUID>)` avec dedup et map complète pour chaque id demandé
  - [x] `ApplicationController` : 5 endpoints publics (`POST /api/applications`, `GET /mine`, `GET /received`, `POST /{id}/accept|reject`) avec `@RequestHeader("X-User-Id")`
  - [x] `InternalApplicationController` : `GET /internal/applications/listing/{id}/locked` + `POST /internal/applications/locks` (batch)
  - [x] `InternalListingController` côté catalog-service (`GET /internal/listings/{id}` + `GET /internal/listings/owner/{ownerId}`) pour que rental-service puisse enrichir et lister les annonces d'un propriétaire
  - [x] `application.yml` / `application-docker.yml` : `services.auth-url` + `services.catalog-url` branchés sur env vars (`AUTH_SERVICE_URL`, `CATALOG_SERVICE_URL`)
  - [x] `docker-compose.yml` : env `AUTH_SERVICE_URL` + `CATALOG_SERVICE_URL` pour rental-service
  - [x] Fix critique infra : `scripts/init-multi-db.sh` marqué exécutable en git (mode 100755) — sinon Postgres tente de l'exécuter et échoue silencieusement, laissant les 4 bases absentes sur un volume vierge
  - [x] Enrichissement `ListingResponse` et `ListingSummaryResponse` avec un champ `locked` calculé via `RentalClientService.isLocked()` (détail) ou `getLockStatuses()` (liste — appel batch `POST /internal/applications/locks`)
  - [x] Fail-safe côté catalog : si le batch lock échoue, tous les ids retournent `true` pour ne pas exposer des boutons edit/delete sur une annonce dont l'état est inconnu
  - [x] Frontend `applicationsApi.ts` : couche API typée (create, getMine, getReceived, accept, reject) + type `ApplicationStatus`
  - [x] Frontend `listingsApi.ts` : ajout du champ `locked: boolean` sur `ListingSummary` et `ListingDetail`
  - [x] Frontend `ApplyPage.tsx` : formulaire react-hook-form + Zod (revenu, statut d'emploi, message), affichage titre/ville/prix, gestion erreur axios
  - [x] Frontend `MyApplicationsPage.tsx` : liste des candidatures envoyées avec badges de statut, infos listing, message, revenu, lien vers l'annonce
  - [x] Frontend `ReceivedApplicationsPage.tsx` : liste des candidatures reçues avec nom/email du candidat, boutons Accepter/Refuser (visible si PENDING)
  - [x] Frontend `ListingDetailPage.tsx` : badge `Non modifiable` (owner uniquement) + CTA "Modifier" désactivé quand `locked`
  - [x] Frontend `MyListingsPage.tsx` : badge `Non modifiable` en haut à droite de la carte, actions edit/delete désactivées quand `locked`
  - [x] Frontend `Header.tsx` : lien contextuel "Candidatures" (tenant → `/my-applications`) ou "Candidatures reçues" (owner → `/received-applications`) selon le toggle rôle
  - [x] Frontend `App.tsx` : routes protégées `/listings/:id/apply`, `/my-applications`, `/received-applications`
  - [x] Tests unitaires rental-service (**16/16 verts**) : `ApplicationServiceTest` (10 cas : happy path, listing missing, apply-to-own, duplicate, accept/reject happy, non-owner, non-pending, not-found, active statuses) + `LockServiceTest` (6 cas : isLocked true/false, restriction PENDING+ACCEPTED, batch locked/unlocked, empty input, dedup)
  - [x] Tests catalog-service (**8/8 verts**) : mise à jour `getMyListings_shouldReturnOwnerListings` pour stubber le nouveau `rentalClientService.getLockStatuses`
  - [x] Smoke tests E2E via gateway : happy path complet (register × 2, create, apply, accept) + cas d'erreur (apply to own 400, duplicate 409, non-owner accept 403, re-transition 409) + vérification lock (detail/mine avant/après apply, update/delete bloqués 409, batch endpoint, `/internal/**` non joignable via gateway)
  - [x] Commits atomiques sur `feat/rental-applications-and-lock-rule` : `feat(rental): ...applications table`, `fix(infra): ...init script executable`, `feat(catalog): ...internal listing endpoints`, `feat(rental): ...application crud`, `feat(infra): ...rental-service urls`, `feat(rental): ...internal lock endpoints`, `feat(catalog): ...locked flag on responses`, `feat(frontend): ...application pages and lock badges`, `test(rental): ...unit tests`

---

- **Étape 13** — `notification-service` complet + intégration rental + cloche frontend _(2026-04-15)_
  - [x] Branche `feat/notifications-service-and-bell` créée depuis `develop`
  - [x] Migration Flyway `V1__create_notifications_table.sql` (table `notifications` : 9 colonnes + 3 indexes sur `user_id`, `(user_id, read)`, `created_at DESC`)
  - [x] Enum `NotificationType` (APPLICATION_CREATED / APPLICATION_ACCEPTED / APPLICATION_REJECTED) + entité JPA `Notification` (`@PrePersist` défaut `created_at`)
  - [x] `NotificationRepository` : `findByUserIdOrderByCreatedAtDesc`, `countByUserIdAndReadIsFalse`, `markAllAsReadForUser` (`@Modifying @Query` bulk update)
  - [x] DTOs : `CreateNotificationRequest` (Bean Validation), `NotificationResponse` (factory `from(Notification)`), `UnreadCountResponse`
  - [x] `pom.xml` notification-service : ajout `spring-boot-starter-validation`
  - [x] `NotificationService` : `create`, `getMyNotifications`, `getUnreadCount`, `markAsRead` (404/403, idempotent), `markAllAsRead`
  - [x] `NotificationController` (public) : `GET /mine`, `GET /unread-count`, `POST /{id}/read`, `POST /read-all` avec `@RequestHeader("X-User-Id")`
  - [x] `InternalNotificationController` : `POST /internal/notifications` (201 Created) appelé par rental-service
  - [x] `NotificationClientService` côté rental-service + bean `notificationRestClient` (timeout 3s, graceful degradation : un échec d'envoi ne casse pas la transition)
  - [x] `ApplicationService` côté rental : envoi d'une notification au propriétaire lors de `create` (APPLICATION_CREATED) et au candidat lors de `accept` (APPLICATION_ACCEPTED) / `reject` (APPLICATION_REJECTED)
  - [x] `application.yml` / `application-docker.yml` rental-service : `services.notification-url` branché sur `NOTIFICATION_SERVICE_URL`
  - [x] `docker-compose.yml` : env `NOTIFICATION_SERVICE_URL` pour rental-service
  - [x] Frontend `notificationsApi.ts` : couche API typée (`getMine`, `getUnreadCount`, `markAsRead`, `markAllAsRead`) + type `NotificationType`
  - [x] Frontend `NotificationBell.tsx` : cloche dans le header, badge unread (polling TanStack Query 30s + refetch on focus), dropdown avec liste, bullet bleu sur non-lu, temps relatif, click → mark-as-read + navigation vers la page candidatures correspondante, bouton "Tout marquer comme lu", click-outside pour fermer
  - [x] Frontend `Header.tsx` : intégration de `NotificationBell` entre le lien Candidatures et Mon Profil
  - [x] Tests unitaires `NotificationServiceTest` (**9/9 verts**) : create, getMyNotifications (non-vide + vide), getUnreadCount, markAsRead (happy, idempotent, not-found, non-owner), markAllAsRead
  - [x] Tests rental-service (**16/16 verts**) : `ApplicationServiceTest` mis à jour avec mock `NotificationClientService`
  - [x] Commits atomiques sur `feat/notifications-service-and-bell` : `feat(notification): ...migration+entity+repo+dtos`, `feat(notification): ...service+endpoints`, `feat(rental): ...notify on transitions`, `feat(frontend): ...notification bell`, `test(notification): ...unit tests`

- **Étape 14** — Page Paramètres + finitions UI _(2026-04-15)_
  - [x] `authApi.updateMe` (PUT `/api/auth/me`) et nouvelle méthode `setUser` dans `authStore`
  - [x] Page `SettingsPage` : react-hook-form + Zod, pré-remplie via `GET /api/auth/me`, mise à jour via `authApi.updateMe`, synchro `authStore.setUser`, gestion 409 (email déjà utilisé) avec `setError` + toast
  - [x] Route protégée `/profile` câblée sur `SettingsPage` (lien `Mon Profil` du header actif)
  - [x] Intégration de `sonner` (v2.0.7) + `<Toaster position="top-right" richColors closeButton />` monté au niveau de `App.tsx`
  - [x] Composant partagé `Loader` (spinner `lucide-react` + label configurable)
  - [x] Composant partagé `EmptyState` (icône, titre, description, CTA optionnel, style card pointillée indigo)
  - [x] Refonte des états vides et loaders sur toutes les pages : `HomePage` (tenant + owner), `MyListingsPage`, `MyApplicationsPage`, `ReceivedApplicationsPage`, `ListingDetailPage`, `ApplyPage`, `ListingFormPage`, `SettingsPage`
  - [x] Branchage des toasts dans les mutations clés : création/édition/suppression d'annonce (avec message dédié pour 409 annonce verrouillée), création/acceptation/refus de candidature, mise à jour du profil
  - [x] Build Vite vert (1964 modules, 516 KB bundle)
  - [x] Branche : `feat/settings-and-ui-polish`

- **Étape 15** — Tests ciblés, seed de démo, parcours utilisateur _(2026-04-15)_
  - [x] `JwtServiceTest` enrichi (9/9 verts) : ajout `extractFullName`, `isTokenValid` avec signature d'une autre clé, `isTokenValid` sur chaîne vide
  - [x] `ListingServiceTest` enrichi (11/11 verts) : propagation du flag `locked` via `getMyListings` batch, court-circuit du `RentalClientService` sur liste vide, exposition du `locked` via `getById`
  - [x] Full suite Maven multi-modules verte : auth (9) + catalog (11) + rental (16) + notification (9) = **45 tests OK**
  - [x] Script `scripts/seed.sh` idempotent : 2 comptes démo (`alice@loxia.dev`, `bob@loxia.dev` / `password123`), 4 annonces (Lyon T2, Paris studio, Marseille maison, Bordeaux loft), 1 candidature `PENDING` d'Alice sur le T2 de Bob, readiness probe sur `/actuator/health`, fallback login sur 409
  - [x] Test d'idempotence vérifié : re-run avec comptes existants → login fallback OK
  - [x] `docs/demo-script.md` : parcours de démo ~5 min en 8 étapes (visiteur, inscription, candidature, règle de lock, notifications, accept/refuse, profil, empty states) + troubleshooting
  - [x] Branche : `chore/tests-and-demo-seed`

## ⏳ Backlog

### ✨ Phase Polish

- [ ] **Étape 16** — Documentation finale (README + doc technique)
  - Compléter `docs/architecture.md` (vue d'ensemble, ADRs, schémas C4, séquences UML)
  - Refonte complète du `README.md` : pitch, stack, architecture, démarrage rapide, parcours de démo
  - Ajouter section **Équipe** au README avec les 6 membres : Ugo Durand, Jonas Obrun, Nicolas Ramirez, Cyril Grosjean, Ibrahim Khan, Tarek El Missiry
  - Tag de release `v1.0.0`
  - Branche : `docs/final-readme-and-architecture`
  - _(pas de rapport écrit — seulement README + doc technique)_

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
- **Aucune mention d'IA / assistant dans les commits, PR, code review, commentaires de code**

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
