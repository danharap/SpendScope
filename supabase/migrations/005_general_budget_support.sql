-- Allow NULL category_id to represent a general (all-spending) budget
ALTER TABLE public.budgets ALTER COLUMN category_id DROP NOT NULL;

-- Drop the old unique constraint (can't cover NULL with standard UNIQUE)
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_key;

-- Unique constraint for category-specific budgets (non-NULL)
CREATE UNIQUE INDEX IF NOT EXISTS budgets_category_unique
  ON public.budgets (user_id, category_id, month)
  WHERE category_id IS NOT NULL;

-- Unique constraint ensuring at most one general budget per user per month
CREATE UNIQUE INDEX IF NOT EXISTS budgets_general_unique
  ON public.budgets (user_id, month)
  WHERE category_id IS NULL;
