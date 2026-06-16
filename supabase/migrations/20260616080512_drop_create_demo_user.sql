-- #2 Sécurité : supprimer la fonction SECURITY DEFINER create_demo_user
-- (appelable via /rpc — création de comptes depuis l'extérieur). Déjà exécuté en
-- inline lors de l'audit ; rejoué ici en migration versionnée (idempotent) pour
-- que l'historique des migrations reflète l'état réel de la base.
drop function if exists public.create_demo_user(text, text, text, text);
