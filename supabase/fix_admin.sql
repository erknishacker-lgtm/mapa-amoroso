-- ============================================================
-- RODE ISTO NO SQL EDITOR (corrige senha + permissões do painel)
-- ============================================================

-- 1) Tabela de senha SEM RLS (senão a função não consegue ler)
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings disable row level security;

insert into public.app_settings (key, value)
values ('admin_password', 'mapa2026')
on conflict (key) do update set value = 'mapa2026';

-- 2) Permissões nas tabelas do tracking
grant usage on schema public to anon, authenticated, public;
grant insert, update on table public.quiz_leads to anon, authenticated, public;
grant insert on table public.analytics_events to anon, authenticated, public;

-- 3) RLS só nas tabelas de dados (insert/update liberados)
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

-- 4) Função do painel — senha fixa mapa2026 (e também lê app_settings)
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
  -- tenta ler settings; se falhar, mantém mapa2026
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
        count(*) filter (where (steps ? 'start') or status in ('in_quiz','completed','checkout')) as started,
        count(*) filter (where max_step_reached >= 1) as reached_q1,
        count(*) filter (where status in ('completed','checkout') or completed_at is not null) as completed,
        count(*) filter (where checkout_clicked_at is not null or status = 'checkout') as checkouts,
        round(avg(duration_seconds) filter (where duration_seconds is not null), 0) as avg_duration_sec
      from leads
    ),
    step_funnel as (
      select
        s.step_key, s.step_index, s.label,
        count(*) filter (
          where case
            when s.step_key = 'landing' then true
            when s.step_key = 'start' then (l.steps ? 'start')
            when s.step_key = 'profile' then (l.steps ? 'profile')
            when s.step_key like 'q%' then
              (l.steps ? s.step_key) or (l.answers ? s.step_key) or l.max_step_reached >= s.step_index
            when s.step_key = 'result' then l.completed_at is not null or l.status in ('completed','checkout')
            when s.step_key = 'checkout' then l.checkout_clicked_at is not null or l.status = 'checkout'
            else false
          end
        ) as reached,
        (select count(*) from leads) as total_leads
      from (
        values
          ('landing',0,'Landing'),('start',0,'Começou'),('profile',0,'Perfil'),
          ('q1',1,'Pergunta 1'),('q2',2,'Pergunta 2'),('q3',3,'Pergunta 3'),
          ('q4m',4,'Pergunta 4'),('q5',5,'Pergunta 5'),('q6',6,'Pergunta 6'),
          ('q7',7,'Pergunta 7'),('q8m',8,'Pergunta 8'),('q9',9,'Pergunta 9'),
          ('q10',10,'Pergunta 10'),('q11m',11,'Pergunta 11'),('q12',12,'Pergunta 12'),
          ('result',13,'Resultado'),('checkout',14,'Checkout')
      ) as s(step_key, step_index, label)
      cross join leads l
      group by s.step_key, s.step_index, s.label
    ),
    by_day as (
      select to_char(date_trunc('day', started_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as day,
        count(*) as leads,
        count(*) filter (where steps ? 'start') as starts,
        count(*) filter (where completed_at is not null) as results,
        count(*) filter (where checkout_clicked_at is not null) as checkouts
      from leads group by 1 order by 1
    ),
    by_hour as (
      select extract(hour from started_at at time zone 'America/Sao_Paulo')::int as hour,
        count(*) as leads,
        count(*) filter (where steps ? 'start') as starts,
        count(*) filter (where completed_at is not null) as results,
        count(*) filter (where checkout_clicked_at is not null) as checkouts
      from leads group by 1 order by 1
    ),
    answer_rows as (
      select qkey as question_id, lab as option_label, count(*) as times
      from leads l
      cross join lateral jsonb_each(coalesce(l.answers, '{}'::jsonb)) kv(qkey, qval)
      cross join lateral jsonb_array_elements_text(coalesce(qval->'labels', '[]'::jsonb)) lab
      group by 1, 2
    ),
    patterns as (
      select coalesce(pattern_id,'unknown') as pattern_id,
        coalesce(max(pattern_name), pattern_id) as pattern_name,
        count(*) as sessions
      from leads where pattern_id is not null group by pattern_id
    ),
    lead_rows as (
      select lead_id, started_at, completed_at, last_seen_at, duration_seconds, status,
        current_step, max_step_reached, country, region, city, device_type, os, browser,
        utm_source, utm_medium, utm_campaign, name, sign, pattern_id, pattern_name,
        answers, steps, checkout_clicked_at is not null as checkout
      from leads order by started_at desc limit 500
    )
    select json_build_object(
      'from', v_from, 'to', v_to,
      'totals', coalesce((select row_to_json(t) from totals t), '{}'::json),
      'step_funnel', coalesce((
        select json_agg(json_build_object(
          'step_key', step_key, 'step_index', step_index, 'label', label,
          'reached', reached, 'total_leads', total_leads,
          'pass_rate', case when total_leads > 0 then round((reached::numeric/total_leads::numeric)*100,1) else 0 end
        ) order by step_index, step_key) from step_funnel
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

alter function public.admin_analytics(text, timestamptz, timestamptz) owner to postgres;
grant execute on function public.admin_analytics(text, timestamptz, timestamptz) to anon, authenticated, public, service_role;

-- Deve retornar mapa2026
select key, value from public.app_settings where key = 'admin_password';
