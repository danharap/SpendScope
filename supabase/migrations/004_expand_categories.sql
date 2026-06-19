-- Expand default category catalog and add merged fast-food category.
-- Safe to run multiple times (inserts skip existing names).

insert into public.categories (name, color, icon, is_default, user_id)
select v.name, v.color, v.icon, true, null
from (values
  ('Fast Food & Delivery', '#ef4444', 'burger'),
  ('Alcohol & Beverages', '#9333ea', 'wine'),
  ('Tech & Apps', '#6366f1', 'smartphone'),
  ('Travel', '#0ea5e9', 'plane'),
  ('Pharmacy', '#059669', 'pill'),
  ('Personal Care', '#d946ef', 'sparkles'),
  ('Pets', '#f59e0b', 'paw-print'),
  ('Home & Garden', '#84cc16', 'home'),
  ('Education', '#2563eb', 'graduation-cap')
) as v(name, color, icon)
where not exists (
  select 1 from public.categories c
  where c.is_default = true and c.name = v.name
);

-- Migrate transactions from legacy categories to merged name when both exist.
update public.transactions t
set category_id = target.id
from public.categories legacy
join public.categories target
  on target.is_default = true and target.name = 'Fast Food & Delivery'
where legacy.is_default = true
  and legacy.name in ('Fast Food', 'Food Delivery')
  and t.category_id = legacy.id
  and legacy.id <> target.id;

update public.budgets b
set category_id = target.id
from public.categories legacy
join public.categories target
  on target.is_default = true and target.name = 'Fast Food & Delivery'
where legacy.is_default = true
  and legacy.name in ('Fast Food', 'Food Delivery')
  and b.category_id = legacy.id
  and legacy.id <> target.id;
