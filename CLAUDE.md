# Claude Code Guide — Giggle Home Pros

## Architecture

- **React Router v6** for routing — all routes defined in `src/App.tsx`
- **Supabase** for auth, database, and edge functions — client at `src/integrations/supabase/client.ts`, types at `src/integrations/supabase/types.ts`
- **AuthContext** (`src/contexts/AuthContext.tsx`) exposes `user`, `session`, `loading`, `signOut`

## User role detection

There is no explicit role field. Determine user type by querying:
- **Contractor:** has a row in `contractors` table where `user_id = user.id`
- **Customer:** has a row in `profiles` table where `id = user.id`

Always check contractor first (see `Auth.tsx` redirect logic).

## Routing conventions

| Path | Page |
|------|------|
| `/profile` | Customer profile (address, interests) |
| `/dashboard` | Customer dashboard |
| `/contractor/profile/*` | Contractor dashboard (bids, settings, verification) |
| `/contractor/signup` | Contractor onboarding (2-step) |
| `/auth` | Shared sign-in / sign-up |

## Key patterns

- ZIP code lookup uses the `zip-lookup` Supabase edge function
- Trade categories are a shared list used for both customer `interests` and contractor `expertise`
- Contractor sub-routes use React Router nested routing with `useRoutes` or `<Routes>` inside `ContractorProfile.tsx`

## Running the project

```sh
npm install
npm run dev     # http://localhost:8080
npm run test    # Vitest
npm run lint    # ESLint
```

## Database migrations

Migrations live in `supabase/migrations/`. When changing the schema, add a new `.sql` file — do not edit existing migrations.

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
