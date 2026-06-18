-- Seed default categories (run after 001_initial_schema.sql)
-- These are shared across all users (user_id is null, is_default = true)

insert into public.categories (name, color, icon, is_default, user_id) values
  ('Restaurants', '#f97316', 'utensils', true, null),
  ('Fast Food', '#ef4444', 'burger', true, null),
  ('Coffee', '#a16207', 'coffee', true, null),
  ('Groceries', '#22c55e', 'shopping-basket', true, null),
  ('Food Delivery', '#eab308', 'truck', true, null),
  ('Shopping', '#8b5cf6', 'shopping-bag', true, null),
  ('Subscriptions', '#3b82f6', 'repeat', true, null),
  ('Transportation', '#06b6d4', 'car', true, null),
  ('Gas', '#64748b', 'fuel', true, null),
  ('Entertainment', '#ec4899', 'film', true, null),
  ('Health', '#14b8a6', 'heart-pulse', true, null),
  ('Fitness', '#10b981', 'dumbbell', true, null),
  ('Bills', '#6b7280', 'receipt', true, null),
  ('Rent / Housing', '#78716c', 'home', true, null),
  ('Transfers', '#94a3b8', 'arrow-left-right', true, null),
  ('Income', '#16a34a', 'trending-up', true, null),
  ('Refunds', '#4ade80', 'rotate-ccw', true, null),
  ('Other', '#cbd5e1', 'circle', true, null),
  ('Needs Review', '#fb923c', 'alert-circle', true, null)
on conflict do nothing;
