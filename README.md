# KisX - Home Services Marketplace

**Version: 1.0.2** | **Live app:** https://kisx.lovable.app

A marketplace connecting homeowners with trusted contractors for home repair and improvement projects.
**Live app:** <https://kisx.lovable.app>

## What it does

- Homeowners record a short video of their home issue → AI analysis identifies the trade, urgency, and estimated cost → job published to contractors
- Contractors browse open jobs, read AI summaries (urgency, materials, location), generate task breakdowns, ask clarifying questions, and submit priced bids
- Homeowner reviews bids, accepts one (all others auto-rejected), tracks work through milestones to completion
- Escrow-based payments powered by Stripe Connect — funds held until homeowner approves, contractor paid same day
- Post-job tradesman rating system (Quality · Communication · Cleanliness) gated on escrow release, with admin-only private feedback
- Push notifications via Web Push API — contractors alerted to new jobs, homeowners alerted to incoming bids
- **Installable as a native app** — Android via Capacitor (Play Store ready), iOS Capacitor in progress; also installable as a PWA from any browser

## User roles

**Customers** (`/profile`, `/dashboard`)

- Create an account, set location and trade interests
- Record a video → AI analysis → clarification Q&A → RFP document → matched contractors → publish for bids
- Review contractor bids (accept / decline), fund escrow, track milestones, release payment on completion

**Contractors** (`/contractor/profile/*`)

- Onboard via `/contractor/signup` (business info + expertise)
- Browse open jobs on the Job Feed, submit priced bids with scope-of-work notes
- Track bid status, win rate, and pipeline value in the Active Bids dashboard
- Manage profile settings and license/insurance verification

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **AI analysis:** Cloud Run endpoint (KisX backend) — called directly from the browser for video, via edge function proxy for photos
- **Routing:** React Router v6
- **State:** TanStack Query
- **PWA:** Configured in this repo with `vite-plugin-pwa` (`vite.config.ts`) and `public/push-sw.js`; deployed via Lovable

## Local development

```sh
git clone <repo-url>
cd KisX
npm install
npm run dev        # http://localhost:8080
```

This repo standardizes on npm; keep `package-lock.json` as the single lockfile and avoid committing Bun lockfiles.

Requires Node.js 18+. Connects to a hosted Supabase instance — no local Supabase setup needed for frontend work.

## Key scripts

```sh
npm run dev        # Start dev server (http://localhost:8080)
npm run build      # Production build → dist/
npm run test       # Vitest unit tests
npm run lint       # ESLint
```

**Capacitor (native app):**
```sh
npm run build
npx cap sync android   # Sync dist/ into Android project
npx cap open android   # Open in Android Studio
npx cap open ios       # Open ios/App/App.xcworkspace in Xcode (Mac only)
```

## Project structure

```text
src/
  pages/                   # Route-level components
  components/
    contractor/            # JobFeed, ActiveBids, ProfileSettings, Verification, NotificationSettings
    customer/              # MyProjects, JobBids
    escrow/                # EscrowStatusBanner, EscrowPayment, EscrowActions, ContractorPayoutCard
    milestones/            # MilestonesCard (photo upload, AI analysis, approve/reject)
    questions/             # JobQuestions (contractor asks / homeowner answers)
    post-project/          # ClarificationsStep, RfpReviewStep, MatchedContractorsStep
    photo-analyzer/        # AnalysisResults, PhotoGrid, TaskBreakdown
    ui/                    # shadcn/ui primitives
  lib/
    api.ts                 # Typed API client for all Cloud Run endpoints
  hooks/
    use-push-notifications.ts  # Web Push VAPID subscription lifecycle
  contexts/                # AuthContext (Supabase session)
  integrations/            # Supabase client + generated types
  test/                    # Vitest test files
android/                   # Capacitor Android project
supabase/
  migrations/              # Database schema migrations
  functions/               # Edge function source (zip-lookup, analyse-*)
```

## Current architecture note

- Cloud Run `jobs` APIs are the source of truth for bidding and status transitions.
- The frontend still writes/reads some legacy `videos` rows for analysis history and compatibility paths.
- Ongoing refactor target: remove remaining `videos` dependencies from contractor/job flows.

## Database tables

| Table / View | Purpose |
|-------------|---------|
| `profiles` | Customer profiles (`id` FK → auth.users, email, interests) |
| `contractors` | Contractor profiles (`user_id` FK → auth.users, business name, expertise, license, insurance) |
| `user_metadata` | Shared user metadata (username, bio, setup_complete) |
| `reviews` | Post-job ratings — quality, communication, cleanliness, generated overall, public comment, `private_feedback` (admin-only) |
| `visible_reviews` | View of `reviews` with `private_feedback` excluded — safe to expose to authenticated users |

## Testing

33 tests across 3 files. Run with `npm run test`.

| Suite | Coverage |
|-------|---------|
| `api.test.ts` | Auth headers, URL construction, error handling, HTTP methods, request body serialisation |
| `ReviewMediator.test.tsx` | Escrow gate (all 5 locked states + 2 unlock values), validation, field presence, live score |
| `auth-routing.test.tsx` | Post-login redirects, `?next=` param, open-redirect guard |

## Review system

The `ReviewMediator` component (`src/components/ReviewMediator.tsx`) handles the full review lifecycle:

- **Form mode** — locked until `escrowStatus` is `'released'` or `'funds_released'`.
  Sub-ratings: **Quality**, **Communication**, **Cleanliness** (dot buttons 1–5 with animated colour-coded bars).
  Overall score computed live as `ROUND((q+c+cl)/3, 2)` — matches the DB `GENERATED` column.
  **Private Feedback** field (🔐 Admin only) stored in `reviews` but never returned by `visible_reviews`.

- **List mode** — aggregate hero score + animated summary bars + individual review cards.

- **Both mode** — tab switcher between form and list.

## Deployment

Deployed via [Lovable](https://lovable.dev). Push to `main` triggers auto-deploy.

PWA manifest and service worker are injected by Lovable at build time — no local files to maintain.

**Android release:** build the Capacitor project in Android Studio → sign APK → upload to Play Store.
Before release: remove `server.url` from `capacitor.config.ts`, update `appId` to KisX package name, and update `strings.xml`.
PWA behavior is configured in `vite.config.ts` via `vite-plugin-pwa`, and web push notifications use `public/push-sw.js`. Lovable still handles deployment and hosting.
