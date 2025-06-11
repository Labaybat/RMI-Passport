-- Create the rate_limit_requests table
create table if not exists public.rate_limit_requests (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  client_ip text not null,
  created_at timestamp with time zone not null default now()
);

-- Create indices for faster querying
create index if not exists rate_limit_requests_email_idx on public.rate_limit_requests (email);
create index if not exists rate_limit_requests_client_ip_idx on public.rate_limit_requests (client_ip);
create index if not exists rate_limit_requests_created_at_idx on public.rate_limit_requests (created_at);

-- Create RLS policies
alter table public.rate_limit_requests enable row level security;

-- Only the service role can manage rate_limit_requests
create policy "Service role can manage all rate_limit_requests"
  on public.rate_limit_requests
  for all
  to service_role
  using (true);

-- Create a function to clean up old rate limit records
create or replace function public.cleanup_rate_limit_records()
returns void
language plpgsql security definer
as $$
begin
  delete from public.rate_limit_requests
  where created_at < now() - interval '1 day';
end;
$$;

-- Set up a cron job to clean up old records daily
select cron.schedule(
  'cleanup-rate-limit-records',  -- name of the cron job
  '0 0 * * *',                   -- run at midnight every day
  $$
  select public.cleanup_rate_limit_records();
  $$
);

-- Grant appropriate permissions
grant usage on schema public to service_role;
grant all privileges on public.rate_limit_requests to service_role;
