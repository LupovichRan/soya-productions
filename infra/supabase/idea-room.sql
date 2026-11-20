-- Idea Room alpha: shared state. This is what is applied in the Supabase project "after-demo-day" (20 Nov 2026).
-- Tables are private: row security on, no policies, no grants. The app only calls the functions below, which
-- check everything. A "device" is a random id kept in the visitor's browser; it is not proof of a unique person.
-- Remove it all:  drop table public.ir_trust, public.ir_votes, public.ir_items, public.ir_seats, public.ir_signals, public.ir_ideas cascade;
-- then drop the ir_* functions. Nothing here touches the other tables in that project.

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
  status text not null default 'proposed' constraint ir_items_status_check check (status in ('proposed','accepted','claimed','declined','done')),
  reply text not null default '' check (char_length(reply) <= 120),
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
create table public.ir_trust (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ir_ideas(id) on delete cascade,
  item_id uuid not null references public.ir_items(id) on delete cascade,
  to_device uuid not null,
  points int not null check (points between 1 and 5),
  why text not null default '' check (char_length(why) <= 80),
  created_at timestamptz not null default now()
);
create index ir_items_idea on public.ir_items(idea_id);
create index ir_signals_created on public.ir_signals(created_at);
create index ir_trust_idea on public.ir_trust(idea_id, to_device);

alter table public.ir_ideas enable row level security;
alter table public.ir_signals enable row level security;
alter table public.ir_seats enable row level security;
alter table public.ir_items enable row level security;
alter table public.ir_votes enable row level security;
alter table public.ir_trust enable row level security;
revoke all on public.ir_ideas, public.ir_signals, public.ir_seats, public.ir_items, public.ir_votes, public.ir_trust from public, anon, authenticated;

-- Everything one device may see: ideas, counts from other devices, and its own state.
create or replace function public.ir_get(p_device uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(x order by x.created_at), '[]'::jsonb) from (
    select i.id, i.name, i.problem, i.promise, i.mascot, i.question, i.options, i.decision, i.created_at,
      (i.owner_device = p_device) as owner,
      (select coalesce(jsonb_object_agg(k.kind, k.n), '{}'::jsonb) from (select s.kind, count(*) n from public.ir_signals s where s.idea_id = i.id and s.device <> p_device group by s.kind) k) as others,
      (select coalesce(jsonb_agg(s.kind), '[]'::jsonb) from public.ir_signals s where s.idea_id = i.id and s.device = p_device) as mine,
      exists (select 1 from public.ir_seats t where t.idea_id = i.id and t.device = p_device) as seat,
      (select coalesce(jsonb_agg(jsonb_build_object('id', it.id, 'text', it.text, 'status', it.status, 'reply', it.reply,
         'given', (select coalesce(sum(g.points), 0) from public.ir_trust g where g.item_id = it.id),
         'by', case when it.device = p_device then 'you' else 'other' end,
         'claimedBy', case when it.claimed_by = p_device then 'you' else '' end) order by it.created_at), '[]'::jsonb)
         from public.ir_items it where it.idea_id = i.id) as items,
      (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'itemId', g.item_id, 'points', g.points, 'why', g.why) order by g.created_at), '[]'::jsonb)
         from public.ir_trust g where g.idea_id = i.id and g.to_device = p_device) as trust,
      (select coalesce(jsonb_agg(coalesce((select sum(v.weight) from public.ir_votes v where v.idea_id = i.id and v.option_idx = n and v.device <> p_device), 0) order by n), '[]'::jsonb)
         from generate_series(0, jsonb_array_length(i.options) - 1) n) as votes,
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

-- Voice: one with a seat, plus one for every three trust points the owner gave you, at most four.
create function public.ir_vote(p_device uuid, p_idea uuid, p_idx int) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_w int; v_n int;
begin
  select jsonb_array_length(options) into v_n from public.ir_ideas where id = p_idea;
  if v_n is null or p_device is null or p_idx < 0 or p_idx >= v_n then raise exception 'bad request'; end if;
  if not exists (select 1 from public.ir_seats where idea_id = p_idea and device = p_device) then raise exception 'take a seat first'; end if;
  v_w := least(4, 1 + (select coalesce(sum(points), 0) from public.ir_trust where idea_id = p_idea and to_device = p_device)::int / 3);
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

-- proposed -> accepted or declined with a reason (owner); accepted -> claimed (anyone but the owner); claimed -> done (owner)
create function public.ir_move_item(p_device uuid, p_item uuid, p_action text, p_reply text default '') returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_status text;
begin
  select i.owner_device, it.status into v_owner, v_status from public.ir_items it join public.ir_ideas i on i.id = it.idea_id where it.id = p_item;
  if v_status is null or p_device is null then raise exception 'bad request'; end if;
  if p_action = 'accept' and v_status = 'proposed' and v_owner = p_device then update public.ir_items set status = 'accepted' where id = p_item;
  elsif p_action = 'decline' and v_status = 'proposed' and v_owner = p_device then update public.ir_items set status = 'declined', reply = left(btrim(coalesce(p_reply, '')), 120) where id = p_item;
  elsif p_action = 'claim' and v_status = 'accepted' and v_owner <> p_device then update public.ir_items set status = 'claimed', claimed_by = p_device where id = p_item;
  elsif p_action = 'done' and v_status = 'claimed' and v_owner = p_device then update public.ir_items set status = 'done' where id = p_item;
  else raise exception 'not allowed'; end if;
