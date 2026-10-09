-- Read-only checks under the actual API role. No OAuth grant or token fixtures.
begin;
set local role service_role;
do $$
begin
  if not has_column_privilege(current_user, 'auth.users', 'id', 'SELECT')
    or not has_column_privilege(current_user, 'auth.users', 'raw_app_meta_data', 'SELECT') then
    raise exception 'Missing trusted owner role lookup';
  end if;
  if has_column_privilege(current_user, 'auth.users', 'email', 'SELECT')
    or has_column_privilege(current_user, 'auth.users', 'encrypted_password', 'SELECT') then
    raise exception 'Auth lookup grants more columns than necessary';
  end if;
  if not exists(select 1 from auth.users where raw_app_meta_data->>'role'='admin') then
    raise exception 'Owner role lookup failed';
  end if;
end $$;
select 'PASS: service_role can check trusted admin metadata without reading email or password columns' as result;
rollback;
