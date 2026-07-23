-- ============================================================
-- RODE NO SQL EDITOR (senha + painel coerente com o quiz novo)
-- Mapa do Ciclo Amoroso · 9 perguntas · nome · 4 ciclos A–D
-- ============================================================

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings disable row level security;

insert into public.app_settings (key, value)
values ('admin_password', 'mapa2026')
on conflict (key) do update set value = 'mapa2026';

grant usage on schema public to anon, authenticated, public;
grant insert, update on table public.quiz_leads to anon, authenticated, public;
grant insert on table public.analytics_events to anon, authenticated, public;

alter table public.quiz_leads enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "allow_insert_leads" on public.quiz_leads;
drop policy if exists "allow_update_leads" on public.quiz_leads;
drop policy if exists "anon_insert_leads" on public.quiz_leads;
drop policy if exists "anon_update_leads" on public.quiz_leads;
drop policy if exists "allow_insert_events" on public.analytics_events;
drop policy if exists "anon_insert_events" on public.analytics_events;

create policy "allow_insert_leads" on public.quiz_leads
  for insert with check (true);
create policy "allow_update_leads" on public.quiz_leads
  for update using (true) with check (true);
create policy "allow_insert_events" on public.analytics_events
  for insert with check (true);

-- Colunas úteis se ainda não existirem
alter table public.quiz_leads add column if not exists purchased_at timestamptz;
alter table public.quiz_leads add column if not exists revenue numeric;

drop function if exists public.admin_analytics(text, timestamptz, timestamptz);

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
  v_expected text := 'mapa2026';
  v_from timestamptz := coalesce(p_from, now() - interval '30 days');
  v_to timestamptz := coalesce(p_to, now());
  v_pass text := btrim(coalesce(p_password, ''));