end $$;

-- Only the owner gives trust, 1 to 5 points, for an accepted suggestion or accepted work, at most 5 per item, never to themselves.
create function public.ir_award_trust(p_device uuid, p_item uuid, p_points int, p_why text default '') returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_idea uuid; v_owner uuid; v_status text; v_by uuid; v_claimed uuid; v_to uuid; v_have int;
begin
  select it.idea_id, i.owner_device, it.status, it.device, it.claimed_by into v_idea, v_owner, v_status, v_by, v_claimed
    from public.ir_items it join public.ir_ideas i on i.id = it.idea_id where it.id = p_item;
  if v_idea is null or p_device is null or v_owner <> p_device or p_points is null or p_points not between 1 and 5 then raise exception 'not allowed'; end if;
  if v_status = 'done' and v_claimed is not null then v_to := v_claimed;
  elsif v_status in ('accepted','claimed','done') then v_to := v_by;
  else raise exception 'not accepted yet'; end if;
  if v_to = v_owner then raise exception 'not allowed'; end if;
  select coalesce(sum(points), 0) into v_have from public.ir_trust where item_id = p_item;
  if v_have + p_points > 5 then raise exception 'most trust points for this one'; end if;
  insert into public.ir_trust(idea_id, item_id, to_device, points, why) values (v_idea, p_item, v_to, p_points, left(btrim(coalesce(p_why, '')), 80));
end $$;

-- Set once by the owner; it cannot be swapped after people have voted.
create function public.ir_set_survey(p_device uuid, p_idea uuid, p_question text, p_options jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.ir_ideas where id = p_idea and owner_device = p_device and question = '') then raise exception 'only the owner, and only once'; end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 4 or char_length(btrim(p_question)) not between 1 and 100 then raise exception 'bad survey'; end if;
  if exists (select 1 from jsonb_array_elements(p_options) o where jsonb_typeof(o) <> 'string' or char_length(o #>> '{}') not between 1 and 40) then raise exception 'bad survey'; end if;
  update public.ir_ideas set question = btrim(p_question), options = p_options where id = p_idea;
end $$;

-- The owner decides only once the two-week test has run its course.
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
    'answered', (select count(*) from public.ir_items where status <> 'proposed'),
    'trust_points', (select coalesce(sum(points), 0) from public.ir_trust),
    'board', (select coalesce(jsonb_agg(b order by b.score desc, b.created_at desc), '[]'::jsonb) from (
        select i.id, i.name, i.mascot, i.created_at,
          least(14, floor(extract(epoch from now() - i.created_at) / 86400)::int + 1) as day,
          (select coalesce(sum(case s.kind when 'follow' then 1 when 'want' then 2 when 'share' then 3 when 'pledge' then 4 when 'call' then 5 else 0 end), 0) from public.ir_signals s where s.idea_id = i.id) as score,
          (select count(*) from public.ir_seats t where t.idea_id = i.id) as seats,
          (select count(*) from public.ir_items it where it.idea_id = i.id and it.status <> 'proposed') as answered,
          (select count(*) from public.ir_items it where it.idea_id = i.id) as suggestions
        from public.ir_ideas i order by i.created_at desc limit 20) b),
    'recent', (select coalesce(jsonb_agg(e order by e.at desc), '[]'::jsonb) from (
        select * from (
          select 'idea' as what, i.name as idea, i.created_at as at from public.ir_ideas i
          union all select 'signal:' || s.kind, i.name, s.created_at from public.ir_signals s join public.ir_ideas i on i.id = s.idea_id
          union all select 'seat', i.name, t.created_at from public.ir_seats t join public.ir_ideas i on i.id = t.idea_id
          union all select 'suggestion', i.name, it.created_at from public.ir_items it join public.ir_ideas i on i.id = it.idea_id
          union all select 'trust', i.name, g.created_at from public.ir_trust g join public.ir_ideas i on i.id = g.idea_id
        ) u order by at desc limit 15) e)
  );
$$;

revoke all on function public.ir_get(uuid), public.ir_new_idea(uuid,text,text,text,text), public.ir_toggle_signal(uuid,uuid,text), public.ir_take_seat(uuid,uuid),
  public.ir_vote(uuid,uuid,int), public.ir_add_item(uuid,uuid,text), public.ir_move_item(uuid,uuid,text,text), public.ir_award_trust(uuid,uuid,int,text),
  public.ir_set_survey(uuid,uuid,text,jsonb), public.ir_decide(uuid,uuid,text), public.ir_dashboard() from public;
grant execute on function public.ir_get(uuid), public.ir_new_idea(uuid,text,text,text,text), public.ir_toggle_signal(uuid,uuid,text), public.ir_take_seat(uuid,uuid),
  public.ir_vote(uuid,uuid,int), public.ir_add_item(uuid,uuid,text), public.ir_move_item(uuid,uuid,text,text), public.ir_award_trust(uuid,uuid,int,text),
  public.ir_set_survey(uuid,uuid,text,jsonb), public.ir_decide(uuid,uuid,text), public.ir_dashboard() to anon, authenticated;
