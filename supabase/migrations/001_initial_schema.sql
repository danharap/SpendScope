-- SpendScope initial schema with Row Level Security

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('bank', 'credit_card', 'savings', 'other')),
  institution text not null default 'RBC',
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "Users manage own accounts"
  on public.accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  icon text not null default 'circle',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "Users can view default and own categories"
  on public.categories for select
  using (is_default = true or auth.uid() = user_id);

create policy "Users manage own categories"
  on public.categories for insert
  with check (auth.uid() = user_id and is_default = false);

create policy "Users update own categories"
  on public.categories for update
  using (auth.uid() = user_id and is_default = false);

create policy "Users delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id and is_default = false);

-- Imports
create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  file_name text not null,
  file_hash text not null,
  rows_total integer not null default 0,
  rows_imported integer not null default 0,
  rows_skipped integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists imports_user_id_idx on public.imports (user_id);
create index if not exists imports_file_hash_idx on public.imports (user_id, file_hash);

alter table public.imports enable row level security;

create policy "Users manage own imports"
  on public.imports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  import_id uuid references public.imports (id) on delete set null,
  transaction_date date not null,
  description_raw text not null,
  merchant_name text not null default '',
  amount numeric not null,
  currency text not null default 'CAD',
  category_id uuid references public.categories (id) on delete set null,
  subcategory text,
  transaction_type text,
  is_income boolean not null default false,
  is_transfer boolean not null default false,
  is_subscription boolean not null default false,
  needs_review boolean not null default false,
  notes text,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transactions_dedupe_key_idx
  on public.transactions (user_id, dedupe_key);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_category_idx
  on public.transactions (user_id, category_id);
create index if not exists transactions_merchant_idx
  on public.transactions (user_id, merchant_name);

alter table public.transactions enable row level security;

create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Merchant rules
create table if not exists public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_text text not null,
  merchant_name text not null,
  category_id uuid references public.categories (id) on delete set null,
  subcategory text,
  is_subscription boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists merchant_rules_user_id_idx on public.merchant_rules (user_id);

alter table public.merchant_rules enable row level security;

create policy "Users manage own merchant rules"
  on public.merchant_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Budgets
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month text not null,
  limit_amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create index if not exists budgets_user_month_idx on public.budgets (user_id, month);

alter table public.budgets enable row level security;

create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger for transactions and budgets
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists budgets_updated_at on public.budgets;
create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();
