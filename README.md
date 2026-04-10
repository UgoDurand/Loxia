# Loxia

> **Plateforme de location immobilière en architecture microservices**
> Projet pédagogique d'architecture logicielle (école d'ingénieur).

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20v2-2496ed.svg)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-TBD-lightgrey.svg)](#licence)

---

## Sommaire

- [Présentation](#présentation)
- [Aperçu](#aperçu)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du dépôt](#structure-du-dépôt)
- [Stratégie de branches (GitFlow)](#stratégie-de-branches-gitflow)
- [Workflow de contribution](#workflow-de-contribution)
- [Suivi d'avancement](#suivi-davancement)
- [Documentation détaillée](#documentation-détaillée)
- [Équipe](#équipe)
- [Licence](#licence)

---

## Présentation

**Loxia** est une application web qui met en relation des **propriétaires** et des **locataires** pour la mise en location de logements. L'objectif pédagogique est de mettre en œuvre une **véritable architecture microservices** avec gestion de l'authentification, communication inter-services, conteneurisation et déploiement, tout en restant à un périmètre fonctionnel maîtrisable par une équipe d'étudiants.

L'application repose sur un concept de **compte unifié** : un même utilisateur peut, en un clic, basculer entre une vue _Locataire_ (recherche de biens, candidature) et une vue _Propriétaire_ (publication d'annonces, gestion des demandes), sans avoir à maintenir deux comptes distincts.

**Périmètre fonctionnel** :

- 🔍 Recherche d'annonces avec filtres (ville, type de bien, budget)
- 🏠 Consultation détaillée des annonces (photos, surface, prix, description)
- 📝 Dépôt de candidatures (revenus, situation pro, message)
- 📊 Tableau de bord locataire — suivi des candidatures (En attente / Validé / Refusé)
- ✏️ Création / modification / suppression d'annonces côté propriétaire
- 🔒 Règle métier : une annonce avec une candidature en cours ne peut être ni modifiée ni supprimée
- 📥 Tableau de bord propriétaire — réception et traitement des candidatures
- 🔔 Notifications in-app temps quasi-réel
- 👤 Authentification, profil unifié, paramètres de compte

**Hors scope** : pas de paiement, pas de chat en direct, pas d'upload réel de fichiers (photos simulées), pas de carte géographique.

---

## Aperçu

> Maquette validée — toutes les vues sont disponibles dans [`docs/mockups/`](docs/mockups).

### Page d'accueil (vue Locataire)

![Homepage Locataire](<docs/mockups/Capture d'écran 2026-04-10 113622.png>)

### Détail d'une annonce (avec bouton « Postuler »)

![Détail annonce](<docs/mockups/Capture d'écran 2026-04-10 113719.png>)

### Formulaire de candidature

![Formulaire candidature](<docs/mockups/Capture d'écran 2026-04-10 113725.png>)

### Tableau de bord Propriétaire

![Dashboard propriétaire](<docs/mockups/Capture d'écran 2026-04-10 113732.png>)

---

## Architecture

Loxia est découpé en **4 microservices métier** orchestrés derrière une **API Gateway** unique. Chaque service possède sa propre base PostgreSQL, garantissant une isolation stricte des données.

```
                              ┌──────────────────────────┐
                              │       Frontend           │
                              │  React + Vite + TS       │
                              │  Tailwind + shadcn/ui    │
                              └────────────┬─────────────┘
                                           │  HTTPS/REST
                                           ▼
                              ┌──────────────────────────┐
                              │       API Gateway        │
                              │  Spring Cloud Gateway    │
                              │  (JWT + routage + CORS)  │
                              └─┬──────┬──────┬──────┬───┘
                                │      │      │      │
            ┌───────────────────┘      │      │      └────────────────────┐
            ▼                          ▼      ▼                           ▼
   ┌────────────────┐        ┌────────────────┐        ┌──────────────────┐        ┌────────────────────┐
   │  auth-service  │        │ catalog-service│        │  rental-service  │        │notification-service│
   │  Spring Boot   │        │  Spring Boot   │        │  Spring Boot     │        │  Spring Boot       │
   │     :8081      │        │     :8082      │◄──────►│     :8083        │───────►│       :8084        │
   └────────┬───────┘        └────────┬───────┘  REST  └────────┬─────────┘  REST  └─────────┬──────────┘
            │                         │                         │                            │
            ▼                         ▼                         ▼                            ▼
   ┌────────────────┐        ┌────────────────┐        ┌──────────────────┐        ┌────────────────────┐
   │    auth_db     │        │   catalog_db   │        │    rental_db     │        │  notification_db   │
   │  (PostgreSQL)  │        │  (PostgreSQL)  │        │   (PostgreSQL)   │        │   (PostgreSQL)     │
   └────────────────┘        └────────────────┘        └──────────────────┘        └────────────────────┘
```

### Tableau récapitulatif

| Service                | Port  | Bounded context                                 | Responsabilités principales                          |
| ---------------------- | ----- | ----------------------------------------------- | ---------------------------------------------------- |
| `gateway`              | 8080  | Point d'entrée unique                           | Routage, validation JWT, propagation `X-User-*`, CORS |
| `auth-service`         | 8081  | Identité & authentification                     | Inscription, connexion, JWT, profil utilisateur       |
| `catalog-service`      | 8082  | Annonces immobilières                           | CRUD listings, recherche, filtres                     |
| `rental-service`       | 8083  | Candidatures & cycle de location                | Dépôt, acceptation/refus, règle de verrouillage       |
| `notification-service` | 8084  | Notifications in-app                            | Création, lecture, compteur cloche                    |

> Documentation architecturale détaillée : [`docs/architecture.md`](docs/architecture.md)

---

## Stack technique

### Back-end (par microservice)

| Composant               | Choix                                              |
| ----------------------- | -------------------------------------------------- |
| Langage                 | **Java 21 LTS**                                    |
| Framework               | **Spring Boot 3.3.x**                              |
| Build                   | **Maven** (parent POM dans `services/pom.xml`)     |
| Web                     | Spring Web (MVC)                                   |
| Persistance             | Spring Data JPA + Hibernate                        |
| Sécurité                | Spring Security 6 + jjwt (JWT HS256)               |
| Validation              | Jakarta Bean Validation                            |
| Client REST inter-svc   | Spring `RestClient` (Spring 6.1+)                  |
| Migrations              | Flyway                                             |
| Documentation API       | springdoc-openapi (Swagger UI)                     |
| Tests                   | JUnit 5 + Mockito                                  |

### Front-end

| Composant         | Choix                                                          |
| ----------------- | -------------------------------------------------------------- |
| Framework         | **React 18**                                                   |
| Bundler           | **Vite**                                                       |
| Langage           | **TypeScript**                                                 |
| Styling           | **Tailwind CSS**                                               |
| Composants UI     | **shadcn/ui**                                                  |
| Routing           | React Router v6                                                |
| State serveur     | TanStack Query v5                                              |
| State client      | Zustand                                                        |
| HTTP client       | Axios (avec intercepteur JWT + refresh auto)                   |
| Forms             | React Hook Form + Zod                                          |
| Icônes            | lucide-react                                                   |

### Données & Infrastructure

| Composant      | Choix                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| SGBD           | **PostgreSQL 16** — 1 base par service, dans un conteneur unique       |
| API Gateway    | **Spring Cloud Gateway**                                               |
| Conteneurs     | **Docker** + **Docker Compose v2**                                     |
| Reverse proxy  | **Nginx** (sert le build React statique)                               |
| Outil d'admin  | **pgAdmin 4** (service Docker dev uniquement, port 8090)               |

---

## Prérequis

| Outil          | Version minimale | Notes                                |
| -------------- | ---------------- | ------------------------------------ |
| Java JDK       | **21**           | LTS, Temurin recommandé              |
| Maven          | **3.9+**         | Optionnel si on utilise `mvnw`        |
| Node.js        | **20+**          | Pour le développement frontend       |
| npm            | **10+**          | Fourni avec Node 20                  |
| Docker         | **24+**          | Docker Desktop sous Windows/macOS    |
| Docker Compose | **v2**           | Inclus dans Docker Desktop récent    |
| Git            | **2.40+**        | Avec `gh` (GitHub CLI) pour les PR   |

---

## Démarrage rapide

> ℹ️ **État actuel** : l'infrastructure Docker, les 4 microservices métier (`auth`, `catalog`, `rental`, `notification`) et la **gateway** Spring Cloud Gateway sont en place sous forme de squelettes fonctionnels. Le **frontend** React sera ajouté à l'étape suivante. Voir [`TASKS.md`](TASKS.md) pour le détail.

### 1. Cloner et préparer

```bash
git clone git@github.com:UgoDurand/Loxia.git
cd Loxia
git switch develop            # branche d'intégration
cp .env.example .env          # adapter les secrets si besoin
```

### 2. Démarrer la stack

```bash
docker compose up -d          # lance db + gateway + 4 services + pgAdmin
docker compose ps             # tous doivent passer (healthy) en <3 min
docker compose logs -f        # suivre les logs en direct (optionnel)
```

Au premier build, Docker doit télécharger les dépendances Maven des 5 services (4 microservices + gateway) : compter **5 à 10 minutes**. Les builds suivants sont beaucoup plus rapides grâce au cache Docker layer.

### 3. Vérifier que tout est up

```bash
# Gateway — seul point d'entrée exposé sur l'hôte (port 8080)
curl http://localhost:8080/actuator/health
# → {"status":"UP","groups":["liveness","readiness"]}

# Microservices — accessibles uniquement depuis le réseau Docker interne
docker compose exec auth-service         wget -qO- http://localhost:8081/actuator/health
docker compose exec catalog-service      wget -qO- http://localhost:8082/actuator/health
docker compose exec rental-service       wget -qO- http://localhost:8083/actuator/health
docker compose exec notification-service wget -qO- http://localhost:8084/actuator/health
# → chacun doit répondre {"status":"UP","groups":["liveness","readiness"]}
```

> 🔒 **Les microservices ne sont pas exposés sur l'hôte.** Toutes les requêtes extérieures transitent par la gateway (`http://localhost:8080`). Ne cherche pas à atteindre `http://localhost:8081` directement — c'est voulu.

### 4. pgAdmin (inspection des bases)

Seul service web exposé sur l'hôte actuellement.

- URL : **http://localhost:8090**
- Login : valeur de `PGADMIN_DEFAULT_EMAIL` dans ton `.env` (défaut `admin@loxia.dev`)
- Password : valeur de `PGADMIN_DEFAULT_PASSWORD` dans ton `.env` (défaut `admin`)
- Le serveur **Loxia DB** est pré-enregistré dans l'Object Explorer. Mot de passe Postgres au premier clic : valeur de `POSTGRES_PASSWORD` dans ton `.env` (défaut `changeme`)
- 4 bases visibles : `auth_db`, `catalog_db`, `rental_db`, `notification_db` — chacune contient déjà sa table `flyway_schema_history` créée automatiquement au démarrage du service correspondant

### 5. Arrêter

```bash
docker compose down           # stoppe les conteneurs, garde les volumes (données préservées)
docker compose down -v        # stoppe ET efface les volumes (DB wipée — à utiliser avec précaution)
```

### 6. Plus tard (une fois le frontend en place)

```bash
# Frontend : http://localhost:3000  (étape 7 — à venir)
# Gateway  : http://localhost:8080  ✅ déjà disponible
```

---

## Structure du dépôt

```
Loxia/
├── .github/workflows/        # CI (à venir)
├── services/                 # Microservices Java/Spring Boot
│   ├── pom.xml               # Parent POM Maven
│   ├── auth-service/
│   ├── catalog-service/
│   ├── rental-service/
│   └── notification-service/
├── gateway/                  # Spring Cloud Gateway
├── frontend/                 # React + Vite + TS + Tailwind
├── docs/
│   ├── architecture.md       # Documentation d'architecture
│   └── mockups/              # Maquettes de référence (16 captures)
├── scripts/                  # Scripts utilitaires (init DB, seed, ...)
├── .env.example              # Template de configuration locale
├── .gitignore
├── .dockerignore
├── docker-compose.yml        # Orchestration de la stack
├── TASKS.md                  # Suivi d'avancement (à jour)
└── README.md                 # Ce fichier
```

> Le fichier `CLAUDE.md` éventuellement présent à la racine d'une copie locale est **personnel** : il est listé dans `.gitignore` et ne doit jamais être committé.

---

## Stratégie de branches (GitFlow)

Loxia suit un **GitFlow simplifié** à deux branches longues + branches de feature éphémères :

| Branche                       | Rôle                                                          | Règles                                                                                            |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `main`                        | **Production** — toujours stable, déployable                  | **Branche par défaut du dépôt.** Pas de commit direct. Reçoit uniquement des merges depuis `develop` aux jalons (release). |
| `develop`                     | **Intégration** — état courant de l'équipe                    | Reçoit les merges des branches de feature après validation. Base des nouvelles branches `feat/*`.   |
| `feat/<scope>-<short-desc>`   | Développement d'une fonctionnalité                            | Branchée depuis `develop`. Mergée dans `develop` après tests OK. Supprimée après merge.            |
| `fix/<scope>-<short-desc>`    | Correction d'un bug                                           | Mêmes règles qu'une `feat/`.                                                                       |

**Convention de nommage des branches** :

- `feat/auth-jwt-refresh-flow`
- `feat/catalog-listing-search`
- `fix/rental-lock-race-condition`
- `chore/ci-add-maven-build`

**Convention de commit** : [Conventional Commits](https://www.conventionalcommits.org/) en anglais.

```
feat(catalog): add listing search filters
fix(auth): handle expired refresh token
chore(gateway): bump spring cloud version
refactor(rental): extract lock verification logic
docs(readme): update quick start instructions
```

---

## Workflow de contribution

1. **Synchroniser** `develop` :
   ```bash
   git switch develop
   git pull
   ```
2. **Créer une branche feature** depuis `develop` :
   ```bash
   git switch -c feat/catalog-listing-search
   ```
3. **Coder** par petits commits atomiques (`git commit -m "feat(catalog): ..."`).
4. **Tester localement** (build du service, lancement Docker Compose, vérification des endpoints).
5. **Pousser** la branche :
   ```bash
   git push -u origin feat/catalog-listing-search
   ```
6. **Ouvrir une Pull Request** vers `develop` (template de PR à venir).
7. **Faire valider** par un coéquipier (ou auto-validation si en solo sur la feature).
8. **Merger** dans `develop` (`--no-ff` recommandé pour garder la trace de la feature) puis supprimer la branche feature.
9. **Mettre à jour** [`TASKS.md`](TASKS.md) pour cocher l'item terminé et préciser ce qui reste à faire.
10. **Release** : à un jalon majeur, merge `develop` → `main` et tag (`v0.1.0`, `v0.2.0`, …).

---

## Suivi d'avancement

L'état d'avancement détaillé du projet (ce qui est fait, ce qui est en cours, ce qui reste à faire) est maintenu en continu dans **[`TASKS.md`](TASKS.md)**.

C'est le **premier fichier** à ouvrir en arrivant sur le dépôt en tant que contributeur : il indique précisément où en est l'équipe et par quoi commencer.

---

## Documentation détaillée

- **[`docs/architecture.md`](docs/architecture.md)** — vue d'ensemble de l'architecture, choix techniques, communication inter-services, sécurité, configuration, déploiement
- **[`docs/mockups/`](docs/mockups/)** — 16 captures d'écran de référence de la maquette validée

---

## Équipe

> _À compléter_

| Nom | Rôle | GitHub |
| --- | --- | --- |
|     |      |        |
|     |      |        |
|     |      |        |
|     |      |        |

---

## Licence

> _À définir._
