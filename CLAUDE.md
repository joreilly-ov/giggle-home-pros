# Claude Code Guide — KisX - Home Services Marketplace

## Repositories

- **Frontend (this repo):** `vaggab0nd/KisX`
- **Backend (Supabase edge functions & DB):** https://github.com/vaggab0nd/KisX-backend

## Architecture

- **React Router v6** for routing — all routes defined in `src/App.tsx`
- **Supabase** for auth, database, and edge functions — client at `src/integrations/supabase/client.ts`, types at `src/integrations/supabase/types.ts`
- **AuthContext** (`src/contexts/AuthContext.tsx`) exposes `user`, `session`, `loading`, `signOut`
- **PWA** — the app is installable on iOS and Android home screens. PWA config is present in this repo via `vite-plugin-pwa` in `vite.config.ts`, and push notifications use `public/push-sw.js`. Lovable manages deployment/hosting.

### Mobile / PWA considerations

Since users install and run this on mobile home screens, keep these in mind when building UI:
- All interactive elements need adequate tap targets (min 44×44px)
- Avoid hover-only affordances — use tap/focus states too
- Camera access (video recording for project posting) must be requested gracefully — some browsers on iOS require HTTPS (satisfied in production)
- The video upload flow (`PostProject.tsx`) calls the Cloud Run endpoint directly (`https://stable-gig-374485351183.europe-west1.run.app/analyse`) to avoid edge function payload and timeout limits

## User role detection

There is no explicit role field. Determine user type by querying:
- **Contractor:** has a row in `contractors` table where `user_id = user.id`
- **Customer:** has a row in `profiles` table where `id = user.id`

Always check contractor first (see `Auth.tsx` redirect logic).

## Routing conventions

| Path | Page | Notes |
|------|------|-------|
| `/` | Index | Landing page (Hero, HowItWorks, Features, CTA) |
| `/auth` | Auth | Shared sign-in / sign-up / forgot-password |
| `/reset-password` | ResetPassword | Password reset via email link (Supabase recovery token) |
| `/setup` | Setup | Customer onboarding (2-step: profile info + trade interests) |
| `/profile` | Profile | Customer profile (address, interests) |
| `/dashboard/*` | Dashboard | Customer dashboard (nested: MyProjects) |
| `/post-project` | PostProject | Customer video-based project posting |
| `/photo-analyzer` | TradePhotoAnalyzer | Photo-based home issue analysis |
| `/video-analyzer` | VideoAnalyzer | Video-based home issue analysis |
| `/browse-contractors` | BrowseContractors | Browse & filter contractors with ratings |
| `/contractor/signup` | ContractorOnboarding | Contractor onboarding (2-step) |
| `/contractor-signup` | ContractorSignUp | Legacy contractor signup path |
| `/contractor/profile/*` | ContractorProfile | Contractor dashboard (job feed, bids, reviews, settings, verification) |
| `/ai-bidding-tools` | AIBiddingTools | AI bidding tools marketing page |
| `/same-day-payments` | SameDayPayments | Same-day payments marketing page |
| `/how-escrow-works` | HowEscrowWorks | Escrow explainer (placeholder — not built yet) |
| `/about` | About | About page |
| `/contact` | Contact | Contact page |
| `/privacy` | Privacy | Privacy policy |
| `*` | NotFound | 404 catch-all |

## Key patterns

- ZIP code lookup uses the `zip-lookup` Supabase edge function
- Trade categories are a shared list used for both customer `interests` and contractor `expertise` (Plumbing, Electrical, Structural, Damp, Roofing, General, HVAC, Painting)
- Contractor sub-routes use React Router nested routing with `useRoutes` or `<Routes>` inside `ContractorProfile.tsx`
- Customer onboarding sets `setup_complete` in the `user_metadata` table via Supabase
- Password reset: Supabase appends `#access_token=...&type=recovery` to the redirect URL; `ResetPassword.tsx` listens for the `PASSWORD_RECOVERY` auth event and calls `supabase.auth.updateUser({ password })`
- Jobs/bids lifecycle is centered on the Cloud Run jobs API (`src/lib/api.ts`), while some legacy compatibility paths still read/write `videos`

## Bidding API (Cloud Run)

All job and bid operations go through the Cloud Run backend (`https://stable-gig-374485351183.europe-west1.run.app`). The typed client lives at `src/lib/api.ts`.

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `POST` | `/jobs` | Homeowner | Creates a draft job; body: `{ analysis_result }` |
| `GET` | `/jobs` | Both | Homeowners see all their jobs; contractors see only `open` ones |
| `GET` | `/jobs/:id` | Both | Owner sees any status; contractor sees only `open` |
| `PATCH` | `/jobs/:id` | Homeowner | Body: `{ status }` — server enforces valid transitions |
| `POST` | `/jobs/:id/bids` | Contractor | Body: `{ amount_pence, note }` |
| `GET` | `/jobs/:id/bids` | Both | Owner sees all bids + contractor info; contractor sees only their own |
| `PATCH` | `/jobs/:id/bids/:bidId` | Homeowner | Body: `{ action: "accept" \| "reject" }` — accept atomically rejects all others |
| `GET` | `/me/bids` | Contractor | All their bids across jobs, includes `job` nested |

**Job status lifecycle:** `draft → open → awarded → in_progress → completed | cancelled`

