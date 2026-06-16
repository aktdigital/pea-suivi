-- Add civilite + assistante_profile_id to clients
alter table public.clients
  add column if not exists civilite text,
  add column if not exists assistante_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_clients_assistante on public.clients (assistante_profile_id);
