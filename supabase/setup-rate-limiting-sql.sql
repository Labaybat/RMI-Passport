-- Execute these statements in the Supabase SQL editor

-- Create the check_if_table_exists function
create or replace function public.check_if_table_exists(table_name text)
returns boolean
language plpgsql security definer
as $$
declare
  table_exists boolean;
begin
  select exists(
    select 1
    from information_schema.tables 
    where table_schema = 'public' 
    and table_name = $1
  ) into table_exists;
  
  return table_exists;
end;
$$;

-- Create the simplified function for edge function use
create or replace function public.create_rate_limit_table_simplified()
returns void
language plpgsql security definer
as $$
begin
  if not check_if_table_exists('rate_limit_requests') then
    create table public.rate_limit_requests (
      id uuid primary key default uuid_generate_v4(),
      email text not null,
      client_ip text not null,
      created_at timestamp with time zone not null default now()
    );

    -- Create indices for faster querying
    create index rate_limit_requests_email_idx on public.rate_limit_requests (email);
    create index rate_limit_requests_client_ip_idx on public.rate_limit_requests (client_ip);
    create index rate_limit_requests_created_at_idx on public.rate_limit_requests (created_at);
    
    -- Create RLS policies
    alter table public.rate_limit_requests enable row level security;
    
    -- Service role can do anything with rate_limit_requests
    create policy "Service role can manage all rate_limit_requests"
      on public.rate_limit_requests
      for all
      to service_role
      using (true);
  end if;
end;
$$;

-- Create the rate limit table
create table if not exists public.rate_limit_requests (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  client_ip text not null,
  created_at timestamp with time zone not null default now()
);

-- Create indexes for better performance
create index if not exists rate_limit_requests_email_idx on public.rate_limit_requests (email);
create index if not exists rate_limit_requests_client_ip_idx on public.rate_limit_requests (client_ip);
create index if not exists rate_limit_requests_created_at_idx on public.rate_limit_requests (created_at);

-- Enable RLS
alter table public.rate_limit_requests enable row level security;

-- Create service role policy
create policy if not exists "Service role can manage all rate_limit_requests"
  on public.rate_limit_requests
  for all
  to service_role
  using (true);

-- Create cleanup function
create or replace function public.cleanup_rate_limit_records()
returns void
language plpgsql security definer
as $$
begin
  delete from public.rate_limit_requests
  where created_at < now() - interval '1 day';
end;
$$;

-- Check if pg_cron extension is available and create cleanup job
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-rate-limit-records',
      '0 0 * * *',
      'select public.cleanup_rate_limit_records();'
    );
  end if;
exception when others then
  raise notice 'pg_cron extension not available, skipping scheduled job creation';
end;
$$;
