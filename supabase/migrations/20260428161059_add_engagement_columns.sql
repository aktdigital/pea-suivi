-- Add new columns from NEW TABLEAU analyse
alter table public.produits_structures
  add column if not exists structureur text,
  add column if not exists total_new_cash numeric(14,2),
  add column if not exists total_encours numeric(14,2),
  add column if not exists ca_up_front numeric(14,2),
  add column if not exists mois_creation text;

create index if not exists idx_produits_struct_mois_creation on public.produits_structures (mois_creation);
create index if not exists idx_produits_struct_structureur on public.produits_structures (structureur);
