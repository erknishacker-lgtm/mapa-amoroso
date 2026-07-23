-- ============================================================
-- Mapa do Padrão Amoroso — Analytics
-- Cole este SQL no Supabase: SQL Editor → New query → Run
-- ============================================================

-- Eventos do funil
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null,
  question_id text,
  option_ids int[] default '{}',
  option_labels text[] default '{}',
  step_index int,
  pattern_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_type_idx
  on public.analytics_events (event_type);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_question_idx
  on public.analytics_events (question_id);

-- Senha do painel (troque depois)
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

insert into public.app_settings (key, value)
values ('admin_password', 'mapa2026')
on conflict (key) do nothing;

-- RLS: anônimo só INSERE eventos; ninguém lê a tabela direto
alter table public.analytics_events enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "anon_insert_events" on public.analytics_events;
create policy "anon_insert_events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

-- sem policy de SELECT em analytics_events / app_settings para anon

-- ------------------------------------------------------------
-- RPC: painel admin (SECURITY DEFINER — valida senha no servidor)
-- ------------------------------------------------------------
create or replace function public.admin_analytics(
  p_password text,
  p_from timestamptz default (now() - interval '30 days'),
  p_to timestamptz default now()
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text;
  v_from timestamptz := coalesce(p_from, now() - interval '30 days');
  v_to timestamptz := coalesce(p_to, now());
  v_result json;
begin
  select value into v_expected
  from public.app_settings
  where key = 'admin_password';

  if v_expected is null or p_password is distinct from v_expected then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  with base as (
    select *
    from public.analytics_events
    where created_at >= v_from
      and created_at <= v_to
  ),
  sessions as (
    select distinct session_id from base
  ),
  funnel as (
    select
      (select count(distinct session_id) from base where event_type = 'landing') as landing,
      (select count(distinct session_id) from base where event_type = 'start') as start,
      (select count(distinct session_id) from base where event_type = 'profile') as profile,
      (select count(distinct session_id) from base where event_type = 'question_view') as any_question,
      (select count(distinct session_id) from base where event_type = 'result') as result,
      (select count(distinct session_id) from base where event_type = 'checkout') as checkout
  ),
  by_day as (
    select
      to_char(date_trunc('day', created_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as day,
      count(*) filter (where event_type = 'landing') as landing,
      count(distinct session_id) filter (where event_type = 'start') as starts,
      count(distinct session_id) filter (where event_type = 'result') as results,
      count(distinct session_id) filter (where event_type = 'checkout') as checkouts
    from base
    group by 1
    order by 1
  ),
  by_hour as (
    select
      extract(hour from created_at at time zone 'America/Sao_Paulo')::int as hour,
      count(distinct session_id) filter (where event_type = 'landing') as landing,
      count(distinct session_id) filter (where event_type = 'start') as starts,
      count(distinct session_id) filter (where event_type = 'result') as results,
      count(distinct session_id) filter (where event_type = 'checkout') as checkouts
    from base
    group by 1
    order by 1
  ),
  q_views as (
    select
      coalesce(question_id, 'unknown') as question_id,
      min(step_index) as step_index,
      count(distinct session_id) as views
    from base
    where event_type = 'question_view'
    group by 1
  ),
  q_next as (
    select
      coalesce(question_id, 'unknown') as question_id,
      count(distinct session_id) as nexts
    from base
    where event_type = 'question_next'
    group by 1
  ),
  questions as (
    select
      v.question_id,
      coalesce(v.step_index, 0) as step_index,
      v.views,
      coalesce(n.nexts, 0) as nexts,
      case
        when v.views > 0 then round((coalesce(n.nexts, 0)::numeric / v.views::numeric) * 100, 1)
        else 0
      end as pass_rate,
      case
        when v.views > 0 then round(((v.views - coalesce(n.nexts, 0))::numeric / v.views::numeric) * 100, 1)
        else 0
      end as drop_rate
    from q_views v
    left join q_next n on n.question_id = v.question_id
    order by coalesce(v.step_index, 0), v.question_id
  ),
  answers as (
    select
      e.question_id,
      e.step_index,
      u.option_index,
      u.option_label,
      count(*) as times
    from base e
    cross join lateral (
      select *
      from unnest(
        coalesce(e.option_ids, '{}'::int[]),
        coalesce(e.option_labels, '{}'::text[])
      ) as x(option_index, option_label)
    ) u
    where e.event_type = 'question_answer'
      and e.question_id is not null
    group by 1, 2, 3, 4
    order by e.question_id, times desc
  ),
  patterns as (
    select
      coalesce(pattern_id, 'unknown') as pattern_id,
      count(distinct session_id) as sessions
    from base
    where event_type = 'result'
    group by 1
    order by sessions desc
  ),
  totals as (
    select
      (select count(distinct session_id) from base) as sessions,
      (select count(*) from base) as events,
      (select count(distinct session_id) from base where event_type = 'start') as started,
      (select count(distinct session_id) from base where event_type = 'result') as completed,
      (select count(distinct session_id) from base where event_type = 'checkout') as checkouts
  )
  select json_build_object(
    'from', v_from,
    'to', v_to,
    'totals', (select row_to_json(t) from totals t),
    'funnel', (select row_to_json(f) from funnel f),
    'by_day', coalesce((select json_agg(row_to_json(d)) from by_day d), '[]'::json),
    'by_hour', coalesce((select json_agg(row_to_json(h)) from by_hour h), '[]'::json),
    'questions', coalesce((select json_agg(row_to_json(q)) from questions q), '[]'::json),
    'answers', coalesce((select json_agg(row_to_json(a)) from answers a), '[]'::json),
    'patterns', coalesce((select json_agg(row_to_json(p)) from patterns p), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.admin_analytics(text, timestamptz, timestamptz) to anon, authenticated;

-- Opcional: trocar senha
-- update public.app_settings set value = 'sua_senha_forte' where key = 'admin_password';
