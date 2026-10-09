-- Additive agent infrastructure. Existing CMS rows and storage objects are untouched.
create table public.agent_credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  scopes text[] not null,
  token_hash text unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  expected_posts integer check (expected_posts between 1 and 50),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  run_at timestamptz not null default now(),
  credential_id uuid references public.agent_credentials(id) on delete set null,
  lease_hash text,
  lease_until timestamptz,
  attempts integer not null default 0,
  progress jsonb not null default '{}',
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agent_jobs_queue on public.agent_jobs(status,run_at);
create index agent_jobs_credential on public.agent_jobs(credential_id);
create index agent_credentials_owner on public.agent_credentials(owner_id);
create table public.agent_audit (
  id bigint generated always as identity primary key,
  actor text not null,
  operation text not null,
  entity_id text,
  job_id uuid references public.agent_jobs(id) on delete set null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index agent_audit_job on public.agent_audit(job_id);
create index agent_audit_created on public.agent_audit(created_at desc);
create table public.agent_idempotency (
  actor text not null,
  operation text not null,
  key text not null,
  request_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor,operation,key)
);
create table public.agent_media (
  path text primary key,
  url text not null,
  alt text not null,
  provenance text not null,
  source_url text,
  actor text not null,
  idempotency_key text not null,
  request_hash text not null,
  unique(actor,idempotency_key),
  created_at timestamptz not null default now()
);
create table public.agent_oauth_clients (
  id text primary key,
  name text not null,
  redirect_uris text[] not null,
  created_at timestamptz not null default now()
);
create table public.agent_oauth_requests (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.agent_oauth_clients(id) on delete cascade,
  params jsonb not null,
  csrf_hash text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);
