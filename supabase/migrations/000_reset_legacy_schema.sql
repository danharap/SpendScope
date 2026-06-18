-- Reset legacy budgeting app schema before SpendScope (applied remotely via Supabase MCP)
-- Only needed if migrating an existing Supabase project from the old budgeting app.

drop table if exists public.budget_categories cascade;
drop table if exists public.bills cascade;
drop table if exists public.transactions cascade;
drop table if exists public.budgets cascade;
drop table if exists public.accounts cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
