-- Operations : add date_debut / date_fin for stats
alter table public.operations
  add column if not exists date_debut date,
  add column if not exists date_fin date;

-- Backfill date_debut from created_at for existing rows
update public.operations
set date_debut = created_at::date
where date_debut is null;

-- Backfill date_fin for ops already at "Signé, envoyé à la compagnie" or later
update public.operations
set date_fin = updated_at::date
where date_fin is null
  and (statut ilike '%signé%envoyé%compagnie%'
       or statut ilike '%validé%avenant%récupéré%'
       or statut = 'Validé, avenant récupéré');

-- Trigger: auto-set date_fin when statut becomes "Signé, envoyé à la compagnie"
create or replace function public.set_op_date_fin()
returns trigger language plpgsql as $$
begin
  -- Set date_debut on insert if not provided
  if TG_OP = 'INSERT' and NEW.date_debut is null then
    NEW.date_debut := COALESCE(NEW.date, current_date);
  end if;
  -- Set date_fin when statut crosses threshold
  if NEW.statut is not null and NEW.date_fin is null then
    if NEW.statut ilike '%signé%envoyé%compagnie%'
       or NEW.statut ilike '%validé%avenant%récupéré%' then
      NEW.date_fin := current_date;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_op_dates on public.operations;
create trigger trg_op_dates
  before insert or update of statut on public.operations
  for each row execute function public.set_op_date_fin();

-- Produits structures : add facturation columns
alter table public.produits_structures
  add column if not exists date_facturation date,
  add column if not exists statut_facturation text
    check (statut_facturation in ('E', 'F', 'D') or statut_facturation is null);
