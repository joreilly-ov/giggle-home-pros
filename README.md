# Giggle Home Pros

A marketplace connecting homeowners with trusted contractors for home repair and improvement projects.

**Live app:** https://giggle-home-pros.lovable.app

## What it does

- Homeowners post projects and browse vetted contractors
- Contractors sign up, build a profile, and bid on jobs
- AI-powered photo and video analysis to help diagnose home repair needs
- Escrow-based payments with same-day payout for contractors

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

| Table | Purpose |
|-------|---------|
| `profiles` | Customer profiles (name, address, interests) |
| `contractors` | Contractor profiles (business name, expertise, license) |
| `user_metadata` | Shared user metadata (username, bio) |
| `trades` | Trade/business registry |
| `videos` | Video analysis records |

## Deployment

Deployed via [Lovable](https://lovable.dev). Push to `main` and Lovable auto-deploys.
