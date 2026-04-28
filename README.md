# PEA Suivi — POC Outil de suivi du pôle assistance commerciale

POC web app pour remplacer les tableaux Excel de suivi des opérations et bilans du pôle assistantes commerciales (cabinet PEA).

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**
- **Supabase** (Postgres + Auth + RLS, région Paris `eu-west-3`)
- **Vercel** (hosting, CI/CD via GitHub)

## Modules

- **Tableau de bord** — vue d'ensemble : opérations en cours, bilans à faire, compteurs
- **Opérations** — CRUD souscriptions, rachats, arbitrages, versements (filtres mois / conseiller / statut)
- **Bilans** — planning annuel des bilans clients (par mois)
- **Clients** — référentiel client (162 clients importés depuis l'Excel Sonia)

## Phase 2 (anticipée) — IA augmentée

Tables `rdv` et `documents` déjà en base, prêtes à recevoir :
- Transcriptions Noota
- Pré-remplissage automatique du recueil d'informations
- Génération de comptes rendus post-RDV

## Comptes démo

| Rôle | Email | Mot de passe |
|---|---|---|
| Responsable pôle (Sonia) | demo@monespacedata.fr | demo123 |
| Assistante administrative (Michèle) | demo2@monespacedata.fr | demo123 |
| Assistante commerciale (Camille) | demo3@monespacedata.fr | demo123 |
| Assistante commerciale (Myriam) | demo4@monespacedata.fr | demo123 |

## Développement local

```bash
npm install
cp .env.example .env.local  # remplir avec les clés Supabase
npm run dev
```

## Déploiement

Push sur `main` → déploiement automatique sur Vercel.
