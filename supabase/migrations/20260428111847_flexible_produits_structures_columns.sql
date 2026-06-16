-- Make numeric "soft" fields text-flexible (source data mixes %, text, numbers)
alter table public.produits_structures alter column upfront_brut type text using upfront_brut::text;
