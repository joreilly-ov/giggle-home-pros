# Claude Code Guide — KisX - Home Services Marketplace

## Repositories

- **Frontend (this repo):** `vaggab0nd/KisX`
- **Backend (Supabase edge functions & DB):** https://github.com/vaggab0nd/KisX-backend

## Architecture

- **React Router v6** for routing — all routes defined in `src/App.tsx`
- **Supabase** for auth, database, and edge functions — client at `src/integrations/supabase/client.ts`, types at `src/integrations/supabase/types.ts`
- **AuthContext** (`src/contexts/AuthContext.tsx`) exposes `user`, `session`, `loading`, `signOut`
- **PWA** — installable via browser "Add to Home Screen". Manifest and service worker managed by Lovable's deployment platform (no local `manifest.json` to maintain).
- **Capacitor** — native Android app scaffolded at `android/`. iOS not yet set up. Config at `capacitor.config.ts`.
- **App version** — single source of truth is `"version"` in `package.json`. Both `SplashScreen.tsx` and `Footer.tsx` import it directly — bump `package.json` and both update. Current: `1.0.2`.

### Mobile / PWA / Capacitor considerations

- All interactive elements need adequate tap targets (min 44×44px)
- Avoid hover-only affordances — use tap/focus states too
- Camera access for video recording must be requested gracefully — iOS requires HTTPS (satisfied in production)
- The video upload flow (`PostProject.tsx`) calls Cloud Run directly to avoid edge function payload/timeout limits
- **Capacitor dev mode:** `capacitor.config.ts` has a `server.url` pointing to `http://192.168.0.152:5173` (local WiFi dev). **Remove the `server` block before building a release APK/IPA** — otherwise the app tries to reach that local network.
- **Capacitor branding:** `android/` still uses `com.gigglehomepros.app` / "Giggle Home Pros" — needs updating to KisX before Play Store submission.
- **Push notifications:** implemented via Web Push API (`src/hooks/use-push-notifications.ts`). VAPID key fetched from Cloud Run (`/notifications/vapid-public-key`). iOS only works when installed as a PWA (not in Safari). Shown in `NotificationSettings` for both roles.

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
| `/contractor/profile/*` | ContractorProfile | Contractor dashboard — sub-routes below |
| `/contractor/profile` | → JobFeed | Default tab |
| `/contractor/profile/bids` | → ActiveBids | Bid history + pipeline KPIs |
| `/contractor/profile/reviews` | → ReviewMediator (list) | Contractor's review history |
| `/contractor/profile/settings` | → ProfileSettings + NotificationSettings | Profile and push notification settings |
| `/contractor/profile/verification` | → Verification | License and insurance details |
| `/contractor/connect/return` | ConnectReturn | Stripe Connect onboarding return |
| `/contractor/connect/refresh` | ConnectRefresh | Stripe Connect onboarding refresh |
| `/install` | Install | PWA install prompt page |
| `/ai-bidding-tools` | AIBiddingTools | AI bidding tools marketing page (fully built) |
| `/same-day-payments` | SameDayPayments | Same-day payments marketing page (fully built) |
| `/how-escrow-works` | HowEscrowWorks | Escrow explainer — placeholder, not yet built |
| `/about` | About | About page |
| `/contact` | Contact | Contact page |
| `/privacy` | Privacy | Privacy policy |
| `*` | NotFound | 404 catch-all |

## Key patterns

- ZIP code lookup uses the `zip-lookup` Supabase edge function
- Trade categories are a shared list used for both customer `interests` and contractor `expertise` (Plumbing, Electrical, Structural, Damp, Roofing, General, HVAC, Painting)
- Contractor sub-routes use React Router `<Routes>` inside `ContractorProfile.tsx`
- Customer onboarding sets `setup_complete` in the `user_metadata` table via Supabase
- Password reset: Supabase appends `#access_token=...&type=recovery` to the redirect URL; `ResetPassword.tsx` listens for the `PASSWORD_RECOVERY` auth event and calls `supabase.auth.updateUser({ password })`
- **SplashScreen** (`src/components/SplashScreen.tsx`) — shown on every app launch for 1.8s, fades out over 0.5s. Mounted in `App.tsx` before the router renders. Shows version from `package.json`.

