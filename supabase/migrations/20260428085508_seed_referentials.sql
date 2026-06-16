-- Conseillers
insert into public.conseillers (code, full_name) values
  ('PL','Pierre L.'),
  ('MB','Michel B.'),
  ('JL','Jean L.'),
  ('JK','Jonathan K.'),
  ('BA','B. A.')
on conflict (code) do nothing;

-- Operations types
insert into public.ref_operations (label, ordre) values
  ('SOUSCRIPTION', 10),
  ('RACHAT PARTIEL', 20),
  ('RACHAT TOTAL', 30),
  ('RACHAT PARTIEL PROGRAMME', 40),
  ('VERSEMENT COMPLEMENTAIRE', 50),
  ('VERSEMENT PROGRAMME', 60),
  ('ARBITRAGE', 70),
  ('PASSAGE D''ORDRE', 80),
  ('AVANCE', 90),
  ('REMBOURSEMENT AVANCE', 100),
  ('MODIFICATION CLAUSE BENEFICIAIRE', 110),
  ('DOSSIER DE MISE EN RELATION', 120),
  ('APPEL DE FONDS / CONFORMITE', 130)
on conflict (label) do nothing;

-- Produits
insert into public.ref_produits (label, ordre) values
  ('AV', 10),
  ('CT', 20),
  ('SCPI', 30),
  ('PER', 40),
  ('PRIVATE EQUITY', 50),
  ('IMMOBILIER', 60),
  ('FID/FAS', 70),
  ('SOFICA', 80),
  ('GIRARDIN', 90),
  ('PEE', 100),
  ('CROWDFUNDING', 110),
  ('CAPI', 120),
  ('AV Lux', 130),
  ('Capi Lux', 140)
on conflict (label) do nothing;

-- Statuts
insert into public.ref_statuts (label, ordre, is_final) values
  ('A saisir', 10, false),
  ('Adéquation envoyée au client', 20, false),
  ('Envoyé client, attente retour signé', 30, false),
  ('Signé, envoyé à la compagnie', 40, false),
  ('Validé, avenant récupéré', 50, true),
  ('Rédigé et non envoyé au client', 25, false),
  ('A faire', 5, false)
on conflict (label) do nothing;

-- Compagnies
insert into public.ref_compagnies (label, ordre) values
  ('AXA', 10),
  ('Cardif', 20),
  ('Generali', 30),
  ('Generali via Nortia', 40),
  ('Primonial', 50),
  ('SwissLife', 60),
  ('SwissLife via Nortia', 70),
  ('Copartis', 80),
  ('Gresham', 90),
  ('La Mondiale Euro Partner', 100),
  ('CNP', 110),
  ('ODDO', 120),
  ('La Financière de l''Echiquier', 130),
  ('Nortia AEP', 140),
  ('Wealins', 150),
  ('Spirica', 160)
on conflict (label) do nothing;
