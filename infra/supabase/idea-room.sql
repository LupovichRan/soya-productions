-- Idea Room alpha: shared state for Supabase. Not applied yet.
-- Tables are private (RLS on, no policies, no grants); the app talks only to the security-definer
-- functions below, which validate everything. A "device" is a random id kept in the visitor's
-- browser. It is not proof of a unique person.
-- Remove everything: drop table public.ir_votes, public.ir_items, public.ir_seats, public.ir_signals, public.ir_ideas cascade;
-- then drop the ir_* functions.

create table public.ir_ideas (
  id uuid primary key default gen_random_uuid(),
  owner_device uuid not null,
  name text not null check (char_length(name) between 1 and 60),
  problem text not null check (char_length(problem) between 1 and 300),
  promise text not null check (char_length(promise) between 1 and 200),
  mascot text not null default 'fox' check (mascot in ('cat','fox','owl','bear','rabbit','frog')),
  question text not null default '' check (char_length(question) <= 100),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) <= 4),
  decision text not null default '' check (decision in ('','continue','change','stop')),
  created_at timestamptz not null default now()
);
create table public.ir_signals (
  idea_id uuid not null references public.ir_ideas(id) on delete cascade,
  device uuid not null,
  kind text not null check (kind in ('follow','want','share','pledge','call')),
  created_at timestamptz not null default now(),
  primary key (idea_id, device, kind)
);
create table public.ir_seats (
  idea_id uuid not null references public.ir_ideas(id) on delete cascade,
  device uuid not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, device)
);
create table public.ir_items (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ir_ideas(id) on delete cascade,
  device uuid not null,
  text text not null check (char_length(text) between 1 and 120),
  status text not null default 'proposed' check (status in ('proposed','accepted','claimed','done')),
  claimed_by uuid,
  created_at timestamptz not null default now()
);
create table public.ir_votes (
  idea_id uuid not null references public.ir_ideas(id) on delete cascade,
  device uuid not null,
  option_idx int not null check (option_idx between 0 and 3),
  weight int not null check (weight between 1 and 4),
  primary key (idea_id, device)
);
create index ir_items_idea on public.ir_items(idea_id);
create index ir_signals_created on public.ir_signals(created_at);

alter table public.ir_ideas enable row level security;
alter table public.ir_signals enable row level security;
alter table public.ir_seats enable row level security;
alter table public.ir_items enable row level security;
alter table public.ir_votes enable row level security;
revoke all on public.ir_ideas, public.ir_signals, public.ir_seats, public.ir_items, public.ir_votes from public, anon, authenticated;

create function public.ir_get(p_device uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(x order by x.created_at), '[]'::jsonb) from (
    select i.id, i.name, i.problem, i.promise, i.mascot, i.question, i.options, i.decision, i.created_at,
      (i.owner_device = p_device) as owner,
      (select coalesce(jsonb_object_agg(k.kind, k.n), '{}'::jsonb) from (select s.kind, count(*) n from public.ir_signals s where s.idea_id = i.id and s.device <> p_device group by s.kind) k) as others,
      (select coalesce(jsonb_agg(s.kind), '[]'::jsonb) from public.ir_signals s where s.idea_id = i.id and s.device = p_device) as mine,
      exists (select 1 from public.ir_seats t where t.idea_id = i.id and t.device = p_device) as seat,
      (select coalesce(jsonb_agg(jsonb_build_object('id', it.id, 'text', it.text, 'status', it.status,
         'by', case when it.device = p_device then 'you' else 'other' end,
         'claimedBy', case when it.claimed_by = p_device then 'you' else '' end) order by it.created_at), '[]'::jsonb)
         from public.ir_items it where it.idea_id = i.id) as items,
      (select coalesce(jsonb_agg(coalesce((select sum(v.weight) from public.ir_votes v where v.idea_id = i.id and v.option_idx = g and v.device <> p_device), 0) order by g), '[]'::jsonb)
         from generate_series(0, jsonb_array_length(i.options) - 1) g) as votes,
      coalesce((select v.option_idx from public.ir_votes v where v.idea_id = i.id and v.device = p_device), -1) as my_vote,
      coalesce((select v.weight from public.ir_votes v where v.idea_id = i.id and v.device = p_device), 0) as my_vote_weight
    from public.ir_ideas i order by i.created_at desc limit 100
  ) x;
