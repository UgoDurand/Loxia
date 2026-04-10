# Loxia — Documentation d'architecture

> Ce document est un **squelette** vivant. Il sera étoffé au fur et à mesure de l'avancement du projet (cf. [`../TASKS.md`](../TASKS.md)).
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

Loxia est une application web de location de logements bâtie en architecture microservices. Le système est composé de **4 microservices métier** orchestrés derrière une **API Gateway** unique, d'un **front-end React** et d'une **base PostgreSQL** (4 schémas isolés). L'ensemble est conteneurisé via Docker Compose.

> _À étoffer : objectifs métier, périmètre fonctionnel détaillé, glossaire, contraintes du projet pédagogique._

---

## 2. Microservices

Chaque microservice correspond à un **bounded context** au sens DDD. Les responsabilités sont strictement cloisonnées : un service n'accède **jamais** à la base d'un autre.

| Service                | Bounded context                                          | Responsabilités principales                              | Entités principales            |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------ |
| `auth-service`         | Identité & authentification                              | Inscription, connexion, JWT, profil utilisateur          | `User`, `RefreshToken`         |
| `catalog-service`      | Annonces immobilières                                    | CRUD listings, recherche, filtres                        | `Listing`, `ListingPhoto`      |
| `rental-service`       | Candidatures & cycle de location                         | Dépôt, accept/reject, règle de verrouillage              | `Application`                  |
| `notification-service` | Notifications in-app                                     | Création, lecture, compteur cloche                       | `Notification`                 |
| `gateway`              | Point d'entrée unique                                    | Routage, validation JWT, propagation `X-User-*`, CORS    | —                              |

> _À étoffer : pour chaque service, détailler le diagramme de classes des entités, la liste exhaustive des endpoints, les règles métier internes, les invariants._

---

## 3. Communication inter-services

