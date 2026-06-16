drop index if exists idx_bilans_client_annee;
create unique index idx_bilans_client_annee_mois on public.bilans (client_id, annee, mois_planifie);
