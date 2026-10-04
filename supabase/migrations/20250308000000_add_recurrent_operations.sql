-- Recurring financial operations and their daily processor.
create extension if not exists pg_cron;

create table if not exists public.recurrent_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null check (amount > 0),
  source_id uuid not null references public.sources(id) on delete restrict,
  destination_source_id uuid references public.sources(id) on delete restrict,
  category_id text not null,
  subcategory_id text,
  description text not null default '',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  day_of_month integer not null check (day_of_month between 1 and 31),
  next_run_date date not null,
  is_active boolean not null default true,
  constraint recurrent_operation_transfer_destination check (
    (type = 'transfer' and destination_source_id is not null and destination_source_id <> source_id)
    or (type <> 'transfer' and destination_source_id is null)
  )
);

create index if not exists recurrent_operations_due_idx
  on public.recurrent_operations (next_run_date)
  where is_active;

create index if not exists recurrent_operations_user_idx
  on public.recurrent_operations (user_id);

alter table public.recurrent_operations enable row level security;

drop policy if exists "Users can read their recurrent operations" on public.recurrent_operations;
create policy "Users can read their recurrent operations"
  on public.recurrent_operations for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their recurrent operations" on public.recurrent_operations;
create policy "Users can create their recurrent operations"
  on public.recurrent_operations for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their recurrent operations" on public.recurrent_operations;
create policy "Users can update their recurrent operations"
  on public.recurrent_operations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their recurrent operations" on public.recurrent_operations;
create policy "Users can delete their recurrent operations"
  on public.recurrent_operations for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.process_recurrent_operations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  recurrent record;
  following_date date;
  target_month date;
  target_month_last_day integer;
begin
  for recurrent in
    select *
    from public.recurrent_operations
    where is_active
      and next_run_date <= current_date
    order by next_run_date
    for update skip locked
  loop
    insert into public.operations (
      id,
      type,
      amount,
      source_id,
      destination_source_id,
      category_id,
      subcategory_id,
      date,
      creation_date,
      description,
      created_by
    ) values (
      gen_random_uuid(),
      recurrent.type,
      recurrent.amount,
      recurrent.source_id,
      recurrent.destination_source_id,
      recurrent.category_id,
      recurrent.subcategory_id,
      current_date,
      now(),
      nullif(recurrent.description, ''),
      recurrent.user_id
    );

    update public.sources
    set balance = balance + case when recurrent.type = 'income' then recurrent.amount else -recurrent.amount end
    where id = recurrent.source_id;

    if recurrent.type = 'transfer' then
      update public.sources
      set balance = balance + recurrent.amount
      where id = recurrent.destination_source_id;
    end if;

    if recurrent.frequency = 'weekly' then
      following_date := recurrent.next_run_date + 7;
    elsif recurrent.frequency = 'monthly' then
      target_month := (date_trunc('month', recurrent.next_run_date) + interval '1 month')::date;
      target_month_last_day := extract(day from (target_month + interval '1 month - 1 day'))::integer;
      following_date := target_month + (least(recurrent.day_of_month, target_month_last_day) - 1);
    else
      target_month_last_day := extract(day from (
        make_date(
          extract(year from recurrent.next_run_date)::integer + 1,
          extract(month from recurrent.next_run_date)::integer,
          1
        ) + interval '1 month - 1 day'
      ))::integer;
      following_date := make_date(
        extract(year from recurrent.next_run_date)::integer + 1,
        extract(month from recurrent.next_run_date)::integer,
        least(recurrent.day_of_month, target_month_last_day)
      );
    end if;

    update public.recurrent_operations
    set next_run_date = following_date
    where id = recurrent.id;
  end loop;
end;
$function$;

revoke all on function public.process_recurrent_operations() from public, anon, authenticated;
grant execute on function public.process_recurrent_operations() to postgres, service_role;

-- Keep the migration repeatable by replacing an existing job with the same name.
do $schedule$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'process-recurrent-operations-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'process-recurrent-operations-daily',
    '5 0 * * *',
    'select public.process_recurrent_operations();'
  );
end;
$schedule$;
