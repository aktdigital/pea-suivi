-- Add Michèle's quality control columns to operations
alter table public.operations
  add column if not exists courrier_pea text default 'a_faire',
  add column if not exists lettre_mission text default 'a_faire',
  add column if not exists conformite text default 'a_faire',
  add column if not exists controle_par_id uuid references public.profiles(id) on delete set null,
  add column if not exists controle_at timestamptz;

-- Status reference for these quality controls
create table if not exists public.ref_statuts_controle (
  id serial primary key,
  code text unique not null,
  label text not null,
  color text default 'gray',
  ordre int default 0
);
alter table public.ref_statuts_controle enable row level security;
drop policy if exists "auth_all" on public.ref_statuts_controle;
create policy "auth_all" on public.ref_statuts_controle for all to authenticated using (true) with check (true);

insert into public.ref_statuts_controle (code, label, color, ordre) values
  ('a_faire', 'À faire', 'red', 10),
  ('so', 'Sans objet', 'gray', 20),
  ('en_attente_avenants', 'En attente des avenants', 'orange', 30),
  ('en_cours_compagnie', 'En cours de traitement à la compagnie', 'blue', 40),
  ('valide', 'Validé', 'green', 50),
  ('ok', 'OK', 'green', 60)
on conflict (code) do nothing;
