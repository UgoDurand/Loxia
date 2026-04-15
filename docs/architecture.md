# Loxia — Documentation d'architecture

> Pour la vue grand public et les captures d'écran, voir [`../README.md`](../README.md).

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Microservices](#2-microservices)
3. [Communication inter-services](#3-communication-inter-services)
4. [Authentification & habilitations](#4-authentification--habilitations)
5. [Configuration](#5-configuration)
6. [Données & persistance](#6-données--persistance)
7. [Déploiement & infrastructure](#7-déploiement--infrastructure)
8. [Décisions architecturales (ADRs)](#8-décisions-architecturales-adrs)
9. [Risques connus & mitigations](#9-risques-connus--mitigations)

---

## 1. Vue d'ensemble

Loxia est une application web de location de logements bâtie en **architecture microservices**. Le système est composé de **4 microservices métier** orchestrés derrière une **API Gateway** unique, d'un **front-end React** et d'une **base PostgreSQL** (4 bases isolées). L'ensemble est conteneurisé via Docker Compose.

### Objectifs pédagogiques

Ce projet a pour but de démontrer la mise en œuvre d'une architecture distribuée réaliste dans un contexte d'école d'ingénieur :

- Découpage en bounded contexts au sens DDD
- Authentification centralisée par token JWT
- Communication inter-services via REST synchrone
- Isolation stricte des données (une base par service)
- Conteneurisation et orchestration Docker
- Interface utilisateur React découplée de la couche API

### Périmètre fonctionnel

| Fonctionnalité | Implémentée |
|---|---|
| Inscription / connexion / déconnexion | ✅ |
| Refresh automatique du JWT (intercepteur Axios) | ✅ |
| Profil utilisateur (lecture + mise à jour) | ✅ |
| Recherche d'annonces avec filtres (ville, type, prix) | ✅ |
| Consultation du détail d'une annonce | ✅ |
| Création / modification / suppression d'annonce | ✅ |
| Règle de verrouillage (annonce non modifiable si candidature en cours) | ✅ |
| Dépôt de candidature | ✅ |
| Suivi des candidatures envoyées (locataire) | ✅ |
| Réception et traitement des candidatures (propriétaire) | ✅ |
| Notifications in-app (cloche, compteur, marquage lu) | ✅ |

**Hors scope** : paiement, chat en direct, upload réel de fichiers (photos simulées par URL), carte géographique, notifications email/push.

### Glossaire

| Terme | Définition |
|---|---|
| **Annonce** (`Listing`) | Bien immobilier mis en location par un utilisateur en mode propriétaire |
| **Candidature** (`Application`) | Demande de location déposée par un utilisateur en mode locataire sur une annonce |
| **Verrouillage** (`lock`) | État d'une annonce ayant au moins une candidature `PENDING` ou `ACCEPTED` — elle ne peut plus être modifiée ni supprimée |
| **Compte unifié** | Un seul compte utilisateur peut alterner entre les rôles propriétaire et locataire sans recréer de compte |
| **Gateway** | Point d'entrée unique du système, validant le JWT et routant les requêtes vers les bons services |
| **X-User-\*** | Headers HTTP propagés par la gateway aux services downstream après validation du JWT |

---

## 2. Microservices

Chaque microservice correspond à un **bounded context** au sens DDD. Les responsabilités sont strictement cloisonnées : un service n'accède **jamais** à la base d'un autre.

| Service | Port | Bounded context | Responsabilités | Entités principales |
|---|---|---|---|---|
| `auth-service` | 8081 | Identité & authentification | Inscription, connexion, JWT, refresh token, profil | `User`, `RefreshToken` |
| `catalog-service` | 8082 | Annonces immobilières | CRUD annonces, recherche filtrée, enrichissement propriétaire, flag locked | `Listing` |
| `rental-service` | 8083 | Candidatures & cycle de location | Dépôt, acceptation/refus, règle de verrouillage, notifications | `Application` |
| `notification-service` | 8084 | Notifications in-app | Création, lecture, compteur cloche, marquage lu | `Notification` |
| `gateway` | 8080 | Point d'entrée unique | Routage, validation JWT, propagation `X-User-*`, CORS, blocage `/internal/**` | — |

### Endpoints exposés (via gateway)

#### `auth-service`
| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Non | Inscription |
| `POST` | `/api/auth/login` | Non | Connexion, retourne access + refresh token |
| `POST` | `/api/auth/refresh` | Non | Rotation du refresh token |
| `POST` | `/api/auth/logout` | Oui | Révocation du refresh token |
| `GET` | `/api/auth/me` | Oui | Lecture du profil courant |
| `PUT` | `/api/auth/me` | Oui | Mise à jour du profil |

#### `catalog-service`
| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/api/listings` | Non | Recherche d'annonces (filtres : `city`, `type`, `minPrice`, `maxPrice`) |
| `GET` | `/api/listings/{id}` | Non | Détail d'une annonce |
| `GET` | `/api/listings/mine` | Oui | Annonces de l'utilisateur connecté |
| `POST` | `/api/listings` | Oui | Création d'une annonce |
| `PUT` | `/api/listings/{id}` | Oui | Mise à jour (bloquée si locked) |
| `DELETE` | `/api/listings/{id}` | Oui | Suppression (bloquée si locked) |

#### `rental-service`
| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/api/applications` | Oui | Dépôt d'une candidature |
| `GET` | `/api/applications/mine` | Oui | Candidatures envoyées |
| `GET` | `/api/applications/received` | Oui | Candidatures reçues (propriétaire) |
| `POST` | `/api/applications/{id}/accept` | Oui | Acceptation d'une candidature |
| `POST` | `/api/applications/{id}/reject` | Oui | Refus d'une candidature |

#### `notification-service`
| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications/mine` | Oui | Liste des notifications |
| `GET` | `/api/notifications/unread-count` | Oui | Compteur de notifications non lues |
| `POST` | `/api/notifications/{id}/read` | Oui | Marquage d'une notification comme lue |
| `POST` | `/api/notifications/read-all` | Oui | Marquage de toutes les notifications comme lues |

### Endpoints internes (réseau Docker uniquement)

Ces endpoints sont accessibles uniquement entre services sur le réseau Docker interne. Ils sont **explicitement bloqués** par la gateway (deny-list sur `/internal/**`).

| Service | Méthode | Chemin | Utilisé par |
|---|---|---|---|
| `auth-service` | `GET` | `/internal/users/{id}` | catalog-service, rental-service |
| `catalog-service` | `GET` | `/internal/listings/{id}` | rental-service |
| `catalog-service` | `GET` | `/internal/listings/owner/{ownerId}` | rental-service |
| `rental-service` | `GET` | `/internal/applications/listing/{id}/locked` | catalog-service |
| `rental-service` | `POST` | `/internal/applications/locks` | catalog-service (batch) |
| `notification-service` | `POST` | `/internal/notifications` | rental-service |

---

## 3. Communication inter-services

### Choix retenu

**REST synchrone uniquement**, via `Spring RestClient` (Spring 6.1+). Pas de message broker pour ce projet — trade-off pédagogique délibéré : on simplifie l'infrastructure en acceptant un couplage temporel sur les appels synchrones.

### Flux principaux

```
┌───────────────────────────────────────────────────────────────────┐
│                        catalog-service                            │
│  PUT /listings/{id}  ──► GET /internal/applications/.../locked    │
│                                    │ rental-service               │
│                          ◄─────────┘                             │
│  Si rental down : fail-safe → bloque la modification             │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        catalog-service                            │
│  GET /listings/{id}  ──► GET /internal/users/{id}                │
│                                    │ auth-service                 │
│                          ◄─────────┘                             │
│  Graceful degradation : si auth down → ownerName = null          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        rental-service                             │
│  POST /applications/{id}/accept  ──► POST /internal/notifications│
│                                           │ notification-service  │
│                                  ◄────────┘                      │
│  Graceful degradation : si notif down → transition réussit quand même │
└───────────────────────────────────────────────────────────────────┘
```

### Diagramme de séquence — Dépôt d'une candidature (happy path)

```
Client      Gateway     rental-service   catalog-service   auth-service   notification-service
  │            │               │                │               │                │
  │─POST /api/applications────►│               │               │                │
  │            │─validate JWT  │               │               │                │
  │            │─X-User-Id ───►│               │               │                │
  │            │               │─GET /internal/listings/{id}──►│                │
  │            │               │◄──────────────────────────────│                │
  │            │               │─GET /internal/users/{ownerId}►│                │
  │            │               │◄──────────────────────────────│                │
  │            │               │─POST /internal/notifications ─────────────────►│
  │            │               │◄────────────────────────────────────────────────│
  │            │◄──201 Created─│               │               │                │
  │◄───────────│               │               │               │                │
```

### Diagramme de séquence — Règle de verrouillage (PUT annonce bloquée)

```
Client      Gateway     catalog-service   rental-service
  │            │               │                │
  │─PUT /api/listings/{id}────►│               │
  │            │─validate JWT  │               │
  │            │─X-User-Id ───►│               │
  │            │               │─GET /internal/applications/listing/{id}/locked──►│
  │            │               │◄── { locked: true } ─────────────────────────────│
  │            │               │                │
  │            │               │  lock = true → rejette la mise à jour
  │            │◄──409 Conflict│               │
  │◄───────────│               │               │
```

### Diagramme de séquence — Acceptation d'une candidature

```
Client      Gateway     rental-service   catalog-service   auth-service   notification-service
  │            │               │                │               │                │
  │─POST /api/applications/{id}/accept─────────►│               │                │
  │            │─validate JWT  │               │               │                │
  │            │─X-User-Id ───►│               │               │                │
  │            │               │  vérifie ownership (listing.ownerId == X-User-Id)
  │            │               │─GET /internal/listings/{id}──►│                │
  │            │               │◄──────────────────────────────│                │
  │            │               │  status PENDING → ACCEPTED
  │            │               │─POST /internal/notifications (to applicant) ───►│
  │            │               │◄────────────────────────────────────────────────│
  │            │◄──200 OK──────│               │               │                │
  │◄───────────│               │               │               │                │
```

### Politiques de timeout et de dégradation

| Appel | Timeout | Comportement si KO |
|---|---|---|
| catalog → rental (lock check) | 3 s | **Fail-safe** : retourne `locked=true`, bloque la modification |
| catalog → auth (owner name) | 3 s | **Graceful degradation** : `ownerName` null, la réponse est quand même retournée |
| rental → catalog (listing info) | 3 s | **Graceful degradation** : champs listing null dans la réponse candidature |
| rental → auth (user info) | 3 s | **Graceful degradation** : champs user null dans la réponse candidature |
| rental → notification | 3 s | **Graceful degradation** : la transition réussit, la notification est perdue |

---

## 4. Authentification & habilitations

### Modèle de compte

**Compte unifié** : un utilisateur unique peut basculer entre une vue _Locataire_ et une vue _Propriétaire_ sans changer de compte ni de session. Côté back, **un seul rôle `ROLE_USER`**. Le toggle UI est purement front et n'a aucun impact sur les autorisations.

Les autorisations sont contextuelles (vérification d'ownership en service) :
- "Je peux modifier cette annonce **si** `listing.ownerId == X-User-Id`."
- "Je peux accepter cette candidature **si** l'annonce concernée m'appartient."
- "Je ne peux pas candidater à ma propre annonce."

### Stratégie JWT

- Algorithme : **HS256**, secret partagé via variable d'environnement `JWT_SECRET`
- **Access token** : durée 15 minutes, contient `sub=userId`, `email`, `fullName`
- **Refresh token** : durée 7 jours, stocké hashé (SHA-256 Base64url) dans `auth_db.refresh_tokens`; rotation à chaque usage (le token précédent est révoqué)

### Flux d'authentification

```
Client                    Gateway                  auth-service
  │                          │                          │
  │─POST /api/auth/login ───►│                          │
  │    (email, password)     │──────────────────────────►│
  │                          │                          │  BCrypt verify
  │                          │                          │  generate access token (15 min)
  │                          │                          │  generate refresh token (7 days, hashed)
  │                          │◄──────────────────────────│
  │◄── { accessToken, refreshToken } ──────────────────│
  │                          │                          │
  │  [15 min later]          │                          │
  │─POST /api/auth/refresh ─►│                          │
  │    (refreshToken)        │──────────────────────────►│
  │                          │                          │  validate hash
  │                          │                          │  rotate → new tokens
  │                          │◄──────────────────────────│
  │◄── { accessToken, refreshToken } ──────────────────│
```

### Validation à la gateway

La gateway implémente un `GlobalFilter` (`JwtAuthenticationFilter`) qui :
1. Laisse passer sans validation les routes publiques : `POST /api/auth/**`, `GET /api/listings/**`, `/actuator/**`
2. Bloque explicitement toutes les routes `/internal/**` (403)
3. Valide la signature HS256 du JWT sur toutes les autres routes
4. Propage 3 headers vers les services downstream : `X-User-Id`, `X-User-Email`, `X-User-FullName`

Les services downstream ne revalident jamais la signature — ils font confiance aux headers `X-User-*` (modèle "gateway-centric trust"). Ce modèle est sécurisé tant que les microservices ne sont pas exposés directement sur l'hôte (ce qui est garanti par Docker Compose : seule la gateway a un `ports:`, les autres n'ont que `expose:`).

---

## 5. Configuration

### Approche en 3 couches (sans Spring Cloud Config)

1. **`application.yml`** dans chaque service — défauts pour le développement local sans Docker (URLs en `localhost`, ports directs)
2. **`application-docker.yml`** — profil activé via `SPRING_PROFILES_ACTIVE=docker`, override les URLs internes vers les DNS Docker Compose (ex: `loxia-db:5432`, `auth-service:8081`)
3. **Variables d'environnement** depuis `.env` à la racine — secrets et valeurs par environnement (`JWT_SECRET`, `POSTGRES_PASSWORD`, URLs de services)

`.env.example` est committé comme template. `.env` est dans `.gitignore`.

### Variables d'environnement principales

| Variable | Utilisée par | Description |
|---|---|---|
| `JWT_SECRET` | auth-service, gateway | Clé HMAC-SHA256 pour signer/valider les JWT |
| `POSTGRES_PASSWORD` | loxia-db, tous les services | Mot de passe PostgreSQL |
| `PGADMIN_DEFAULT_EMAIL` | pgadmin | Email de connexion pgAdmin |
| `PGADMIN_DEFAULT_PASSWORD` | pgadmin | Mot de passe pgAdmin |
| `AUTH_SERVICE_URL` | catalog-service, rental-service | URL interne de auth-service |
| `CATALOG_SERVICE_URL` | rental-service | URL interne de catalog-service |
| `RENTAL_SERVICE_URL` | catalog-service | URL interne de rental-service |
| `NOTIFICATION_SERVICE_URL` | rental-service | URL interne de notification-service |

---

## 6. Données & persistance

### Choix du SGBD

**PostgreSQL 16** dans un conteneur unique `loxia-db`, hébergeant 4 bases isolées :
- `auth_db`
- `catalog_db`
- `rental_db`
- `notification_db`

Création des bases via `scripts/init-multi-db.sh` exécuté au premier démarrage du conteneur.

### Migrations

**Flyway** par service. Fichiers `V<n>__<description>.sql` dans `src/main/resources/db/migration/`. Migration automatique au démarrage du service.

| Service | Migrations |
|---|---|
| auth-service | `V1__init.sql` — tables `users` + `refresh_tokens` |
| catalog-service | `V1__create_listings_table.sql` — table `listings` |
| rental-service | `V1__create_applications_table.sql` — table `applications` |
| notification-service | `V1__create_notifications_table.sql` — table `notifications` |

### Modèle de données simplifié

```
auth_db
  users             (id UUID PK, email UNIQUE, password_hash, full_name, created_at, updated_at)
  refresh_tokens    (id UUID PK, user_id FK, token_hash, expires_at, created_at)

catalog_db
  listings          (id UUID PK, owner_id UUID, title, description, city, type,
                     surface, rooms, price, photo_urls TEXT, created_at, updated_at)

rental_db
  applications      (id UUID PK, listing_id UUID, applicant_id UUID, status,
                     monthly_income, employment_status, message, created_at, updated_at)

notification_db
  notifications     (id UUID PK, user_id UUID, type, title, body,
                     read BOOLEAN, created_at)
```

### Règles d'isolation

- **Aucun service ne lit/écrit dans la base d'un autre service.**
- **Aucune jointure SQL cross-service.** Les données partagées (nom d'un utilisateur, titre d'une annonce) sont récupérées via appels REST internes, puis utilisées uniquement en mémoire pour enrichir les réponses.

---

## 7. Déploiement & infrastructure

### Conteneurisation

**Docker** pour chaque service (Dockerfile multi-stage : build Maven puis JRE slim). **Docker Compose v2** pour l'orchestration locale.

Chaque Dockerfile suit le même patron :
1. **Stage 1 — build** : `maven:3.9-eclipse-temurin-21`, copie des POMs, `dependency:go-offline`, copie des sources, `mvn package -DskipTests`
2. **Stage 2 — runtime** : `eclipse-temurin:21-jre-alpine`, utilisateur non-root `loxia`, `EXPOSE <port>`, `ENTRYPOINT java -jar`

### Topologie Docker Compose

| Conteneur | Image | Port hôte | Notes |
|---|---|---|---|
| `loxia-db` | `postgres:16` | — | 4 bases créées par `scripts/init-multi-db.sh` |
| `pgadmin` | `dpage/pgadmin4:8` | **8090** | Dev only — serveur `Loxia DB` pré-enregistré |
| `auth-service` | build local | — | Port interne 8081 uniquement |
| `catalog-service` | build local | — | Port interne 8082 uniquement |
| `rental-service` | build local | — | Port interne 8083 uniquement |
| `notification-service` | build local | — | Port interne 8084 uniquement |
| `gateway` | build local | **8080** | Seul point d'entrée HTTP sur l'hôte |
| `frontend` | build local (multi-stage) | **3000** | Nginx sert le build Vite statique |

### Healthchecks et ordre de démarrage

Chaque service Spring Boot expose `/actuator/health`. Docker Compose utilise `depends_on: condition: service_healthy` pour garantir l'ordre :

```
loxia-db (healthy)
    └── auth-service, catalog-service, rental-service, notification-service (healthy, en parallèle)
            └── gateway (healthy)
                    └── frontend (healthy)
```

Au premier build : compter **5 à 10 minutes** (téléchargement des dépendances Maven). Les builds suivants utilisent le cache Docker layer.

---

## 8. Décisions architecturales (ADRs)

### ADR-001 — Java 21 + Spring Boot 3.3 pour le back-end

**Contexte** : choix du langage et du framework pour les 4 microservices métier et la gateway.

**Décision** : Java 21 LTS + Spring Boot 3.3.x.

**Justification** : Java 21 est la version LTS courante au moment du projet, avec virtual threads (Project Loom) disponibles. Spring Boot est le standard de facto en entreprise pour les microservices Java, avec un écosystème mature (Spring Data JPA, Spring Security, Spring Cloud Gateway, Spring RestClient). La compatibilité native avec les outils pédagogiques de l'école (Maven, IntelliJ) est également un facteur.

**Alternatives écartées** : Quarkus (moins répandu), Micronaut (moins familier), Go/Node.js (hors scope du cours).

---

### ADR-002 — Découpage en 4 microservices métier

**Contexte** : définir le nombre et les responsabilités des services.

**Décision** : 4 services (`auth`, `catalog`, `rental`, `notification`) + 1 gateway.

**Justification** : chaque service correspond à un bounded context DDD clair, avec des entités et des règles métier cohésives. Ce découpage permet à chaque membre de l'équipe de travailler de manière relativement indépendante. En dessous de 4 services, le projet perdait son intérêt pédagogique ; au-delà, le coût opérationnel (Dockerfiles, configurations, inter-service calls) devenait disproportionné.

**Alternatives écartées** : monolithe (trop simple), découpage plus fin type CQRS (trop complexe).

---

### ADR-003 — REST synchrone uniquement (pas de message broker)

**Contexte** : définir le mécanisme de communication inter-services.

**Décision** : REST synchrone via `Spring RestClient`, pas de Kafka/RabbitMQ.

**Justification** : un message broker aurait été la solution "production grade" pour le découplage et la résilience, mais il ajoute une infrastructure lourde (broker, sérialisation, topics, consumers) qui alourdit inutilement le projet pédagogique. Les flux sont simples et peu nombreux (3 flux principaux). La race condition sur la règle de lock est acceptée et documentée comme dette technique.

**Conséquences** : couplage temporel sur les appels synchrones, nécessité de timeout et fail-safe explicites.

---

### ADR-004 — Compte unifié sans rôle Locataire/Propriétaire

**Contexte** : gestion des rôles utilisateur.

**Décision** : un seul `ROLE_USER`. Le toggle Locataire/Propriétaire est un filtre UI front uniquement.

**Justification** : dans la réalité, un même utilisateur peut louer un appartement et en posséder un autre. Forcer deux comptes séparés crée une friction inutile. Côté back, les autorisations sont contextuelles (ownership de l'annonce), pas basées sur un rôle global. Cela simplifie aussi la gestion JWT (pas besoin d'un claim `role` dans le token).

---

### ADR-005 — JWT validé uniquement à la gateway, propagation par headers

**Contexte** : où valider les tokens JWT dans une architecture microservices.

**Décision** : validation centralisée à la gateway, propagation des claims via `X-User-Id`, `X-User-Email`, `X-User-FullName`.

**Justification** : valider le JWT dans chaque service aurait dupliqué la logique de sécurité et nécessité de distribuer le secret `JWT_SECRET` à tous les services. La validation centralisée à la gateway est le pattern standard pour les architectures microservices derrière une gateway. Le modèle est sécurisé grâce à l'isolation réseau Docker (seule la gateway est exposée).

**Dette technique** : algorithme HS256 avec secret partagé. En production, on utiliserait RS256 avec une clé asymétrique ou un JWKS endpoint.

---

### ADR-006 — PostgreSQL avec une base par service dans un conteneur unique

**Contexte** : stratégie de persistance des données.

**Décision** : un conteneur PostgreSQL unique `loxia-db` hébergeant 4 bases isolées.

**Justification** : l'isolation logique (une base par service) respecte le principe microservices sans la complexité opérationnelle de 4 conteneurs PostgreSQL séparés. Pour un projet pédagogique local, un seul conteneur est largement suffisant. En production, chaque service aurait son propre cluster.

---

### ADR-007 — Spring Cloud Gateway plutôt que Kong/Traefik

**Contexte** : choix de l'API Gateway.

**Décision** : Spring Cloud Gateway.

**Justification** : rester dans l'écosystème Spring évite d'introduire un outil supplémentaire à apprendre. Spring Cloud Gateway est programmable en Java (le filtre JWT est un `GlobalFilter` Spring), ce qui rend le comportement transparent et pédagogique. Kong et Traefik sont des solutions très complètes mais leur configuration est plus opaque pour un projet d'école.

---

### ADR-008 — Pas de service discovery (DNS Docker Compose)

**Contexte** : comment les services se trouvent mutuellement.

**Décision** : DNS Docker Compose natif, URLs configurées en dur dans `application-docker.yml`.

**Justification** : Eureka/Consul apporte de la valeur dans un environnement dynamique où les instances de services sont créées et détruites à la volée. Dans Docker Compose avec une instance par service, les noms DNS sont stables. Ajouter un registre de services aurait compliqué inutilement l'infrastructure.

---

### ADR-009 — Pas de Spring Cloud Config (`application.yml` + `.env`)

**Contexte** : gestion de la configuration des services.

**Décision** : configuration en 3 couches (`application.yml` + profil `docker` + `.env`).

**Justification** : Spring Cloud Config Server apporte de la valeur dans un contexte de déploiement multi-environnements (dev, staging, prod) avec des configurations dynamiques. Pour ce projet à environnement unique (local Docker Compose), la complexité est injustifiée. L'approche retenue est simple, lisible, et familière pour tous les membres de l'équipe.

---

### ADR-010 — Règle de verrouillage cross-service via REST synchrone

**Contexte** : implémenter la règle "une annonce avec une candidature en cours ne peut être modifiée/supprimée".

**Décision** : appel REST synchrone `catalog → rental` avec timeout 3 s et comportement fail-safe (bloque si rental ne répond pas).

**Justification** : la règle doit être vérifiée avant chaque `PUT`/`DELETE` d'annonce. Un appel synchrone est le moyen le plus simple de la faire respecter. Le comportement fail-safe (bloquer si rental est down) est intentionnel : mieux vaut rejeter temporairement une modification légitime que permettre une modification sur un état inconnu. Une version batch (`POST /internal/applications/locks`) est disponible pour les listes d'annonces afin de limiter le nombre d'appels.

**Risque accepté** : race condition entre la vérification et le `UPDATE`. Documentée comme dette technique (voir section 9).

---

## 9. Risques connus & mitigations

| Risque | Impact | Mitigation | Statut |
|---|---|---|---|
| Race condition sur la règle de lock | Modification possible entre la vérification et l'UPDATE | Acceptée. Documentée comme trade-off. Évolution : verrou applicatif ou Saga pattern. | Dette connue |
| Ordre de boot Docker (service pas prêt) | Appels inter-services qui échouent au démarrage | Healthchecks Spring Actuator + `depends_on: service_healthy` + aucun appel inter-services au démarrage | Mitigé |
| Dérive DTO back/front | Erreurs de désérialisation silencieuses | Types partagés dans `frontend/src/types/` synchronisés manuellement | Acceptable |
| Fuite d'endpoints `/internal/**` | Injection de headers `X-User-*` falsifiés depuis l'extérieur | Gateway exposée seule + deny-list explicite sur `/internal/**` | Mitigé |
| Monolithe distribué | Latence excessive sur les endpoints qui chaînent les appels | Max 1-2 appels inter-services par endpoint. Endpoints batch. | Mitigé |
| Stockage refresh token en `localStorage` | Vol de token via XSS | Trade-off dev local. En production : cookie `HttpOnly SameSite=Strict`. | Dette connue |
| JWT HS256 avec secret partagé | Si le secret fuite, n'importe qui peut forger des tokens | Variable d'env non committée (`.env` gitignored). En production : RS256 + JWKS. | Dette connue |
| Pas de tracing distribué | Difficulté à déboguer les appels en cascade | Logs Spring Boot. En production : OpenTelemetry / Jaeger. | Hors scope |
