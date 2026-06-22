-- Permettre des valeurs de contrôle différentes par liste.
-- champ NULL = valeur commune aux 3 listes ; sinon scopée à un champ précis.
alter table public.ref_statuts_controle add column if not exists champ text;
alter table public.ref_statuts_controle drop constraint if exists ref_statuts_controle_champ_check;
alter table public.ref_statuts_controle add constraint ref_statuts_controle_champ_check
  check (champ is null or champ in ('courrier_pea','lettre_mission','conformite'));
