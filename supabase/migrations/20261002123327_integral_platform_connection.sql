-- Plataforma Integral shares infrastructure, never changes campo_* or mobile auth.
create table public.integral_members (
 user_id uuid primary key references auth.users(id),
 display_name text not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.integral_members enable row level security;
revoke all on public.integral_members from public,anon,authenticated;
grant select on public.integral_members to authenticated;
create policy integral_member_self on public.integral_members for select to authenticated
 using (user_id=(select auth.uid()));
-- Only the existing active field administrator initially receives platform access.
insert into public.integral_members(user_id,display_name)
 select user_id,display_name from public.campo_members where active and role='admin';

create table public.integral_state (
 key text primary key check (length(key) between 1 and 180 and key ~ '^(state:|file:)'),
 payload jsonb,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid not null default auth.uid() references auth.users(id)
);
alter table public.integral_state enable row level security;
revoke all on public.integral_state from public,anon,authenticated;
grant select,insert,update on public.integral_state to authenticated;
create policy integral_state_read on public.integral_state for select to authenticated
 using (exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active));
create policy integral_state_insert on public.integral_state for insert to authenticated
 with check (exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active));
create policy integral_state_update on public.integral_state for update to authenticated
 using (exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active))
 with check (exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active));

create function public.integral_stamp() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.revision:=case when TG_OP='INSERT' then 1 else old.revision+1 end;
 new.updated_at:=now(); new.updated_by:=auth.uid(); return new;
end $$;
revoke all on function public.integral_stamp() from public,anon;
create trigger integral_state_stamp before insert or update on public.integral_state
 for each row execute function public.integral_stamp();

create function public.integral_save_batch(changes jsonb) returns jsonb
 language plpgsql security invoker set search_path='' as $$
declare item jsonb; found_revision bigint; result jsonb:='[]'::jsonb; saved public.integral_state;
begin
 if auth.uid() is null or not exists(select 1 from public.integral_members where user_id=auth.uid() and active)
 then raise exception 'Acceso a Plataforma Integral no autorizado' using errcode='42501'; end if;
 if jsonb_typeof(changes)<>'array' or jsonb_array_length(changes)>100 then raise exception 'Lote inválido'; end if;
 perform pg_advisory_xact_lock(682041,1);
 for item in select value from jsonb_array_elements(changes) loop
   select revision into found_revision from public.integral_state where key=item->>'key';
   if coalesce(found_revision,0)<>coalesce((item->>'revision')::bigint,0)
   then raise exception 'CONFLICT: Otro dispositivo actualizó %. Conserva tus cambios y vuelve a abrir el espacio.',item->>'key' using errcode='40001'; end if;
   insert into public.integral_state(key,payload) values(item->>'key',item->'payload')
    on conflict(key) do update set payload=excluded.payload returning * into saved;
   result:=result||jsonb_build_array(jsonb_build_object('key',saved.key,'revision',saved.revision));
 end loop;
 return result;
end $$;
revoke all on function public.integral_save_batch(jsonb) from public,anon;
grant execute on function public.integral_save_batch(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit)
 values('integral-files','integral-files',false,52428800);
create policy integral_files_read on storage.objects for select to authenticated
 using(bucket_id='integral-files' and exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active));
create policy integral_files_insert on storage.objects for insert to authenticated
 with check(bucket_id='integral-files' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active));
-- Immutable uploads; remove only unreferenced uploads owned by the caller.
create policy integral_files_cleanup on storage.objects for delete to authenticated
 using(bucket_id='integral-files' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.integral_members where user_id=(select auth.uid()) and active)
 and not exists(select 1 from public.integral_state where payload->>'path'=name));
