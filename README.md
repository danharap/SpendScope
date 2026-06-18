# SpendScope

A private personal finance dashboard for tracking RBC spending via CSV uploads. Categorize transactions, review monthly spending, and set simple budgets — without connecting to your bank.

## Features

- **CSV upload** — Import RBC chequing, savings, and credit card exports
- **Auto-categorization** — Keyword rules for fast food, groceries, subscriptions, and more
- **Dashboard** — Monthly spending, category breakdowns, food trends, top merchants
- **Budgets** — Set monthly limits per category with progress tracking
- **Insights** — Personalized spending observations
- **Merchant rules** — Save categorization rules for future imports
- **Deduplication** — Skip duplicate transactions on re-import

## Privacy

SpendScope is **CSV-only**. It does not:

- Connect to RBC or any bank
- Store usernames, passwords, or card numbers
- Use Plaid, Flinks, or screen scraping

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Recharts, Papa Parse, date-fns, Zod

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/danharap/RBC-CSV-Analyzer.git
cd RBC-CSV-Analyzer
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_categories.sql`
3. In **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000` (and your Vercel URL later)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in from Supabase **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and upload your first RBC CSV.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the same environment variables
4. Update Supabase redirect URLs with your Vercel domain

## Project Structure

```
app/
  dashboard/          # Protected dashboard pages
  login/ signup/      # Auth pages
components/
  charts/             # Recharts visualizations
  dashboard/          # Dashboard widgets
  layout/             # Sidebar, header
  upload/             # CSV upload flow
  transactions/       # Transaction table & filters
lib/
  actions/            # Server actions
  analytics/          # Dashboard & insight calculations
  categorization/     # Auto-categorization engine
  csv/                # Parsing, normalization, dedupe
  supabase/           # Supabase clients
supabase/migrations/  # Database schema + RLS
```

## CSV Export from RBC

1. Log in to RBC Online Banking
2. Select the account or credit card
3. Find the transaction export / download option
4. Choose a date range and download as CSV
5. Upload to SpendScope → Upload CSV

## License

Private — for personal use.
