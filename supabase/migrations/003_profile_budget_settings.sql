-- User budget preferences on profiles
alter table public.profiles
  add column if not exists weekly_spending_limit numeric not null default 200,
  add column if not exists hourly_rate numeric not null default 30,
  add column if not exists hours_per_week numeric not null default 40,
  add column if not exists pay_frequency text not null default 'biweekly'
    check (pay_frequency in ('weekly', 'biweekly', 'monthly'));

comment on column public.profiles.weekly_spending_limit is 'Max casual spending per week (CAD)';
comment on column public.profiles.hourly_rate is 'Hourly pay rate for income estimates (CAD)';
comment on column public.profiles.hours_per_week is 'Hours worked per week for income estimates';
comment on column public.profiles.pay_frequency is 'How often pay is deposited';
