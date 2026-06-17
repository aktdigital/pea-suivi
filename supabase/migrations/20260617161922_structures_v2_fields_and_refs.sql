-- Point 5 A : nouveaux champs (Tableau structuré V2)
alter table public.produits_structures add column if not exists date_constatation_initiale date;
alter table public.operations add column if not exists date_facturation date;

-- Point 5 C : référentiels
insert into public.ref_compagnies (label, ordre) values ('Intencial', 165) on conflict (label) do nothing;
insert into public.ref_produits (label, ordre) values ('FID/FAS (Lux)', 145) on conflict (label) do nothing;

-- table des structureurs (n'existait pas)
create table if not exists public.ref_structureurs (
  id serial primary key,
  label text unique not null,
  ordre int default 0,
  active boolean default true
);
alter table public.ref_structureurs enable row level security;
drop policy if exists "auth_all" on public.ref_structureurs;
create policy "auth_all" on public.ref_structureurs for all to authenticated using (true) with check (true);

insert into public.ref_structureurs (label, ordre) values
  ('Adequity', 10), ('Altitude IS', 20), ('CMF', 30), ('Compagnie en direct', 40),
  ('Equitim', 50), ('Feefty', 60), ('I-Kapital', 70), ('Irbis', 80),
  ('Nexo', 90), ('Summit', 100), ('Zenith', 110)
on conflict (label) do nothing;