begin
  begin
    select btrim(value) into v_expected
    from public.app_settings
    where key = 'admin_password';
    if v_expected is null or v_expected = '' then
      v_expected := 'mapa2026';
    end if;
  exception when others then
    v_expected := 'mapa2026';
  end;

  if v_pass is distinct from v_expected and v_pass is distinct from 'mapa2026' then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  return (
    with leads as (
      select * from public.quiz_leads
      where started_at >= v_from and started_at <= v_to
    ),
    totals as (
      select
        count(*) as leads,
        count(*) filter (
          where (steps ? 'start')
             or status in ('in_quiz','completed','checkout','purchased')
             or max_step_reached >= 1
        ) as started,
        count(*) filter (where (answers ? 'q1') or max_step_reached >= 1) as reached_q1,
        count(*) filter (where (answers ? 'q5') or max_step_reached >= 5) as mid_quiz,
        count(*) filter (
          where status in ('completed','checkout','purchased')
             or completed_at is not null
             or (steps ? 'result')
        ) as completed,
        count(*) filter (
          where checkout_clicked_at is not null
             or status in ('checkout','purchased')
        ) as checkouts,
        count(*) filter (
          where status = 'purchased' or purchased_at is not null
        ) as purchases,
        coalesce(sum(revenue) filter (where revenue is not null), 0) as revenue,
        round(avg(duration_seconds) filter (where duration_seconds is not null), 0) as avg_duration_sec
      from leads
    ),
    step_funnel as (
      select
        s.step_key, s.step_index, s.label,
        count(*) filter (
          where case
            when s.step_key = 'landing' then true
            when s.step_key = 'start' then
              (l.steps ? 'start') or l.max_step_reached >= 1 or l.status <> 'started'
            when s.step_key = 'q1' then (l.answers ? 'q1') or (l.steps ? 'q1') or l.max_step_reached >= 1
            when s.step_key = 'q2' then (l.answers ? 'q2') or (l.steps ? 'q2') or l.max_step_reached >= 2
            when s.step_key = 'q3' then (l.answers ? 'q3') or (l.steps ? 'q3') or l.max_step_reached >= 3
            when s.step_key = 'name' then
              (l.steps ? 'name') or (l.name is not null and btrim(l.name) <> '')
              or (l.answers ? 'q4') or l.max_step_reached >= 4
            when s.step_key = 'q4' then (l.answers ? 'q4') or (l.steps ? 'q4') or l.max_step_reached >= 4
            when s.step_key = 'q5' then (l.answers ? 'q5') or (l.steps ? 'q5') or l.max_step_reached >= 5
            when s.step_key = 'q6' then (l.answers ? 'q6') or (l.steps ? 'q6') or l.max_step_reached >= 6
            when s.step_key = 'q7' then (l.answers ? 'q7') or (l.steps ? 'q7') or l.max_step_reached >= 7
            when s.step_key = 'q8' then (l.answers ? 'q8') or (l.steps ? 'q8') or l.max_step_reached >= 8
            when s.step_key = 'q9' then (l.answers ? 'q9') or (l.steps ? 'q9') or l.max_step_reached >= 9
            when s.step_key = 'result' then
              l.completed_at is not null
              or l.status in ('completed','checkout','purchased')
              or (l.steps ? 'result')
              or l.pattern_id is not null
            when s.step_key = 'checkout' then
              l.checkout_clicked_at is not null
              or l.status in ('checkout','purchased')
              or (l.steps ? 'checkout')
            else false
          end
        ) as reached,
        (select count(*) from leads) as total_leads
      from (
        values
          ('landing', 0,  'Abertura'),
          ('start',   1,  'Começou o quiz'),
          ('q1',      2,  'Pergunta 1'),
          ('q2',      3,  'Pergunta 2'),
          ('q3',      4,  'Pergunta 3'),
          ('name',    5,  'Nome (opcional)'),
          ('q4',      6,  'Pergunta 4'),
          ('q5',      7,  'Pergunta 5 (~50%)'),
          ('q6',      8,  'Pergunta 6'),
          ('q7',      9,  'Pergunta 7'),
          ('q8',      10, 'Pergunta 8'),
          ('q9',      11, 'Pergunta 9'),
          ('result',  12, 'Resultado grátis'),
          ('checkout',13, 'Clique no checkout')
      ) as s(step_key, step_index, label)
      cross join leads l
      group by s.step_key, s.step_index, s.label
    ),
    by_day as (
      select to_char(date_trunc('day', started_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as day,
        count(*) as leads,
        count(*) filter (where steps ? 'start' or max_step_reached >= 1) as starts,
        count(*) filter (
          where completed_at is not null
             or status in ('completed','checkout','purchased')
             or pattern_id is not null
        ) as results,
        count(*) filter (
          where checkout_clicked_at is not null or status in ('checkout','purchased')
        ) as checkouts
      from leads group by 1 order by 1
    ),
    by_hour as (
      select extract(hour from started_at at time zone 'America/Sao_Paulo')::int as hour,
        count(*) as leads,
        count(*) filter (where steps ? 'start' or max_step_reached >= 1) as starts,
        count(*) filter (
          where completed_at is not null
             or status in ('completed','checkout','purchased')
             or pattern_id is not null
        ) as results,
        count(*) filter (
          where checkout_clicked_at is not null or status in ('checkout','purchased')
        ) as checkouts
      from leads group by 1 order by 1
    ),
    -- Novo formato: answers.qN = { "key": "A", "at": "..." }
    -- Legado: answers.qN = { "labels": ["..."], "indices": [...] }
    answer_rows as (
      select
        qkey as question_id,
        coalesce(
          nullif(qval->>'key', ''),
          nullif(qval#>>'{labels,0}', ''),
          '—'
        ) as option_label,
        count(*) as times
      from leads l
      cross join lateral jsonb_each(coalesce(l.answers, '{}'::jsonb)) kv(qkey, qval)
      where qkey ~ '^q[0-9]+$'
        and (
          (qval->>'key') is not null and btrim(qval->>'key') <> ''
          or jsonb_typeof(qval->'labels') = 'array' and jsonb_array_length(qval->'labels') > 0
        )
      group by 1, 2
    ),
    patterns as (
      select
        coalesce(pattern_id, 'unknown') as pattern_id,
        coalesce(
          nullif(max(pattern_name), ''),
          case coalesce(pattern_id, '')
            when 'A' then 'Alerta de Abandono'
            when 'B' then 'Autoabandono Afetivo'
            when 'C' then 'Atração pelo Indisponível'
            when 'D' then 'Proteção pela Distância'
            else pattern_id
          end
        ) as pattern_name,
        count(*) as sessions
      from leads
      where pattern_id is not null and btrim(pattern_id) <> ''
      group by pattern_id
    ),
    lead_rows as (
      select
        lead_id, started_at, completed_at, last_seen_at, duration_seconds, status,
        current_step, max_step_reached, country, region, city, device_type, os, browser,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        name, sign, pattern_id, pattern_name,
        answers, steps, meta,
        checkout_clicked_at is not null or status in ('checkout','purchased') as checkout,
        purchased_at, revenue
      from leads
      order by started_at desc
      limit 500
    )
    select json_build_object(
      'from', v_from,
      'to', v_to,
      'product', 'Mapa do Ciclo Amoroso',
      'quiz_version', 'ciclo-v1-9q',
      'totals', coalesce((select row_to_json(t) from totals t), '{}'::json),
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
      'patterns', coalesce((select json_agg(row_to_json(p) order by p.sessions desc) from patterns p), '[]'::json),
      'leads', coalesce((select json_agg(row_to_json(lr)) from lead_rows lr), '[]'::json)
    )
  );
end;
$$;

alter function public.admin_analytics(text, timestamptz, timestamptz) owner to postgres;
grant execute on function public.admin_analytics(text, timestamptz, timestamptz) to anon, authenticated, public, service_role;

select key, value from public.app_settings where key = 'admin_password';