### Choix retenu
**REST synchrone uniquement**, via `Spring RestClient`. Pas de message broker pour ce projet (trade-off pédagogique : on assume une cohérence éventuelle là où c'est nécessaire).

### Flux principaux
- **`catalog → rental`** : vérification de la règle de verrouillage avant `PUT`/`DELETE` d'une annonce
- **`catalog → auth`** : enrichissement du nom du propriétaire dans les détails d'annonce
- **`rental → notification`** : création d'une notification lors d'une action sur une candidature

### Convention d'endpoints internes
- Tous les endpoints inter-services sont préfixés `/internal/**`
- Ces endpoints sont **bloqués explicitement** par la gateway (deny-list) : ils ne sont accessibles que sur le réseau Docker interne
- Les services downstream ne sont **pas exposés** sur l'hôte (`expose:` seulement, pas de `ports:`)

> _À étoffer : diagrammes de séquence UML pour chaque flux clé (lock check, enrichissement owner, notification post-accept, etc.). Politiques de timeout et de retry. Stratégie en cas de défaillance d'un service distant._

---

## 4. Authentification & habilitations

### Modèle de compte
**Compte unifié** : un utilisateur unique peut basculer entre une vue _Locataire_ et une vue _Propriétaire_ sans changer de compte. Côté back, **un seul rôle `ROLE_USER`**. Le toggle UI est purement front. Les autorisations sont contextuelles (ownership) :
- "Je peux modifier cette annonce **si** `listing.ownerId == jwt.userId`."
- "Je peux accepter cette candidature **si** l'annonce concernée m'appartient."

### Stratégie JWT
- Algorithme : **HS256**, secret partagé via `JWT_SECRET` (variable d'environnement)
- **Access token** : durée 15 minutes, contient `sub=userId`, `email`, `fullName`
- **Refresh token** : durée 7 jours, stocké hashé (SHA-256) dans `auth_db.refresh_tokens`

### Validation
- **Validation centralisée à la gateway** via un `GlobalFilter` Spring Cloud Gateway
- Whitelist des routes publiques : `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `GET /api/listings/**`
- Sur succès, la gateway propage 3 headers vers les services downstream : `X-User-Id`, `X-User-Email`, `X-User-FullName`
- Les services downstream font confiance à ces headers (modèle "gateway-centric trust")
- Sécurité réseau : seule la gateway est exposée sur l'hôte → impossible d'injecter des headers falsifiés depuis l'extérieur

> _À étoffer : schéma du flow OAuth/JWT, politique de rotation des refresh tokens, gestion du logout, dette technique sur le stockage du refresh token côté front._

---

## 5. Configuration

### Approche en 3 couches (sans Spring Cloud Config)

1. **`application.yml`** dans chaque service — défauts pour le développement local "sans Docker"
2. **`application-docker.yml`** — profil activé via `SPRING_PROFILES_ACTIVE=docker`, override les URLs internes (ex: `jdbc:postgresql://loxia-db:5432/auth_db`)
3. **Variables d'environnement** depuis un fichier `.env` à la racine — pour les secrets et tout ce qui varie par environnement (`JWT_SECRET`, `POSTGRES_PASSWORD`, URLs des services, etc.)

`.env.example` est committé comme template. `.env` est dans `.gitignore` et ne doit jamais être versionné.

> _À étoffer : justification du choix vs Spring Cloud Config Server / Vault / Consul. Politique de rotation des secrets pour la démo. Liste exhaustive des variables._

---

## 6. Données & persistance

### Choix du SGBD
**PostgreSQL 16** dans un conteneur unique `loxia-db`, hébergeant 4 bases isolées :
- `auth_db`
- `catalog_db`
- `rental_db`
- `notification_db`

Création des bases via `scripts/init-multi-db.sh` exécuté au démarrage du conteneur.

### Migrations
**Flyway** par service. Fichiers `V<n>__<description>.sql` dans `src/main/resources/db/migration/`. Migration automatique au démarrage du service.

### Conventions
- Tables et colonnes en `snake_case`
- Clés primaires : `uuid` (`gen_random_uuid()`)
- Timestamps `created_at` / `updated_at` (`TIMESTAMPTZ`) sur les entités principales
- Indexes explicites sur les FK et les colonnes de filtre fréquent

### Règles d'isolation
- **Aucun service ne lit/écrit dans la base d'un autre service.**
- **Aucune jointure SQL cross-service.**
- Les données partagées (ex: nom d'un utilisateur) sont récupérées via appels REST internes.

> _À étoffer : modèle physique de chaque base, schéma ER, politique de backup pour la démo, taille estimée._

---

## 7. Déploiement & infrastructure

### Conteneurisation
**Docker** pour chaque service (`Dockerfile` multi-stage : build Maven puis JRE slim). **Docker Compose v2** pour l'orchestration locale.

### Topologie Docker Compose
| Conteneur               | Image / Build              | Port hôte | Notes                            |
| ----------------------- | -------------------------- | --------- | -------------------------------- |
| `loxia-db`              | `postgres:16`              | —         | 4 bases créées par script d'init |
| `pgadmin`               | `dpage/pgadmin4:8`         | 8090      | Dev only — serveur pré-enregistré via `config/pgadmin/servers.json` |
| `auth-service`          | build local                | —         | Réseau interne uniquement        |
| `catalog-service`       | build local                | —         | Réseau interne uniquement        |
| `rental-service`        | build local                | —         | Réseau interne uniquement        |
| `notification-service`  | build local                | —         | Réseau interne uniquement        |
| `gateway`               | build local                | **8080**  | Seul service exposé sur l'hôte   |
| `frontend`              | build local (multi-stage)  | **3000**  | Nginx servant le build React     |

### Healthchecks
Chaque service Spring Boot expose `/actuator/health`. Docker Compose utilise ces endpoints pour le `HEALTHCHECK` et les `depends_on: condition: service_healthy`.

### Ordre de démarrage
1. `loxia-db`
2. Microservices (en parallèle, dépendent de `loxia-db` healthy)
3. `gateway` (dépend des microservices healthy)
4. `frontend` (dépend de `gateway` healthy)

> _À étoffer : Dockerfile annoté de chaque service, fichier `docker-compose.yml` commenté, instructions précises de démarrage et de débogage, hypothèses de déploiement en production (k8s, cloud, ...) à mentionner comme évolution possible dans le rapport._

---

## 8. Décisions architecturales (ADRs)

> Format ADR (Architecture Decision Record) : à compléter au fil de l'eau pour documenter les choix structurants et leurs justifications.

### ADR-001 — Choix de Java + Spring Boot pour le back-end
_À rédiger._

### ADR-002 — Découpage en 4 microservices métier
_À rédiger._

### ADR-003 — REST synchrone uniquement (pas de message broker)
_À rédiger._

### ADR-004 — Compte unifié sans rôle Locataire/Propriétaire
_À rédiger._

### ADR-005 — JWT validé uniquement à la gateway, propagation par headers
_À rédiger._

### ADR-006 — PostgreSQL avec une base par service dans un conteneur unique
_À rédiger._

### ADR-007 — Spring Cloud Gateway plutôt que Kong/Traefik
_À rédiger._

### ADR-008 — Pas de service discovery (DNS Docker Compose)
_À rédiger._

### ADR-009 — Pas de Spring Cloud Config (`application.yml` + `.env`)
_À rédiger._

### ADR-010 — Règle de verrouillage cross-service via REST synchrone
_À rédiger._

---

## 9. Risques connus & mitigations

| Risque                                                              | Mitigation                                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Race condition sur la règle de lock                                 | Acceptée pour le projet. Documentée comme trade-off. Évolution possible : verrou applicatif ou Saga.    |
| Ordre de boot Docker (service pas prêt)                             | Healthchecks Spring Boot Actuator + `depends_on: service_healthy` + pas d'appel inter-services au boot. |
| Dérive DTO back/front                                               | Fichier `frontend/src/types/api.ts` synchronisé manuellement. Évolution : génération depuis OpenAPI.    |
| Fuite d'endpoints `/internal/**`                                    | Gateway exposée seule + deny-list explicite + test d'intégration sur la gateway.                        |
| Monolithe distribué (trop d'appels en cascade)                      | Max 1-2 appels inter-services par endpoint externe. Endpoints batch. Flux documentés en séquences UML.  |
| Stockage refresh token côté front en `localStorage`                 | Trade-off pour le dev local. À documenter dans le rapport. Évolution : cookie `HttpOnly SameSite=Strict`. |

---

> 📌 Ce document évoluera au fil du projet. À chaque jalon, mettre à jour les sections correspondantes et ajouter les ADRs des décisions prises.
