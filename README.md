# GST – Gestion de boutique Fk Pack Event's

## 1. Objectif du projet

Application interne pour gérer une boutique de **packaging / cérémonies** (Fk Pack Event's) :

- Gestion des **produits** (noms, prix, images).
- Gestion du **stock** (mouvements, ajustements manuels, impact des ventes).
- Saisie des **ventes** avec mise à jour automatique du stock.
- Suivi des **finances** (entrées / sorties, tableau de bord).
- Gestion des **utilisateurs** avec rôles (Gérant, Admin, Staff).

Backend en **NestJS + MongoDB**, frontend en **Next.js (App Router)**.

---

## 2. Architecture générale

### 2.1. Backend (dossier `backend/`)

- **Framework** : NestJS
- **Base de données** : MongoDB (Atlas) via Mongoose
- **Auth** : JWT
- **Upload d’images** : Multer + dossier `uploads/`
- **Rôles** : `manager`, `admin`, `staff`

Modules principaux :

- `src/products`  
  - CRUD produits  
  - Upload d’image produit (`/products/upload`)  
  - Suppression réservée au **Gérant**

- `src/stock`  
  - Suivi des mouvements de stock (achats, ventes, ajustements manuels)

- `src/sales`  
  - Création d’une vente avec liste d’articles  
  - Mise à jour automatique du stock  
  - Suppression d’une vente (restaure le stock) – réservée au **Gérant**

- `src/finance`  
  - Mouvements financiers manuels (entrées / dépenses)  
  - Dashboard agrégé (ventes + autres entrées + dépenses + résultat net)  
  - Réinitialisation complète des données financières + ventes – réservée au **Gérant**

- `src/users`  
  - Création d’admins par le **Gérant** uniquement  
  - Liste des utilisateurs (lecture seule) pour le Gérant

- `src/auth`  
  - Login (`/auth/login`)  
  - JWT avec rôle inclus dans le payload  
  - `RolesGuard` pour appliquer les permissions

Configuration importante :

- `src/app.module.ts`  
  - Connexion MongoDB via `process.env.MONGODB_URI`.

- `src/main.ts`  
  - CORS activé pour le frontend  
  - Exposition statique du dossier `uploads` sous `/uploads`.

### 2.2. Frontend (dossier `frontend/`)

- **Framework** : Next.js 13+ (App Router)  
- **Style** : Tailwind-like (classes utilitaires), défini dans `src/app/globals.css`
- **Auth côté client** : 
  - `localStorage.token` pour le JWT
  - `localStorage.user` (id, username, role)
  - `useAuthGuard()` sur chaque page protégée pour rediriger vers `/login`

Pages principales :

- `src/app/login/page.tsx`  
  Page de connexion, stocke `token` + `user` dans `localStorage`.

- `src/app/dashboard/page.tsx`  
  Tableau de bord général, avec :
  - Navigation vers Produits, Stock, Ventes, Finances, Admins (selon rôle).  
  - Cartes descriptives pour chaque module.  
  - (À partir de maintenant) un **résumé financier mensuel** via l’API `/finance/dashboard` avec filtre de dates.

- `src/app/products/page.tsx`  
  - Liste des produits avec image, prix.  
  - Création / édition de produit avec **upload de fichier image**.  
  - Suppression visible uniquement pour le **Gérant**.

- `src/app/stock/page.tsx`  
  - Affichage des produits sous forme de **cartes avec images**.  
  - Ajustement du stock par produit (ajout / retrait manuel).  
  - Bouton retour au tableau de bord.

- `src/app/sales/page.tsx`  
  - Sélection d’un produit avec **aperçu image + prix**.  
  - Ajout d’articles à une vente (quantité, prix unitaire).  
  - Récapitulatif de la vente avec **minis images**, quantités en badges, montants colorés.  
  - Enregistrement de la vente → mise à jour auto du stock.  
  - Historique des ventes avec suppression (réservée au Gérant).  
  - **Filtres de période** côté frontend pour l’historique (aujourd’hui, cette semaine, ce mois, etc.).

- `src/app/finance/page.tsx`  
  - Ajout de mouvements financiers (type, montant, catégorie, description).  
  - Tableau de bord en haut (revenus ventes, autres entrées, dépenses, résultat net).  
  - Historique des mouvements avec édition / suppression.  
  - Bouton « Réinitialiser les données » visible seulement pour le Gérant.  
  - **Badges colorés** pour les catégories, montants colorés selon le type (vert = entrée, rose = dépense).  
  - **Filtres de période** (aujourd’hui, hier, cette semaine, ce mois, mois dernier, 3 derniers mois, année, tout) appliqués à la fois :
    - au dashboard (via l’API `/finance/dashboard?from=...&to=...`)
    - et à la liste des mouvements (filtre côté frontend).

- `src/app/admin-users/page.tsx`  
  - Pour le Gérant uniquement.  
  - Création de comptes Admin.  
  - Liste des utilisateurs existants (username + rôle).

---

## 3. Rôles et permissions

### 3.1. Rôles disponibles

- `manager` (Gérant)  
  - Pleins droits, y compris :
    - Supprimer des ventes, produits, mouvements financiers.
    - Réinitialiser la finance (ventes + entrées/sorties).
    - Créer de nouveaux Admins.  
  - Accès à la page admin-users.

- `admin`  
  - Peut gérer produits, stock, ventes, finances (création / édition).  
  - Ne peut plus effectuer les actions destructrices sensibles réservées au Gérant (suppression globale, reset finance, création d’admins).

- `staff`  
  - Rôle par défaut côté backend (peut être limité).  
  - Accès restreint en fonction des guards et du frontend (à adapter selon besoins).

### 3.2. Application des rôles

- Backend : via `@Roles(UserRole.Manager)` et `@UseGuards(JwtAuthGuard, RolesGuard)` dans les contrôleurs (`products`, `sales`, `finance`, `users`).
- Frontend : 
  - Le rôle est stocké dans `localStorage.user.role`.  
  - Les boutons sensibles (supprimer, reset, admin-users) sont masqués pour les non-Gérants.

---

## 4. Filtres de période (Ventes + Finances)

### 4.1. Concept commun

Les deux pages Ventes et Finances utilisent la même idée :

- Un type `PeriodKey` avec les valeurs :
  - `today`, `yesterday`, `this_week`, `this_month`, `last_month`, `last_3_months`, `this_year`, `all`.
- Une liste d’options affichée sous forme de **boutons arrondis** (chips) en haut des sections historiques.

### 4.2. Ventes (`sales/page.tsx`)

- `salesPeriod: PeriodKey` dans le state.  
- Helpers :
  - `getSalesPeriodRange(period)` → renvoie `{ from?: Date; to?: Date }`.  
  - `filterSalesByPeriod(sales, period)` → filtre les ventes côté frontend par `createdAt`.
- `filteredSales` = résultat du filtre, utilisé dans l’**historique des ventes**.  
- Les boutons de période apparaissent au-dessus du tableau d’historique.

### 4.3. Finances (`finance/page.tsx`)

- `period: PeriodKey` dans le state.  
- Helpers :
  - `getFinancePeriodRange(period)` → renvoie `{ from?: string; to?: string }` (ISO string) pour l’API backend.  
  - `isEntryInPeriod(entry, period)` → filtre les mouvements côté frontend.
- `fetchData(period)` :
  - Appelle `/finance/dashboard?from=...&to=...` pour calculer le résumé sur cette période.  
  - Charge toujours la liste complète des mouvements (`/finance/entries`) puis applique `filteredEntries = entries.filter(isEntryInPeriod)` côté frontend.
- Les boutons de période sont affichés sous le header Finances, et la période appliquée impacte à la fois :
  - le **résumé** (chiffres en haut)  
  - et la **liste** (historique des mouvements).

---

## 5. Dashboard – Résumé financier mensuel

Sur `src/app/dashboard/page.tsx` :

- Le composant :
  - Vérifie l’authentification via `localStorage.token`.  
  - Charge `user` depuis `localStorage.user` (id, username, rôle).

- Ajouts récents :
  - Un nouvel état `financeSummary` (type `DashboardSummary`) avec :
    - `salesRevenue`, `otherIncome`, `expenses`, `netResult`  
    - ainsi que `from`, `to` pour la période.
  - Un effet secondaire (`useEffect`) qui, pour les rôles `admin` et `manager`,
    - calcule les bornes du **mois courant**  
    - appelle `/finance/dashboard?from=...&to=...`  
    - stocke le résultat dans `financeSummary`.
  - Une section « Résumé financier du mois » s’affiche sous les 4 cartes principales avec 4 petits panneaux :
    - Revenus ventes  
    - Autres entrées  
    - Dépenses  
    - Résultat net

- Icônes légères :
  - Sur les cartes Produits, Stock, Ventes, Finances, un petit rond avec une lettre (P/S/V/F) sert d’icône très légère, sans dépendance externe.

---

## 6. UX / UI – Principes appliqués

- **Lisibilité** :
  - Arrière-plan général en gris très clair (`bg-slate-100`).  
  - Cartes alignées, fond blanc, coins arrondis, légère ombre.  
  - Textes principaux en `text-slate-900`, descriptions en `text-slate-500/600`.

- **Anti-fatigue visuelle** :
  - Badges pour les quantités, catégories, filtres de période.  
  - Montants colorés :
    - Vert (`emerald`) pour les revenus / montants positifs.  
    - Rouge/rose (`rose`) pour les dépenses / montants négatifs.  
  - Totaux importants dans des encarts colorés doux (fond vert clair, texte contrasté).

- **Responsive / mobile** :
  - Grilles `md:grid-cols-...` pour empiler les sections sur mobile et les disposer en colonnes sur desktop.  
  - Tableaux dans des conteneurs `overflow-x-auto` pour éviter les débordements horizontaux sur petit écran.  
  - Boutons suffisamment grands (`px-3 py-2`) et textes en `text-sm`.

---

## 7. État actuel du projet

### Backend

- Auth JWT opérationnelle (login) avec rôles inclus dans le token.  
- Modèles et services pour produits, stock, ventes, finances, utilisateurs.  
- Rôle `manager` ajouté et intégré dans les guards.  
- Suppressions et reset finance réservés au Gérant.  
- Endpoint de liste des utilisateurs pour le Gérant.  
- Suppression d’une vente restaure correctement le stock et impacte le dashboard finance.

### Frontend

- Login, dashboard, produits, stock, ventes, finances, admin-users opérationnels.  
- Upload d’images fonctionnel coté produits, images visibles dans stock et ventes.  
- UI ventes améliorée (aperçu produit + recap avec images et couleurs).  
- UI finances améliorée (badges catégories + couleurs montants).  
- Filtres de période fonctionnels sur ventes et finances (frontend + backend pour le dashboard finance).  
- Résumé financier mensuel en cours / prévu sur le dashboard (à vérifier selon la dernière implémentation).  
- Gestion des rôles respectée dans l’UI (boutons visibles ou non selon le rôle).

---

## 8. Comment continuer le développement

Suggestions futures :

- **Rapports avancés** :
  - Export CSV/Excel des ventes et des mouvements financiers par période.
- **Catégories structurées** :
  - Table de catégories de produits et de catégories financières (au lieu de simples chaînes).  
  - Couleurs associées par catégorie.
- **Amélioration Staff** :
  - Rôle `staff` plus restreint, par ex. saisie de ventes uniquement, pas d’accès aux finances.
- **Notifications / Alertes** :
  - Alerte de stock bas par produit.  
  - Indication des produits les plus vendus.

---

## 9. Notes pour une future IA / développeur

- Lire ce `README.md` + :
  - `backend/src/app.module.ts` pour comprendre la connexion MongoDB et les modules importés.  
  - `backend/src/auth/roles.guard.ts` et `backend/src/users/schemas/user.schema.ts` pour la logique de rôles.  
  - `backend/src/finance/finance.service.ts` pour le calcul du dashboard.  
  - `frontend/src/app/dashboard/page.tsx` pour voir comment les pages sont protégées et comment le résumé financier mensuel est alimenté.  
  - `frontend/src/app/sales/page.tsx` et `frontend/src/app/finance/page.tsx` pour les filtres de période et l’UI récente.

- L’état fonctionnel principal est déjà en place ; les évolutions prochaines seront surtout :
  - rafinements UX,  
  - rapports / exports,  
  - éventuellement multi-boutiques ou multi-utilisateurs avancé.
