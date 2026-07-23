-- ============================================================
-- Mapa do Padrão Amoroso — Tracking estilo Enlead
-- SQL Editor → cole tudo → Run
-- ============================================================

-- 1) Uma LINHA por pessoa (esteira de respostas)
create table if not exists public.quiz_leads (
  lead_id text primary key,
  session_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  duration_seconds int,
  status text not null default 'started',
  -- started | profile | in_quiz | completed | checkout
  current_step int not null default 0,
  max_step_reached int not null default 0,
  -- geo / device
  ip text,
  country text,
  region text,
  city text,
  device_type text,
  os text,
  browser text,
  language text,
  user_agent text,
  -- aquisição
  referrer text,
  landing_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  ttclid text,
  fbc text,
  fbp text,
  -- perfil no quiz
  name text,
  sign text,
  -- respostas: { "q1": { "labels": ["..."], "indices": [0,1], "at": "ISO" }, ... }
  answers jsonb not null default '{}'::jsonb,
  -- passos tocados: { "landing": true, "start": true, "q1": true, ... }
  steps jsonb not null default '{}'::jsonb,
  pattern_id text,
  pattern_name text,
  checkout_clicked_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists quiz_leads_started_at_idx on public.quiz_leads (started_at desc);
create index if not exists quiz_leads_status_idx on public.quiz_leads (status);
create index if not exists quiz_leads_max_step_idx on public.quiz_leads (max_step_reached);

-- 2) Log fino de eventos (opcional / detalhe)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
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

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_lead_idx on public.analytics_events (lead_id);
create index if not exists analytics_events_type_idx on public.analytics_events (event_type);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

insert into public.app_settings (key, value)
values ('admin_password', 'mapa2026')
on conflict (key) do nothing;

-- RLS
alter table public.quiz_leads enable row level security;
alter table public.analytics_events enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "anon_insert_leads" on public.quiz_leads;
drop policy if exists "anon_update_leads" on public.quiz_leads;
drop policy if exists "anon_insert_events" on public.analytics_events;

create policy "anon_insert_leads"
  on public.quiz_leads for insert to anon, authenticated
  with check (true);

create policy "anon_update_leads"
  on public.quiz_leads for update to anon, authenticated
  using (true) with check (true);

create policy "anon_insert_events"
  on public.analytics_events for insert to anon, authenticated
  with check (true);