**Frontend components:**
- `src/lib/api.ts` — typed API client (all auth headers handled here)
- `src/components/contractor/JobFeed.tsx` — browse open jobs + submit bid form
- `src/components/customer/JobBids.tsx` — homeowner bid review (accept / decline)
- `src/pages/PostProject.tsx` — after video analysis, "Post for Bids" creates + publishes the job
- `src/components/customer/MyProjects.tsx` — lists jobs from `GET /jobs`, status actions, bids panel in sheet
- `src/components/contractor/ActiveBids.tsx` — contractor's bid history from `GET /me/bids`

## Supabase edge functions

All edge functions live in `supabase/functions/` (source of truth: https://github.com/vaggab0nd/stable-gig).

| Function | Purpose |
|----------|---------|
| `zip-lookup` | Returns `{ city, state }` from a 5-digit ZIP via zippopotam.us |
| `analyse-photos` | Authenticated proxy — forwards photo data to external `ANALYSE_URL` |
| `analyse-video` | Authenticated proxy — **no longer called by the frontend**; `PostProject.tsx` calls Cloud Run directly to avoid payload/timeout limits |
| `analyse-breakdown` | AI task breakdown (Google Gemini Flash) — input: job description; output: ordered task list with difficulty and time estimates |

## Running the project

```sh
npm install
npm run dev     # http://localhost:8080
npm run test    # Vitest
npm run lint    # ESLint
```

## Database schema

| Table / View | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (FK → auth.users), `email`, `interests[]` | `id` not `user_id` |
| `contractors` | `user_id` (FK → auth.users), `business_name`, `postcode`, `phone`, `expertise[]`, `license_number`, `insurance_details` | RLS enabled — users can only read/write their own row |
| `user_metadata` | `user_id`, `setup_complete`, `username`, `bio`, `trade_interests` | Extra customer fields |
| `reviews` | `contractor_id`, `job_id`, `rating_quality`, `rating_communication`, `rating_cleanliness`, `overall` (GENERATED), `comment`, `private_feedback` | Never include `overall` in INSERT payloads |
| `visible_reviews` | View of `reviews` excluding `private_feedback` | SELECT granted to `authenticated` |

## Database migrations

Migrations live in `supabase/migrations/`. When changing the schema, add a new `.sql` file — do not edit existing migrations.

| File | Purpose |
|------|---------|
| `20260311144019_ce319bdd-…` | Add `email` & `interests` columns to `profiles` |
| `20260316152627_2e1d4d85-…` | Create `contractors` table with RLS policies |
| `20260316153130_40d2a757-…` | Add `license_number`, `insurance_details`, `updated_at` to `contractors`; add trigger |
| `20260316170000_security-fixes.sql` | Enable RLS on `profiles` with user-level policies |
| `20260318000000_007_quality_rating_private_feedback.sql` | `rating_accuracy` → `rating_quality`; add `rating_cleanliness`; rebuild `GENERATED overall`; add `private_feedback TEXT`; create `visible_reviews` view |
| `20260319161910_46d50244-…` | Allow authenticated users to browse contractors publicly |

## Review system

`src/components/ReviewMediator.tsx` — self-contained React/TSX component.

**Props:**

| Prop | Type | Notes |
|------|------|-------|
| `contractorId` | `string` | UUID of the contractor being reviewed |
| `jobId` | `string?` | UUID of the completed job (sent in the insert) |
| `escrowStatus` | `string?` | Form only unlocks when value is `'released'` or `'funds_released'` |
| `mode` | `'form' \| 'list' \| 'both'` | Default: `'both'` |
| `onSuccess` | `(r) => void` | Called with the inserted row on success |

**Database writes to:** `reviews` table (Supabase insert via client)
**Database reads from:** `visible_reviews` view (excludes `private_feedback`)

**Private feedback:** sent in the insert payload, never returned by `visible_reviews`.
Admins read it directly from `reviews` via service role.

**Overall score:** computed live as `ROUND((quality + communication + cleanliness) / 3, 2)` — matches the `GENERATED` column in the DB.

**Escrow gate:** three layers — `disabled` prop on `<Button>`, `aria-disabled`, and `title` tooltip. The form shows a `<LockedOverlay>` when escrow is not released.

**Schema migration:** `supabase/migrations/20260318000000_007_quality_rating_private_feedback.sql`
- `rating_accuracy` → `rating_quality`; adds `rating_cleanliness`
- Rebuilds `GENERATED overall` column
- Adds `private_feedback TEXT`
- Creates `visible_reviews` view with `SELECT` granted to `authenticated`

## Things to watch out for

- The `profiles` table uses `id` as the FK to `auth.users` (not `user_id`)
- The `contractors` table uses `user_id` as the FK to `auth.users`
- RLS is enabled on `contractors` — users can only read/write their own row
- Don't redirect to `/profile` for contractors — send them to `/contractor/profile`
- `reviews` contains `private_feedback` — never expose this to the tradesman; always query `visible_reviews` on the client
- The `overall` column in `reviews` is `GENERATED ALWAYS` — do not include it in INSERT payloads
- `/how-escrow-works` is a placeholder and not yet implemented
- `analyse-breakdown` uses a Lovable/Gemini API key (`LOVABLE_API_KEY`) — must be set in edge function secrets
- The Supabase `videos` table still exists but `MyProjects.tsx` no longer queries it — the customer dashboard now fetches jobs from `GET /jobs` (Cloud Run). The table is effectively superseded by the jobs API for project listing.
- `MyProjects.tsx` uses `api.jobs.get(id)` to re-fetch a single job after status transitions — the job must exist in the Cloud Run jobs table, not just in `videos`