$$;

create function public.ir_new_idea(p_device uuid, p_name text, p_problem text, p_promise text, p_mascot text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if p_device is null then raise exception 'device'; end if;
  if (select count(*) from public.ir_ideas where owner_device = p_device) >= 5 then raise exception 'too many ideas from this device'; end if;
  if (select count(*) from public.ir_ideas) >= 300 then raise exception 'the alpha is full'; end if;
  insert into public.ir_ideas(owner_device, name, problem, promise, mascot)
    values (p_device, btrim(p_name), btrim(p_problem), btrim(p_promise), coalesce(nullif(p_mascot, ''), 'fox')) returning id into v_id;
  return v_id;
end $$;

create function public.ir_toggle_signal(p_device uuid, p_idea uuid, p_kind text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_device is null or p_kind not in ('follow','want','share','pledge','call') then raise exception 'bad request'; end if;
  if not exists (select 1 from public.ir_ideas where id = p_idea) then raise exception 'no such idea'; end if;
  if exists (select 1 from public.ir_signals where idea_id = p_idea and device = p_device and kind = p_kind) then
    delete from public.ir_signals where idea_id = p_idea and device = p_device and kind = p_kind; return false;
  end if;
  insert into public.ir_signals(idea_id, device, kind) values (p_idea, p_device, p_kind); return true;
end $$;

create function public.ir_take_seat(p_device uuid, p_idea uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_device is null or not exists (select 1 from public.ir_ideas where id = p_idea) then raise exception 'bad request'; end if;
  insert into public.ir_seats(idea_id, device) values (p_idea, p_device) on conflict do nothing;
end $$;

-- Voice: none without a seat; one with a seat; one more per accepted job; at most four.
create function public.ir_vote(p_device uuid, p_idea uuid, p_idx int) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_w int; v_n int;
begin
  select jsonb_array_length(options) into v_n from public.ir_ideas where id = p_idea;
  if v_n is null or p_device is null or p_idx < 0 or p_idx >= v_n then raise exception 'bad request'; end if;
  if not exists (select 1 from public.ir_seats where idea_id = p_idea and device = p_device) then raise exception 'take a seat first'; end if;
  v_w := least(4, 1 + (select count(*) from public.ir_items where idea_id = p_idea and status = 'done' and claimed_by = p_device));
  insert into public.ir_votes(idea_id, device, option_idx, weight) values (p_idea, p_device, p_idx, v_w)
    on conflict (idea_id, device) do update set option_idx = excluded.option_idx, weight = excluded.weight;
  return v_w;
end $$;

create function public.ir_add_item(p_device uuid, p_idea uuid, p_text text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if p_device is null or not exists (select 1 from public.ir_ideas where id = p_idea) then raise exception 'bad request'; end if;
  if (select count(*) from public.ir_items where idea_id = p_idea) >= 20 then raise exception 'the roadmap is full'; end if;
  insert into public.ir_items(idea_id, device, text) values (p_idea, p_device, btrim(p_text)) returning id into v_id;
  return v_id;
end $$;

-- proposed -> accepted (owner) -> claimed (anyone but the owner) -> done (owner)
create function public.ir_move_item(p_device uuid, p_item uuid, p_action text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_status text;
begin
  select i.owner_device, it.status into v_owner, v_status from public.ir_items it join public.ir_ideas i on i.id = it.idea_id where it.id = p_item;
  if v_status is null or p_device is null then raise exception 'bad request'; end if;
  if p_action = 'accept' and v_status = 'proposed' and v_owner = p_device then update public.ir_items set status = 'accepted' where id = p_item;
  elsif p_action = 'claim' and v_status = 'accepted' and v_owner <> p_device then update public.ir_items set status = 'claimed', claimed_by = p_device where id = p_item;
  elsif p_action = 'done' and v_status = 'claimed' and v_owner = p_device then update public.ir_items set status = 'done' where id = p_item;
  else raise exception 'not allowed'; end if;
end $$;

create function public.ir_set_survey(p_device uuid, p_idea uuid, p_question text, p_options jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.ir_ideas where id = p_idea and owner_device = p_device) then raise exception 'only the owner'; end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 4 or char_length(btrim(p_question)) not between 1 and 100 then raise exception 'bad survey'; end if;
  if exists (select 1 from jsonb_array_elements(p_options) o where jsonb_typeof(o) <> 'string' or char_length(o #>> '{}') not between 1 and 40) then raise exception 'bad survey'; end if;
  update public.ir_ideas set question = btrim(p_question), options = p_options where id = p_idea;
  delete from public.ir_votes where idea_id = p_idea;
end $$;

-- The owner records a decision, but only once the two-week test has run its course.
create function public.ir_decide(p_device uuid, p_idea uuid, p_decision text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_decision not in ('continue','change','stop') then raise exception 'bad request'; end if;
  update public.ir_ideas set decision = p_decision where id = p_idea and owner_device = p_device and created_at <= now() - interval '13 days';
  if not found then raise exception 'not allowed yet'; end if;
end $$;

-- Totals for the live dashboard. No device ids leave the database.
create function public.ir_dashboard() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'generated_at', now(),
    'ideas', (select count(*) from public.ir_ideas),
    'devices', (select count(*) from (select owner_device d from public.ir_ideas union select device from public.ir_signals union select device from public.ir_seats union select device from public.ir_items union select device from public.ir_votes) u),
    'signals', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from public.ir_signals group by kind) s),
    'seats', (select count(*) from public.ir_seats),
    'votes', (select count(*) from public.ir_votes),
    'items', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.ir_items group by status) s),
    'board', (select coalesce(jsonb_agg(b order by b.score desc, b.created_at desc), '[]'::jsonb) from (
        select i.id, i.name, i.mascot, i.created_at,
          least(14, floor(extract(epoch from now() - i.created_at) / 86400)::int + 1) as day,
          (select coalesce(sum(case s.kind when 'follow' then 1 when 'want' then 2 when 'share' then 3 when 'pledge' then 4 when 'call' then 5 else 0 end), 0) from public.ir_signals s where s.idea_id = i.id) as score,
          (select count(*) from public.ir_seats t where t.idea_id = i.id) as seats,
          (select count(*) from public.ir_items it where it.idea_id = i.id and it.status = 'done') as done_items
        from public.ir_ideas i order by i.created_at desc limit 20) b),
    'recent', (select coalesce(jsonb_agg(e order by e.at desc), '[]'::jsonb) from (
        select * from (
          select 'idea' as what, i.name as idea, i.created_at as at from public.ir_ideas i
          union all select 'signal:' || s.kind, i.name, s.created_at from public.ir_signals s join public.ir_ideas i on i.id = s.idea_id
          union all select 'seat', i.name, t.created_at from public.ir_seats t join public.ir_ideas i on i.id = t.idea_id
          union all select 'suggestion', i.name, it.created_at from public.ir_items it join public.ir_ideas i on i.id = it.idea_id
        ) u order by at desc limit 15) e)
  );
$$;

revoke all on function public.ir_get(uuid), public.ir_new_idea(uuid,text,text,text,text), public.ir_toggle_signal(uuid,uuid,text), public.ir_take_seat(uuid,uuid),
  public.ir_vote(uuid,uuid,int), public.ir_add_item(uuid,uuid,text), public.ir_move_item(uuid,uuid,text), public.ir_set_survey(uuid,uuid,text,jsonb),
  public.ir_decide(uuid,uuid,text), public.ir_dashboard() from public;
grant execute on function public.ir_get(uuid), public.ir_new_idea(uuid,text,text,text,text), public.ir_toggle_signal(uuid,uuid,text), public.ir_take_seat(uuid,uuid),
  public.ir_vote(uuid,uuid,int), public.ir_add_item(uuid,uuid,text), public.ir_move_item(uuid,uuid,text), public.ir_set_survey(uuid,uuid,text,jsonb),
  public.ir_decide(uuid,uuid,text), public.ir_dashboard() to anon, authenticated;
