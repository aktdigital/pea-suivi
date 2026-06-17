-- Point 2 : nouveaux statuts d'opération (Tableau structuré V2)
-- 1) ref_statuts : renommer les libellés modifiés
update public.ref_statuts set label = 'Opération envoyée au client'  where label = 'Envoyé client, attente retour signé';
update public.ref_statuts set label = 'Signé, transmis à la compagnie' where label = 'Signé, envoyé à la compagnie';

-- supprimer les statuts obsolètes (0 opération concernée, vérifié)
delete from public.ref_statuts where label in ('Rédigé et non envoyé au client', 'A faire');

-- ajouter le nouveau statut final
insert into public.ref_statuts (label, ordre, is_final) values ('Racheté par anticipation', 60, true)
  on conflict (label) do update set ordre = excluded.ordre, is_final = excluded.is_final;

-- normaliser ordre + is_final
update public.ref_statuts set ordre = 10, is_final = false where label = 'A saisir';
update public.ref_statuts set ordre = 20, is_final = false where label = 'Adéquation envoyée au client';
update public.ref_statuts set ordre = 30, is_final = false where label = 'Opération envoyée au client';
update public.ref_statuts set ordre = 40, is_final = false where label = 'Signé, transmis à la compagnie';
update public.ref_statuts set ordre = 50, is_final = true  where label = 'Validé, avenant récupéré';

-- 2) migrer les opérations existantes vers les nouveaux libellés
update public.operations set statut = 'Opération envoyée au client'   where statut = 'Envoyé client, attente retour signé';
update public.operations set statut = 'Signé, transmis à la compagnie' where statut = 'Signé, envoyé à la compagnie';

-- 3) trigger date_fin : adapter aux nouveaux libellés (+ racheté = terminal)
create or replace function public.set_op_date_fin()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' and NEW.date_debut is null then
    NEW.date_debut := COALESCE(NEW.date, current_date);
  end if;
  if NEW.statut is not null and NEW.date_fin is null then
    if NEW.statut ilike '%signé%transmis%compagnie%'
       or NEW.statut ilike '%signé%envoyé%compagnie%'
       or NEW.statut ilike '%validé%avenant%récupéré%'
       or NEW.statut ilike '%racheté%anticipation%' then
      NEW.date_fin := current_date;
    end if;
  end if;
  return NEW;
end;
$$;
