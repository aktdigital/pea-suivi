-- Add code abbreviations to ref_operations for quick entry
alter table public.ref_operations add column if not exists code text;
update public.ref_operations set code = 'SOUSC' where label = 'SOUSCRIPTION';
update public.ref_operations set code = 'RP' where label = 'RACHAT PARTIEL';
update public.ref_operations set code = 'RT' where label = 'RACHAT TOTAL';
update public.ref_operations set code = 'RP-PROG' where label = 'RACHAT PARTIEL PROGRAMME';
update public.ref_operations set code = 'VC' where label = 'VERSEMENT COMPLEMENTAIRE';
update public.ref_operations set code = 'VP' where label = 'VERSEMENT PROGRAMME';
update public.ref_operations set code = 'ARB' where label = 'ARBITRAGE';
update public.ref_operations set code = 'PO' where label = 'PASSAGE D''ORDRE';
update public.ref_operations set code = 'AV' where label = 'AVANCE';
update public.ref_operations set code = 'RA' where label = 'REMBOURSEMENT AVANCE';
update public.ref_operations set code = 'MCB' where label = 'MODIFICATION CLAUSE BENEFICIAIRE';
update public.ref_operations set code = 'DMR' where label = 'DOSSIER DE MISE EN RELATION';
update public.ref_operations set code = 'AF' where label = 'APPEL DE FONDS / CONFORMITE';
create unique index if not exists idx_ref_operations_code on public.ref_operations (code) where code is not null;