create index agent_oauth_requests_client on public.agent_oauth_requests(client_id);
create table public.agent_oauth_codes (
  hash text primary key,
  client_id text not null references public.agent_oauth_clients(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  scopes text[] not null,
  redirect_uri text not null,
  challenge text not null,
  resource text not null,
  expires_at timestamptz not null default (now() + interval '5 minutes')
);
create index agent_oauth_codes_owner on public.agent_oauth_codes(owner_id);
create index agent_oauth_codes_client on public.agent_oauth_codes(client_id);
create table public.agent_oauth_tokens (
  access_hash text primary key,
  refresh_hash text unique not null,
  credential_id uuid not null references public.agent_credentials(id) on delete cascade,
  client_id text not null references public.agent_oauth_clients(id) on delete cascade,
  resource text not null,
  access_expires_at timestamptz not null default (now() + interval '1 hour'),
  refresh_expires_at timestamptz not null default (now() + interval '30 days')
);
create index agent_oauth_tokens_credential on public.agent_oauth_tokens(credential_id);
create index agent_oauth_tokens_client on public.agent_oauth_tokens(client_id);

-- All new data is server-only. No browser role can read keys, jobs, inbox reports or OAuth grants.
do $$ declare t text; begin
  foreach t in array array['agent_credentials','agent_jobs','agent_audit','agent_idempotency','agent_media','agent_oauth_clients','agent_oauth_requests','agent_oauth_codes','agent_oauth_tokens'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

create function public.makezaa_media_reserve(p_actor text,p_key text,p_hash text,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare m public.agent_media;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_actor||':media:'||p_key,0));
  select * into m from public.agent_media where actor=p_actor and idempotency_key=p_key;
  if found then
    if m.request_hash<>p_hash then raise exception 'idempotency_key_conflict'; end if;
    return to_jsonb(m);
  end if;
  insert into public.agent_media(path,url,alt,provenance,source_url,actor,idempotency_key,request_hash)
    values(p_data->>'path',p_data->>'url',p_data->>'alt',p_data->>'provenance',p_data->>'source_url',p_actor,p_key,p_hash) returning * into m;
  return to_jsonb(m);
end $$;

create function public.makezaa_oauth_register(p_id text,p_name text,p_redirects text[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('makezaa_oauth_register',0));
  if (select count(*) from public.agent_oauth_clients where created_at>now()-interval '1 hour')>=100 then raise exception 'registration_rate_limit'; end if;
  insert into public.agent_oauth_clients(id,name,redirect_uris) values(p_id,p_name,p_redirects);
end $$;
create function public.makezaa_oauth_request(p_client text,p_params jsonb,p_csrf text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('makezaa_oauth_request',0));
  if (select count(*) from public.agent_oauth_requests where expires_at>now())>=200 then raise exception 'authorization_rate_limit'; end if;
  delete from public.agent_oauth_requests where expires_at<=now();
  delete from public.agent_oauth_codes where expires_at<=now();
  insert into public.agent_oauth_requests(client_id,params,csrf_hash) values(p_client,p_params,p_csrf) returning id into request_id;
  return request_id;
end $$;
create function public.makezaa_oauth_consent(p_request uuid,p_csrf text,p_owner uuid,p_code text,p_scopes text[],p_allow boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare r public.agent_oauth_requests;
begin
  select * into r from public.agent_oauth_requests where id=p_request for update;
  if not found or r.csrf_hash is distinct from p_csrf or r.expires_at<=now() then raise exception 'invalid_consent'; end if;
  if not exists(select 1 from auth.users where id=p_owner and raw_app_meta_data->>'role'='admin') then raise exception 'invalid_consent'; end if;
  delete from public.agent_oauth_requests where id=p_request;
  if p_allow then
    insert into public.agent_oauth_codes(hash,client_id,owner_id,scopes,redirect_uri,challenge,resource)
      values(p_code,r.client_id,p_owner,p_scopes,r.params->>'redirect_uri',r.params->>'code_challenge',r.params->>'resource');
  end if;
  insert into public.agent_audit(actor,operation,entity_id,detail) values(p_owner::text,'oauth_consent',r.client_id,jsonb_build_object('allowed',p_allow,'scopes',p_scopes));
end $$;

-- Authorization codes are consumed and refresh tokens rotated under a database lock.
create function public.makezaa_oauth_exchange(p_kind text,p_hash text,p_client text,p_redirect text,p_challenge text,p_resource text,p_access text,p_refresh text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.agent_oauth_codes; t public.agent_oauth_tokens; k public.agent_credentials; client_name text;
begin
  if p_kind = 'authorization_code' then
    select * into c from public.agent_oauth_codes where hash=p_hash for update;
    if not found or c.expires_at<=now() or c.client_id<>p_client or c.redirect_uri<>p_redirect or c.challenge<>p_challenge or c.resource<>p_resource then
      raise exception 'invalid_grant';
    end if;
    if not exists(select 1 from auth.users where id=c.owner_id and raw_app_meta_data->>'role'='admin') then raise exception 'invalid_grant'; end if;
    delete from public.agent_oauth_codes where hash=p_hash;
    select name into client_name from public.agent_oauth_clients where id=p_client;
    insert into public.agent_credentials(owner_id,name,scopes,expires_at) values(c.owner_id,client_name,c.scopes,now()+interval '30 days') returning * into k;
  elsif p_kind = 'refresh_token' then
    select * into t from public.agent_oauth_tokens where refresh_hash=p_hash for update;
    if not found or t.refresh_expires_at<=now() or t.client_id<>p_client or t.resource<>p_resource then raise exception 'invalid_grant'; end if;
    select * into k from public.agent_credentials where id=t.credential_id for update;
    if k.revoked_at is not null or k.expires_at<=now() or not exists(select 1 from auth.users where id=k.owner_id and raw_app_meta_data->>'role'='admin') then raise exception 'invalid_grant'; end if;
    delete from public.agent_oauth_tokens where access_hash=t.access_hash;
  else raise exception 'unsupported_grant_type'; end if;
  insert into public.agent_oauth_tokens(access_hash,refresh_hash,credential_id,client_id,resource,refresh_expires_at)
    values(p_access,p_refresh,k.id,p_client,p_resource,k.expires_at);
  return jsonb_build_object('scope',array_to_string(k.scopes,' '));
end $$;

-- One writer owns a job lease. Stale workers cannot update or finish a reclaimed task.
create function public.makezaa_job_transition(p_id uuid,p_actor uuid,p_action text,p_lease text,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare j public.agent_jobs; n integer;
begin
  select * into j from public.agent_jobs where id=p_id for update;
  if not found then raise exception 'job_not_found'; end if;
  if p_action='claim' then
    if j.run_at>now() or not (j.status='queued' or (j.status='running' and j.lease_until<now())) then raise exception 'job_not_available'; end if;
    update public.agent_jobs set status='running',credential_id=p_actor,lease_hash=p_lease,lease_until=now()+interval '10 minutes',attempts=attempts+1,updated_at=now() where id=p_id returning * into j;
  elsif p_action='cancel' then
    if j.status not in ('queued','running') then raise exception 'job_already_finished'; end if;
    update public.agent_jobs set status='cancelled',lease_hash=null,lease_until=null,updated_at=now() where id=p_id returning * into j;
  else
    if j.status<>'running' or j.credential_id is distinct from p_actor or p_lease is null or j.lease_hash is distinct from p_lease or j.lease_until is null or j.lease_until<=now() then raise exception 'invalid_job_lease'; end if;
    if p_action='progress' then
      update public.agent_jobs set progress=p_data,lease_until=now()+interval '10 minutes',updated_at=now() where id=p_id returning * into j;
    elsif p_action in ('completed','failed') then
      if p_action='completed' and j.expected_posts is not null then
        select count(distinct p.id) into n from public.posts p join public.agent_audit a on a.entity_id=p.id::text
          where a.job_id=p_id and a.operation='post_save' and a.detail->>'created'='true' and p.published=true;
        if n<j.expected_posts then raise exception 'published_post_count_incomplete'; end if;
      end if;
      update public.agent_jobs set status=p_action,report=p_data,lease_hash=null,lease_until=null,updated_at=now() where id=p_id returning * into j;
    else raise exception 'invalid_job_action'; end if;
  end if;
  insert into public.agent_audit(actor,operation,entity_id,job_id) values(p_actor::text,'job_'||p_action,p_id::text,p_id);
  return to_jsonb(j)-'lease_hash';
end $$;

-- Content change, receipt, and audit entry commit together; retries reuse the receipt.
create function public.makezaa_agent_mutate(p_actor text,p_operation text,p_key text,p_hash text,p_id uuid,p_data jsonb,p_job uuid,p_lease text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.agent_idempotency; j public.agent_jobs; result jsonb; doc jsonb; entity text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_actor||':'||p_operation||':'||p_key,0));
  select * into r from public.agent_idempotency where actor=p_actor and operation=p_operation and key=p_key;
  if found then
    if r.request_hash<>p_hash then raise exception 'idempotency_key_conflict'; end if;
    return r.result;
  end if;
  if p_job is not null then
    select * into j from public.agent_jobs where id=p_job for update;
    if not found or j.status<>'running' or j.credential_id::text is distinct from p_actor or p_lease is null or j.lease_hash is distinct from p_lease or j.lease_until is null or j.lease_until<=now() then raise exception 'invalid_job_lease'; end if;
  end if;
  if p_operation='post_save' then
    if p_id is null then
      insert into public.posts(title,slug,excerpt,content,cover_image,tags,published)
        select x.title,x.slug,x.excerpt,x.content,x.cover_image,x.tags,coalesce(x.published,false) from jsonb_populate_record(null::public.posts,p_data) x returning to_jsonb(posts.*) into result;
    else
      select to_jsonb(p) into doc from public.posts p where id=p_id for update;
      if doc is null then raise exception 'content_not_found'; end if;
      if ((doc->>'published')::boolean or p_data ? 'published') and not exists(select 1 from public.agent_credentials where id::text=p_actor and 'posts:publish'=any(scopes)) then raise exception 'publish_permission_required'; end if;
      update public.posts p set (title,slug,excerpt,content,cover_image,tags,published)=(select x.title,x.slug,x.excerpt,x.content,x.cover_image,x.tags,x.published from jsonb_populate_record(null::public.posts,doc||p_data) x) where id=p_id returning to_jsonb(p.*) into result;
    end if;
  elsif p_operation='project_save' then
    if p_id is null then
      insert into public.projects(title,slug,description,content,cover_image,tech_stack,live_url,github_url,featured,published)
        select x.title,x.slug,x.description,x.content,x.cover_image,x.tech_stack,x.live_url,x.github_url,coalesce(x.featured,false),coalesce(x.published,false) from jsonb_populate_record(null::public.projects,p_data) x returning to_jsonb(projects.*) into result;
    else
      select to_jsonb(p) into doc from public.projects p where id=p_id for update;
      if doc is null then raise exception 'content_not_found'; end if;
      if ((doc->>'published')::boolean or p_data ? 'published') and not exists(select 1 from public.agent_credentials where id::text=p_actor and 'projects:publish'=any(scopes)) then raise exception 'publish_permission_required'; end if;
      update public.projects p set (title,slug,description,content,cover_image,tech_stack,live_url,github_url,featured,published)=(select x.title,x.slug,x.description,x.content,x.cover_image,x.tech_stack,x.live_url,x.github_url,x.featured,x.published from jsonb_populate_record(null::public.projects,doc||p_data) x) where id=p_id returning to_jsonb(p.*) into result;
    end if;
  elsif p_operation='post_publish' then
    update public.posts set published=(p_data->>'published')::boolean where id=p_id returning to_jsonb(posts.*) into result;
  elsif p_operation='project_publish' then
    update public.projects set published=(p_data->>'published')::boolean where id=p_id returning to_jsonb(projects.*) into result;
  elsif p_operation='post_delete' then
    delete from public.posts where id=p_id returning jsonb_build_object('id',id,'deleted',true) into result;
  elsif p_operation='project_delete' then
    delete from public.projects where id=p_id returning jsonb_build_object('id',id,'deleted',true) into result;
  elsif p_operation='inbox_delete' then
    delete from public.contact_submissions where id=p_id returning jsonb_build_object('id',id,'deleted',true) into result;
  elsif p_operation='job_create' then
    insert into public.agent_jobs(prompt,expected_posts,run_at) values(p_data->>'prompt',(p_data->>'expected_posts')::integer,coalesce((p_data->>'run_at')::timestamptz,now())) returning to_jsonb(agent_jobs.*)-'lease_hash' into result;
  else raise exception 'invalid_operation'; end if;
  if result is null then raise exception 'content_not_found'; end if;
  entity=result->>'id';
  insert into public.agent_audit(actor,operation,entity_id,job_id,detail) values(p_actor,p_operation,entity,p_job,coalesce(p_data->'_provenance','{}')||jsonb_build_object('created',p_id is null,'published',result->'published','slug',result->'slug'));
  insert into public.agent_idempotency(actor,operation,key,request_hash,result) values(p_actor,p_operation,p_key,p_hash,result);
  return result;
end $$;

revoke all on function public.makezaa_oauth_exchange(text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.makezaa_job_transition(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.makezaa_agent_mutate(text,text,text,text,uuid,jsonb,uuid,text) from public,anon,authenticated;
revoke all on function public.makezaa_oauth_register(text,text,text[]) from public,anon,authenticated;
revoke all on function public.makezaa_oauth_request(text,jsonb,text) from public,anon,authenticated;
revoke all on function public.makezaa_oauth_consent(uuid,text,uuid,text,text[],boolean) from public,anon,authenticated;
grant execute on function public.makezaa_oauth_exchange(text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.makezaa_job_transition(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.makezaa_agent_mutate(text,text,text,text,uuid,jsonb,uuid,text) to service_role;
grant execute on function public.makezaa_oauth_register(text,text,text[]) to service_role;
grant execute on function public.makezaa_oauth_request(text,jsonb,text) to service_role;
grant execute on function public.makezaa_oauth_consent(uuid,text,uuid,text,text[],boolean) to service_role;
revoke all on function public.makezaa_media_reserve(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.makezaa_media_reserve(text,text,text,jsonb) to service_role;
