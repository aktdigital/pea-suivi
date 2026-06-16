-- NOTE (historique) : cette migration a créé les 4 comptes de démo et la fonction
-- helper public.create_demo_user. La fonction a depuis été SUPPRIMÉE pour des raisons
-- de sécurité (voir 20260616080000_drop_create_demo_user.sql) et les mots de passe ont
-- été tournés. Fichier conservé tel qu'appliqué, pour fidélité de l'historique.

-- Helper to create a demo user in auth.users + public.profiles
create or replace function public.create_demo_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_existing uuid;
begin
  select id into v_existing from auth.users where email = p_email;
  if v_existing is not null then
    -- update password just in case
    update auth.users
      set encrypted_password = crypt(p_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now()
      where id = v_existing;
    insert into public.profiles (id, email, full_name, role)
      values (v_existing, p_email, p_full_name, p_role)
      on conflict (id) do update
        set full_name = excluded.full_name, role = excluded.role;
    return v_existing;
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name),
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into public.profiles (id, email, full_name, role)
    values (v_user_id, p_email, p_full_name, p_role);

  return v_user_id;
end;
$$;

-- Create the 4 demo accounts
select public.create_demo_user('demo@monespacedata.fr',  'demon123', 'Sonia (Responsable pôle assistantes)',          'responsable');
select public.create_demo_user('demo2@monespacedata.fr', 'demon123', 'Michèle (Assistante administrative)',           'assistante_admin');
select public.create_demo_user('demo3@monespacedata.fr', 'demon123', 'Camille (Assistante commerciale)',              'assistante_commerciale');
select public.create_demo_user('demo4@monespacedata.fr', 'demon123', 'Myriam (Assistante commerciale)',               'assistante_commerciale');
