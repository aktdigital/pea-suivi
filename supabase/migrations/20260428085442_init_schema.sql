-- Extensions
create extension if not exists pgcrypto;

-- Profiles linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin','responsable','assistante_commerciale','assistante_admin','conseiller')),
  conseiller_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conseillers (PL, MB, JL, JK, BA)
create table public.conseillers (
  code text primary key,
  full_name text not null,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  type_personne text default 'physique' check (type_personne in ('physique','morale')),
  conseiller_code text references public.conseillers(code) on delete set null,
  email text,
  telephone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_clients_nom on public.clients (nom);
create index idx_clients_conseiller on public.clients (conseiller_code);

-- Reference tables
create table public.ref_operations (
  id serial primary key,
  label text unique not null,
  ordre int default 0,
  active boolean default true
);
create table public.ref_produits (
  id serial primary key,
  label text unique not null,
  ordre int default 0,
  active boolean default true
);
create table public.ref_statuts (
  id serial primary key,
  label text unique not null,
  ordre int default 0,
  is_final boolean default false,
  active boolean default true
);
create table public.ref_compagnies (
  id serial primary key,
  label text unique not null,
  ordre int default 0,
  active boolean default true
);
create table public.ref_isin (
  isin text primary key,
  nom_produit text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Operations (suivi mensuel)
create table public.operations (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  client_id uuid references public.clients(id) on delete restrict,
  type_operation text,
  produit text,
  compagnie text,
  contrat text,
  montant numeric(14,2),
  collecte_type text check (collecte_type in ('new_cash','encours')),
  conseiller_code text references public.conseillers(code) on delete set null,
  statut text,
  support_type text check (support_type in ('papier','ligne')),
  isin text,
  validation boolean default false,
  commentaire text,
  assistante_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_operations_date on public.operations (date desc);
create index idx_operations_client on public.operations (client_id);
create index idx_operations_conseiller on public.operations (conseiller_code);
create index idx_operations_statut on public.operations (statut);

-- Bilans (planning annuel)
create table public.bilans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete restrict,
  annee int not null,
  mois_planifie int check (mois_planifie between 1 and 12),
  date_realise date,
  statut text default 'a_faire' check (statut in ('a_faire','planifie','realise','valide','refuse')),
  validation boolean default false,
  commentaire text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index idx_bilans_client_annee on public.bilans (client_id, annee);

-- Phase 2 IA prep tables (créées maintenant pour anticiper, vides pour le POC)
create table public.rdv (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  conseiller_code text references public.conseillers(code) on delete set null,
  date_rdv timestamptz not null,
  type_rdv text,
  duree_min int,
  noota_link text,
  notes text,
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  rdv_id uuid references public.rdv(id) on delete set null,
  type text not null check (type in ('transcription','recueil_info','compte_rendu','adequation','autre')),
  titre text not null,
  contenu text,
  storage_path text,
  ai_generated boolean default false,
  ai_model text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger trg_clients_updated before update on public.clients for each row execute procedure public.set_updated_at();
create trigger trg_operations_updated before update on public.operations for each row execute procedure public.set_updated_at();
create trigger trg_bilans_updated before update on public.bilans for each row execute procedure public.set_updated_at();
create trigger trg_documents_updated before update on public.documents for each row execute procedure public.set_updated_at();

-- RLS: enable + permissive policies for any authenticated user (POC scope)
alter table public.profiles enable row level security;
alter table public.conseillers enable row level security;
alter table public.clients enable row level security;
alter table public.ref_operations enable row level security;
alter table public.ref_produits enable row level security;
alter table public.ref_statuts enable row level security;
alter table public.ref_compagnies enable row level security;
alter table public.ref_isin enable row level security;
alter table public.operations enable row level security;
alter table public.bilans enable row level security;
alter table public.rdv enable row level security;
alter table public.documents enable row level security;

create policy "auth_read_all" on public.profiles for select to authenticated using (true);
create policy "auth_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "auth_all" on public.conseillers for all to authenticated using (true) with check (true);
create policy "auth_all" on public.clients for all to authenticated using (true) with check (true);
create policy "auth_all" on public.ref_operations for all to authenticated using (true) with check (true);
create policy "auth_all" on public.ref_produits for all to authenticated using (true) with check (true);
create policy "auth_all" on public.ref_statuts for all to authenticated using (true) with check (true);
create policy "auth_all" on public.ref_compagnies for all to authenticated using (true) with check (true);
create policy "auth_all" on public.ref_isin for all to authenticated using (true) with check (true);
create policy "auth_all" on public.operations for all to authenticated using (true) with check (true);
create policy "auth_all" on public.bilans for all to authenticated using (true) with check (true);
create policy "auth_all" on public.rdv for all to authenticated using (true) with check (true);
create policy "auth_all" on public.documents for all to authenticated using (true) with check (true);
