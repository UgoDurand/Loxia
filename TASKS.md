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

---

## 🚧 In progress

_(rien en cours — prochaine étape = Étape 10 filtre JWT gateway + pages Login/Register front)_

---

## ⏳ Backlog

### 🏗 Phase d'amorçage (squelette technique)

_(Phase terminée — voir section Done ci-dessus)_

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
