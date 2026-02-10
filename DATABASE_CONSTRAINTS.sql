-- Idempotent constraints for slug format and status values.
-- Run in Supabase SQL editor.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_status_check') then
    alter table stores
      add constraint stores_status_check
      check (status in ('draft', 'active', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_slug_format_check') then
    alter table stores
      add constraint stores_slug_format_check
      check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'landing_status_check') then
    alter table landing_pages
      add constraint landing_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'landing_slug_format_check') then
    alter table landing_pages
      add constraint landing_slug_format_check
      check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

-- Row Level Security proposals: enable RLS and example policies
-- NOTE: Review and adjust roles and policies in Supabase SQL editor before applying.
-- Enable RLS on user-owned tables
do $$
begin
  -- Enable RLS for tables that store user-specific data
  if exists (select 1 from information_schema.tables where table_name = 'stores') then
    execute 'alter table stores enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'landing_pages') then
    execute 'alter table landing_pages enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'research_sessions') then
    execute 'alter table research_sessions enable row level security';
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'product_candidates') then
    execute 'alter table product_candidates enable row level security';
  end if;
end $$;

-- Example policies (replace with precise role names and conditions):
-- Allow authenticated users to select/insert/update/delete their own rows
do $$
begin
  if exists (select 1 from pg_class where relname = 'stores') then
    execute $$
      create policy if not exists "stores_is_owner" on stores
      for all
      using (auth.role() = 'authenticated' and user_id = auth.uid())
      with check (auth.role() = 'authenticated' and user_id = auth.uid());
    $$;
  end if;

  if exists (select 1 from pg_class where relname = 'landing_pages') then
    execute $$
      create policy if not exists "landing_is_owner" on landing_pages
      for all
      using (auth.role() = 'authenticated' and user_id = auth.uid())
      with check (auth.role() = 'authenticated' and user_id = auth.uid());
    $$;
  end if;
end $$;
