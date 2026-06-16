-- #8 Index sur foreign keys manquantes
create index if not exists idx_operations_created_by on public.operations (created_by);
create index if not exists idx_operations_assistante_id on public.operations (assistante_id);
create index if not exists idx_operations_controle_par on public.operations (controle_par_id);
create index if not exists idx_rdv_client on public.rdv (client_id);
create index if not exists idx_rdv_conseiller on public.rdv (conseiller_code);
create index if not exists idx_documents_client on public.documents (client_id);
create index if not exists idx_documents_created_by on public.documents (created_by);
create index if not exists idx_documents_rdv on public.documents (rdv_id);

-- #12 Suppression des index jamais utilisés
drop index if exists public.idx_produits_struct_mecanisme;
drop index if exists public.idx_produits_struct_mois_creation;

-- #11 search_path immuable sur les fonctions restantes (create_demo_user déjà supprimée)
alter function public.set_updated_at() set search_path = '';
alter function public.set_op_date_fin() set search_path = '';

-- #10 RLS perf : envelopper auth.uid() dans un SELECT (évite la ré-évaluation par ligne)
drop policy if exists "auth_update_own" on public.profiles;
create policy "auth_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id);
