# Loxia — Script de démo

Parcours à suivre en présentation pour dérouler les fonctionnalités clés de l'application sans "chercher quoi cliquer". Prévoir **~5 minutes**.

## Prérequis

```bash
docker compose down -v            # repart d'un état propre
docker compose up -d --build      # démarre les 4 services + gateway + db + front
./scripts/seed.sh                 # crée les 2 comptes démo et leurs annonces
```

Vérifier que tous les conteneurs sont `healthy` : `docker compose ps`.

Front : <http://localhost:3000> · Gateway : <http://localhost:8080>

**Comptes démo** (mot de passe `password123`) :

| Compte | Rôle dans le scénario |
|---|---|
| `alice@loxia.dev` — Alice Martin | locataire qui postule, possède aussi un loft à Bordeaux |
| `bob@loxia.dev` — Bob Durand | propriétaire des 3 biens Lyon / Paris / Marseille |

## Parcours

### 1 · Découverte côté visiteur (non connecté) — 30 s
1. Ouvrir <http://localhost:3000>.
2. Pointer le toggle **Locataire / Propriétaire** dans le header (juste un filtre UI).
3. Faire une recherche : ville `Lyon` → la liste se rafraîchit.
4. Cliquer sur l'annonce **"Appartement T2 lumineux — Canut"** → page détail.
5. Cliquer sur **Postuler en ligne** → redirection vers `/login` (gate d'auth).

> _Point d'architecture : c'est la gateway qui bloque, pas le front. Montrer le filtre `JwtAuthenticationFilter` côté `gateway/`._

### 2 · Inscription / connexion — 30 s
1. Cliquer sur **S'inscrire** ou se connecter en tant que **alice@loxia.dev / password123**.
2. Redirection automatique vers `/`.
3. Pointer le nom "Alice Martin" dans le header → il vient du JWT propagé via `X-User-FullName`.

### 3 · Candidater à une annonce — 45 s
1. En étant Alice (mode Locataire), ouvrir la fiche du **T2 Canut** et cliquer **Postuler**.
2. Remplir : revenu `2800`, statut `CDI`, message libre.
3. Valider → toast vert **"Candidature envoyée."** + redirection vers `/my-applications`.
4. Montrer la candidature avec badge **"En attente"**.

> _Point d'architecture : `rental-service → catalog-service` pour enrichir le titre de l'annonce, `rental-service → notification-service` pour créer la notification destinée à Bob._

### 4 · Règle de verrouillage côté propriétaire — 60 s
1. Se déconnecter, se connecter en tant que **bob@loxia.dev**.
2. Basculer le toggle sur **Propriétaire**.
3. Ouvrir **Mes biens immobiliers** (`/my-listings`) → montrer le badge **"Non modifiable"** sur le T2 Canut.
4. Cliquer sur **Éditer** : le bouton est grisé (`locked=true`).
5. Expliquer : `catalog-service` a interrogé `rental-service` via `/internal/applications/listing/{id}/locked` avec un timeout de 3 s et un fail-safe.

### 5 · Notifications temps-réel — 30 s
1. Toujours en étant Bob, regarder la **cloche** dans le header → badge rouge avec le compteur d'unread.
2. Cliquer sur la cloche → dropdown avec la notification **"Nouvelle candidature"**.
3. Cliquer sur la ligne → redirection vers `/received-applications`, la notification devient lue.

> _Point d'architecture : le front poll `/api/notifications/unread-count` toutes les 30 s (TanStack Query `refetchInterval`)._

### 6 · Accepter la candidature — 30 s
1. Sur `/received-applications`, cliquer sur **Accepter**.
2. Toast vert **"Candidature acceptée."** → le badge passe à "Acceptée".
3. Se déconnecter, se reconnecter en tant qu'Alice → cloche avec un nouveau badge.
4. Cliquer → notification **"Candidature acceptée"** → redirection `/my-applications`, badge "Acceptée".

### 7 · Mise à jour du profil — 30 s
1. En étant Alice, cliquer sur **Mon Profil** (header).
2. Modifier le nom → **Enregistrer** → toast vert **"Profil mis à jour."**.
3. Rafraîchir la page → le nouveau nom est persisté (via `PUT /api/auth/me`).

### 8 · Deuxième annonce / empty states — 30 s
1. En Propriétaire, créer un nouveau compte vide (ou réutiliser Alice en Propriétaire sans annonce dans son compte principal).
2. Aller sur `/my-listings` → pointer l'**EmptyState** card pointillée indigo avec CTA **"Ajouter un bien"**.
3. Cliquer → page `/listings/new` → créer une annonce minimaliste → toast vert + redirection.

## Points à souligner pendant la démo

- **Découpage microservices strict** : 4 services métier + 1 gateway. Aucun accès direct à la BDD d'un autre service, aucune jointure cross-service.
- **Compte unifié** : un seul `ROLE_USER`, le toggle Locataire/Propriétaire est purement un filtre UI front.
- **JWT validé uniquement à la gateway**, les services downstream font confiance aux headers `X-User-*`.
- **Communication inter-services REST synchrone** via `Spring RestClient` (pas de message broker pour rester dans le scope pédagogique).
- **Règle de verrouillage** : catalog interroge rental avant tout UPDATE/DELETE. Fail-safe : si rental est down, le UPDATE est bloqué.
- **Front React + TanStack Query + Zustand + sonner** : fetch serveur géré par Query, state d'auth persisté par Zustand, feedback utilisateur via toasts.

## En cas de problème

| Symptôme | Cause probable | Correction |
|---|---|---|
| `./scripts/seed.sh` échoue avec "Unauthorized" sur le login | un compte de même email existe déjà avec un autre mot de passe | `docker compose down -v && docker compose up -d --build && ./scripts/seed.sh` |
| Cloche reste à zéro | pas de notification reçue | créer une candidature depuis un autre compte, attendre au plus 30 s |
| "Annonce verrouillée" inattendu | une candidature `PENDING`/`ACCEPTED` existe | la refuser depuis `/received-applications` |
| `docker compose ps` montre `unhealthy` | services pas encore up | attendre 20–30 s, reconsulter, voir `docker compose logs -f <service>` |