## Bidding API (Cloud Run)

All job and bid operations go through the Cloud Run backend (`https://stable-gig-374485351183.europe-west1.run.app`). The typed client lives at `src/lib/api.ts`.

### Jobs & Bids

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

### RFP & Contractor Matching

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `POST` | `/jobs/:id/rfp` | Homeowner | Generates formal RFP document from job + clarification answers |
| `GET` | `/jobs/:id/contractors/matches` | Homeowner | AI-matched contractors via embedding; fallback to activity match |
| `POST` | `/me/contractor/embed-profile` | Contractor | Embeds contractor profile for AI matching |

### Stripe Connect

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `POST` | `/me/contractor/connect-onboard` | Contractor | Returns Stripe onboarding URL; body: `{ return_url, refresh_url }` |
| `GET` | `/me/contractor/connect-status` | Contractor | Returns `{ connected, charges_enabled, payouts_enabled, details_submitted, account_id }` |
| `GET` | `/escrow/config` | Homeowner | Returns `{ stripe_publishable_key }` for frontend Stripe init |

### Escrow

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `GET` | `/jobs/:id/escrow` | Both | Returns `{ job_escrow_status }` — values: `pending \| held \| funds_released \| refunded` |
| `POST` | `/jobs/:id/escrow/initiate` | Homeowner | Creates Stripe PaymentIntent; returns `{ client_secret, amount_pence }` |
| `POST` | `/jobs/:id/escrow/release` | Homeowner | Releases funds to contractor; body: `{ note? }` |
| `POST` | `/jobs/:id/escrow/refund` | Homeowner | Refunds to homeowner; body: `{ reason? }` |

### Q&A

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `GET` | `/jobs/:id/questions` | Both | Lists all questions for a job |
| `POST` | `/jobs/:id/questions` | Contractor | Body: `{ question }` |
| `PATCH` | `/jobs/:id/questions/:questionId` | Homeowner | Body: `{ answer }` |

### Milestones

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `GET` | `/jobs/:id/milestones` | Both | Lists milestones with photos |
| `POST` | `/jobs/:id/milestones` | Contractor | Body: `{ milestones: [{ title, description?, order_index }] }` |
| `POST` | `/jobs/:id/milestones/:milestoneId/photos` | Contractor | Body: `{ image_source, note? }`; `?analyse=true` runs AI on the photo |
| `PATCH` | `/jobs/:id/milestones/:milestoneId` | Homeowner | Body: `{ action: "approve" \| "reject" }` |

### Push Notifications

| Method | Path | Who can call | Notes |
|--------|------|-------------|-------|
| `GET` | `/notifications/vapid-public-key` | Both | Returns VAPID public key for Web Push subscription |
| `POST` | `/notifications/subscribe` | Both | Body: `{ endpoint, p256dh, auth_key }` |
| `DELETE` | `/notifications/subscribe` | Both | Body: `{ endpoint, p256dh, auth_key }` |

**Job status lifecycle:** `draft → open → awarded → in_progress → completed | cancelled`

