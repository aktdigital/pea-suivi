# Base de données — pea-suivi (Supabase)

Projet Supabase : `upgtplrxdnocjeykjeqj` · région `eu-west-3` (Paris) · Postgres 15.

## Versionnement du schéma

Le dossier [`migrations/`](./migrations) contient l'historique **DDL** complet du schéma
(tables, index, triggers, fonctions, policies RLS), exporté fidèlement depuis la base.
Chaque fichier `YYYYMMDDHHMMSS_<nom>.sql` correspond à une entrée de
`supabase_migrations.schema_migrations` côté distant — les rejouer dans l'ordre sur une
base vierge reconstruit la structure à l'identique.

```bash
# Rattacher le repo au projet distant
supabase link --project-ref upgtplrxdnocjeykjeqj

# Vérifier que repo et distant sont synchronisés
supabase migration list

# Appliquer les migrations manquantes sur un nouvel environnement
supabase db push
```

## ⚠️ Données clients exclues du dépôt (RGPD)

Les **données** (≈ 908 clients, opérations, produits) **ne sont volontairement PAS
versionnées** : elles contiennent des données personnelles (noms, rattachements
conseiller) relevant du RGPD et du secret professionnel CIF. Seules les migrations de
**structure** et les **référentiels** (listes de valeurs, sans PII) sont dans Git.

Les comptes utilisateurs (staff) sont gérés directement via le Dashboard / l'Auth
Supabase et ne figurent pas non plus dans les migrations.

## Sécurité — points à connaître

- **RLS** : actuellement permissive (`using(true)`) — toutes les équipes travaillent au
  même niveau d'accès (choix produit assumé pour le POC). Les comptes sont créés
  manuellement et distribués aux utilisateurs autorisés.
- **`create_demo_user`** : fonction `SECURITY DEFINER` supprimée
  (`20260616080512_drop_create_demo_user.sql`) — elle permettait la création de comptes
  via `/rpc` depuis l'extérieur.
- **#4 — Protection mots de passe compromis** : à activer **manuellement** dans
  `Dashboard > Authentication > Policies > Password security` →
  *"Check passwords against HaveIBeenPwned"*. Ce réglage Auth n'est pilotable ni par
  migration SQL ni par l'API de gestion ; il doit être coché dans l'interface.
