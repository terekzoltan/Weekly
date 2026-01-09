
-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

create table public.blocks (
  id text not null primary key,
  user_id uuid references auth.users not null,
  scope_type text not null,
  scope_id text not null,
  kind text not null,
  title text,
  content text,
  items jsonb,
  data jsonb,
  created_at text,
  updated_at text,
  search_text text
);

alter table public.blocks enable row level security;

-- Policy: Users can only see their own blocks
create policy "Users can see their own blocks"
on public.blocks for select
using ( auth.uid() = user_id );

-- Policy: Users can insert/update their own blocks
create policy "Users can insert their own blocks"
on public.blocks for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own blocks"
on public.blocks for update
using ( auth.uid() = user_id );

create policy "Users can delete their own blocks"
on public.blocks for delete
using ( auth.uid() = user_id );