**Frontend components:**
- `src/lib/api.ts` — typed API client (all auth headers handled here)
- `src/components/contractor/JobFeed.tsx` — browse open jobs, AI diagnosis display, Q&A, bid submission form
- `src/components/contractor/ActiveBids.tsx` — bid history, pipeline KPIs (open bids, win rate, pipeline £), inline milestones for accepted bids
- `src/components/customer/JobBids.tsx` — homeowner bid review (accept / decline)
- `src/components/customer/MyProjects.tsx` — lists jobs from `GET /jobs`, status actions, bids panel in sheet
- `src/pages/PostProject.tsx` — video analysis → clarifications → RFP review → contractor matching → publish
- `src/components/post-project/ClarificationsStep.tsx` — Q&A clarification step in PostProject flow
- `src/components/post-project/RfpReviewStep.tsx` — displays AI-generated RFP document before publishing
- `src/components/post-project/MatchedContractorsStep.tsx` — shows AI-matched contractors before final publish
- `src/components/escrow/EscrowStatusBanner.tsx` — displays current escrow state (pending/held/released/refunded)
- `src/components/escrow/EscrowPayment.tsx` — Stripe PaymentElement for homeowner to fund escrow
- `src/components/escrow/EscrowActions.tsx` — release / refund controls for homeowner
- `src/components/escrow/ContractorPayoutCard.tsx` — Stripe Connect payout status for contractor
- `src/components/milestones/MilestonesCard.tsx` — milestone management with photo upload and AI analysis
- `src/components/questions/JobQuestions.tsx` — Q&A thread, role-aware (contractor asks / homeowner answers)
- `src/components/photo-analyzer/TaskBreakdown.tsx` — AI task breakdown via `analyse-breakdown` edge function
- `src/components/photo-analyzer/AnalysisResults.tsx` — displays photo analysis output
- `src/components/photo-analyzer/PhotoGrid.tsx` — multi-photo grid for analysis
- `src/components/contractor/NotificationSettings.tsx` — Web Push opt-in/out, role-aware description
- `src/hooks/use-push-notifications.ts` — VAPID subscription lifecycle hook

## Supabase edge functions

All edge functions live in `supabase/functions/` (source of truth: https://github.com/vaggab0nd/KisX-backend).

| Function | Purpose |
|----------|---------|
| `zip-lookup` | Returns `{ city, state }` from a 5-digit ZIP via zippopotam.us |
| `analyse-photos` | Authenticated proxy — forwards photo data to external `ANALYSE_URL` |
| `analyse-video` | Authenticated proxy — **no longer called by the frontend**; `PostProject.tsx` calls Cloud Run directly to avoid payload/timeout limits |
| `analyse-breakdown` | AI task breakdown (Google Gemini Flash) — input: job description; output: ordered task list with difficulty and time estimates. Requires `LOVABLE_API_KEY` in edge function secrets. |

## Running the project

```sh
npm install        # or: bun install
npm run dev        # http://localhost:8080
npm run test       # Vitest (33 tests across api, ReviewMediator, auth routing)
npm run lint       # ESLint
npm run build      # Production build → dist/
```

**Capacitor (after build):**
```sh
npx cap sync android   # Copy dist/ into the Android project
npx cap open android   # Open in Android Studio
npx cap sync ios       # (iOS not yet set up)
npx cap open ios       # Opens ios/App/App.xcworkspace in Xcode
```

## Testing

Tests live in `src/test/`. Run with `npm run test`.

| File | What it covers |
|------|---------------|
| `api.test.ts` | Auth header injection/omission, URL construction, error handling, HTTP methods, request body serialisation |
| `ReviewMediator.test.tsx` | Escrow gate (all locked states, both unlock states), submit button state, validation, field presence, live overall score |
| `auth-routing.test.tsx` | Post-login redirects: contractor → `/contractor/profile`, complete profile → `/dashboard`, incomplete → `/profile`, `?next=` param, open-redirect guard |
| `example.test.ts` | Framework smoke test (placeholder) |

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
- **Capacitor config** (`capacitor.config.ts`) still has `appId: 'com.gigglehomepros.app'` and `appName: 'Giggle Home Pros'` — must be updated to KisX before Play Store / App Store submission
- **Capacitor dev server** — the `server.url` block points to a local WiFi address for live-reload development; remove it entirely before building a release APK or IPA
- **iOS Capacitor** not yet set up — requires a Mac with Xcode; run `npm install @capacitor/ios && npx cap add ios` to initialise
- **Push notifications on iOS** only work when the app is installed as a PWA from Safari, not from within the browser tab