-- ============================================================
-- RPC Admin (senha no servidor)
-- ============================================================
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
begin
  select value into v_expected from public.app_settings where key = 'admin_password';
  if v_expected is null or p_password is distinct from v_expected then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  return (
    with leads as (
      select *
      from public.quiz_leads
      where started_at >= v_from and started_at <= v_to
    ),
    totals as (
      select
        count(*) as leads,
        count(*) filter (where (steps ? 'start') or status in ('in_quiz','completed','checkout')) as started,
        count(*) filter (where max_step_reached >= 1) as reached_q1,
        count(*) filter (where status in ('completed','checkout') or completed_at is not null) as completed,
        count(*) filter (where checkout_clicked_at is not null or status = 'checkout') as checkouts,
        round(avg(duration_seconds) filter (where duration_seconds is not null), 0) as avg_duration_sec
      from leads
    ),
    -- % que passou de cada step (viu ou respondeu a pergunta N)
    step_funnel as (
      select
        s.step_key,
        s.step_index,
        s.label,
        count(*) filter (
          where
            case
              when s.step_key = 'landing' then true
              when s.step_key = 'start' then (l.steps ? 'start') or l.max_step_reached >= 0
              when s.step_key = 'profile' then (l.steps ? 'profile') or l.max_step_reached >= 0
              when s.step_key like 'q%' then
                (l.steps ? s.step_key)
                or (l.answers ? s.step_key)
                or l.max_step_reached >= s.step_index
              when s.step_key = 'result' then l.completed_at is not null or l.status in ('completed','checkout')
              when s.step_key = 'checkout' then l.checkout_clicked_at is not null or l.status = 'checkout'
              else false
            end
        ) as reached,
        (select count(*) from leads) as total_leads
      from (
        values
          ('landing', 0, 'Landing'),
          ('start', 0, 'Começou'),
          ('profile', 0, 'Perfil'),
          ('q1', 1, 'Pergunta 1'),
          ('q2', 2, 'Pergunta 2'),
          ('q3', 3, 'Pergunta 3'),
          ('q4m', 4, 'Pergunta 4'),
          ('q5', 5, 'Pergunta 5'),
          ('q6', 6, 'Pergunta 6'),
          ('q7', 7, 'Pergunta 7'),
          ('q8m', 8, 'Pergunta 8'),
          ('q9', 9, 'Pergunta 9'),
          ('q10', 10, 'Pergunta 10'),
          ('q11m', 11, 'Pergunta 11'),
          ('q12', 12, 'Pergunta 12'),
          ('result', 13, 'Resultado'),
          ('checkout', 14, 'Checkout')
      ) as s(step_key, step_index, label)
      cross join leads l
      group by s.step_key, s.step_index, s.label
      order by s.step_index, s.step_key
    ),
    by_day as (
      select
        to_char(date_trunc('day', started_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as day,
        count(*) as leads,
        count(*) filter (where (steps ? 'start')) as starts,
        count(*) filter (where completed_at is not null) as results,
        count(*) filter (where checkout_clicked_at is not null) as checkouts
      from leads
      group by 1
      order by 1
    ),
    by_hour as (
      select
        extract(hour from started_at at time zone 'America/Sao_Paulo')::int as hour,
        count(*) as leads,
        count(*) filter (where (steps ? 'start')) as starts,
        count(*) filter (where completed_at is not null) as results,
        count(*) filter (where checkout_clicked_at is not null) as checkouts
      from leads
      group by 1
      order by 1
    ),
    -- ranking de respostas por pergunta
    answer_rows as (
      select
        qkey as question_id,
        lab as option_label,
        count(*) as times
      from leads l
      cross join lateral jsonb_each(l.answers) kv(qkey, qval)
      cross join lateral jsonb_array_elements_text(coalesce(qval->'labels', '[]'::jsonb)) lab
      group by 1, 2
      order by 1, times desc
    ),
    patterns as (
      select
        coalesce(pattern_id, 'unknown') as pattern_id,
        coalesce(max(pattern_name), pattern_id) as pattern_name,
        count(*) as sessions
      from leads
      where pattern_id is not null
      group by pattern_id
      order by sessions desc
    ),
    lead_rows as (
      select
        lead_id,
        started_at,
        completed_at,
        last_seen_at,
        duration_seconds,
        status,
        current_step,
        max_step_reached,
        country,
        region,
        city,
        device_type,
        os,
        browser,
        utm_source,
        utm_medium,
        utm_campaign,
        name,
        sign,
        pattern_id,
        pattern_name,
        answers,
        steps,
        checkout_clicked_at is not null as checkout
      from leads
      order by started_at desc
      limit 500
    )
    select json_build_object(
      'from', v_from,
      'to', v_to,
      'totals', (select row_to_json(t) from totals t),
      'step_funnel', coalesce((
        select json_agg(json_build_object(
          'step_key', step_key,
          'step_index', step_index,
          'label', label,
          'reached', reached,
          'total_leads', total_leads,
          'pass_rate', case when total_leads > 0
            then round((reached::numeric / total_leads::numeric) * 100, 1)
            else 0 end
        ) order by step_index, step_key)
        from step_funnel
      ), '[]'::json),
      'by_day', coalesce((select json_agg(row_to_json(d)) from by_day d), '[]'::json),
      'by_hour', coalesce((select json_agg(row_to_json(h)) from by_hour h), '[]'::json),
      'answers', coalesce((select json_agg(row_to_json(a)) from answer_rows a), '[]'::json),
      'patterns', coalesce((select json_agg(row_to_json(p)) from patterns p), '[]'::json),
      'leads', coalesce((select json_agg(row_to_json(lr)) from lead_rows lr), '[]'::json)
    )
  );
end;
$$;

grant execute on function public.admin_analytics(text, timestamptz, timestamptz) to anon, authenticated;

-- Trocar senha:
-- update public.app_settings set value = 'sua_senha' where key = 'admin_password';
