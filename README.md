# Giggle Home Pros

A marketplace connecting homeowners with trusted contractors for home repair and improvement projects.

**Live app:** https://giggle-home-pros.lovable.app

## What it does

- Homeowners post projects and browse vetted contractors
- Contractors sign up, build a profile, and bid on jobs
- AI-powered photo and video analysis to help diagnose home repair needs
- Escrow-based payments with same-day payout for contractors
- Post-job tradesman rating system (Quality · Communication · Cleanliness) gated on escrow release, with admin-only private feedback

## User roles

**Customers** (`/profile`, `/dashboard`)
- Create an account, set location and trade interests
- Post projects and browse contractors

**Contractors** (`/contractor/profile/*`)
- Onboard via `/contractor/signup` (business info + expertise)
- Manage active bids, profile settings, and license/insurance verification

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **Routing:** React Router v6
- **State:** TanStack Query

## Local development

```sh
git clone <repo-url>
cd giggle-home-pros
npm install
npm run dev
```

Requires Node.js 18+. The app connects to a hosted Supabase instance — no local Supabase setup needed for frontend work.

## Key scripts

```sh
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest unit tests
```

## Project structure

```
src/
  pages/           # Route-level components
  components/      # Shared + feature components
    contractor/    # Contractor-specific UI (ActiveBids, ProfileSettings, Verification)
    ui/            # shadcn/ui primitives
  contexts/        # AuthContext (Supabase session)
  integrations/    # Supabase client + generated types
supabase/
  migrations/      # Database schema migrations
```

## Database tables

| Table / View | Purpose |
|-------------|---------|
| `profiles` | Customer profiles (name, address, interests) |
| `contractors` | Contractor profiles (business name, expertise, license) |
| `user_metadata` | Shared user metadata (username, bio) |
| `trades` | Trade/business registry |
| `videos` | Video analysis records |
| `reviews` | Post-job ratings — quality, communication, cleanliness, generated overall score, optional public comment, and `private_feedback` (admin-only) |
| `visible_reviews` | View of `reviews` with `private_feedback` excluded — safe to expose to authenticated users |

## Review system

The `ReviewMediator` component (`src/components/ReviewMediator.tsx`) handles the full review lifecycle:

- **Form mode** — 5-step locked → form → submitting → success flow.
  The submit button (and aria state) are disabled unless `escrowStatus` is `'released'` or `'funds_released'`.
  Sub-ratings: **Quality**, **Communication**, **Cleanliness** (dot buttons 1–5 with animated colour-coded progress bars).
  Overall score is computed live as `ROUND((q+c+cl)/3, 2)` — matches the DB `GENERATED` column.
  **Private Feedback** field (amber dashed border, 🔐 Admin only badge) is sent to the `reviews` table but never returned by `visible_reviews`.

- **List mode** — aggregate hero score + animated summary bars + individual review cards with per-category chips.

- **Both mode** — tab switcher between form and list.

```tsx
<ReviewMediator
  contractorId="<uuid>"
  jobId="<uuid>"
  escrowStatus={job.escrow_status}   // unlocks at 'released' | 'funds_released'
  mode="both"
  onSuccess={(r) => console.log(r)}
/>
```

### Schema (migration 007)

`supabase/migrations/20260318000000_007_quality_rating_private_feedback.sql`

- Renames `rating_accuracy` → `rating_quality`; adds `rating_cleanliness`
- Rebuilds `GENERATED overall` from the three sub-ratings
- Adds `private_feedback TEXT` to `reviews`
- Creates `visible_reviews` view (excludes `private_feedback`; `SELECT` granted to `authenticated`)

## Deployment

Deployed via [Lovable](https://lovable.dev). Push to `main` and Lovable auto-deploys.
