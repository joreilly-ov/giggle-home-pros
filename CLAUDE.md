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

## Things to watch out for

- The `profiles` table uses `id` as the FK to `auth.users` (not `user_id`)
- The `contractors` table uses `user_id` as the FK to `auth.users`
- RLS is enabled on `contractors` — users can only read/write their own row
- Don't redirect to `/profile` for contractors — send them to `/contractor/profile`
