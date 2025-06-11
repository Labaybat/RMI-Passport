-- Create a function to check if a table exists
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

-- Create a function to create the rate_limit_requests table if it doesn't exist
create or replace function public.create_rate_limit_table()
returns void
language plpgsql security definer
as $$
begin
  if not check_if_table_exists('rate_limit_requests') then
    create table public.rate_limit_requests (
      id uuid primary key default uuid_generate_v4(),
      email text not null,
      client_ip text not null,
      created_at timestamp with time zone not null default now(),
      
      -- Add indices for faster querying
      constraint rate_limit_requests_email_idx foreign key (email) references auth.users(email) on delete cascade,
      constraint rate_limit_requests_client_ip_idx foreign key (client_ip) references public.client_ips(ip) on delete cascade
    );

    -- Create RLS policies
    alter table public.rate_limit_requests enable row level security;
    
    -- Service role can do anything with rate_limit_requests
    create policy "Service role can manage all rate_limit_requests"
      on public.rate_limit_requests
      for all
      to service_role
      using (true);

    -- Create cleanup function to delete old rate limit records
    create or replace function public.cleanup_rate_limit_records()
    returns void
    language plpgsql security definer
    as $$
    begin
      delete from public.rate_limit_requests
      where created_at < now() - interval '1 day';
    end;
    $$;

    -- Create a scheduled job to clean up old rate limit records
    select
      cron.schedule(
        'cleanup-rate-limit-records',  -- name of the cron job
        '0 0 * * *',                   -- run at midnight every day
        $$
        select public.cleanup_rate_limit_records();
        $$
      );
  end if;
end;
$$;

-- Simplified version that doesn't rely on foreign key constraints 
-- for use in the edge function
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
