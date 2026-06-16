-- Drop old simple ref_isin, replace with rich produits_structures table
drop table if exists public.ref_isin cascade;

create table public.produits_structures (
  isin text primary key,
  nom_produit text not null,
  sous_jacent text,
  mecanisme text,                  -- Phoenix, Autocall, etc.
  duree text,                      -- "12 ans", "10 ans"
  frequence_rappel text,           -- Quotidienne, Mensuelle, Trimestrielle, Annuelle
  protection_gain text,
  protection_capital text,
  degressivite text,
  objectif_rendement text,
  eligible_contrats text,          -- "CT", "AV", "CT, AV"
  upfront_brut numeric(6,4),
  date_fin_commercialisation date,
  enveloppe_reservee numeric(14,2),
  montant_fait numeric(14,2),
  restant_a_faire numeric(14,2),
  compagnies_cibles text,          -- multi-line text "SWISS LIFE / COPARTIS / ..."
  commentaire text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_produits_struct_actif on public.produits_structures (date_fin_commercialisation) where active = true;
create index idx_produits_struct_mecanisme on public.produits_structures (mecanisme);

create trigger trg_produits_struct_updated before update on public.produits_structures for each row execute procedure public.set_updated_at();

alter table public.produits_structures enable row level security;
create policy "auth_all" on public.produits_structures for all to authenticated using (true) with check (true);

-- Re-add reference between operations and produits_structures (FK)
alter table public.operations
  drop constraint if exists operations_isin_fkey;
-- (no FK to allow free-text ISIN if not in catalog yet)
