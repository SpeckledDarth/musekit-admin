# @musekit/admin

Admin dashboard module for the MuseKit SaaS platform.

## Project Overview

This is the admin panel for MuseKit, built with Next.js 14 (Pages Router). It provides user management, metrics dashboards, audit logging, and system oversight capabilities.

## Tech Stack

- **Framework**: Next.js 14.2.18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4.x
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe (subscription lookups)

## Architecture

### Directory Structure

```
src/
  app/                  # Next.js app directory (unused, using pages router)
  components/ui/        # Reusable UI components (Button, Card, Table, etc.)
  hooks/                # React hooks (useAdmin)
  layout/               # Admin layout components (Sidebar, Header, Breadcrumb)
  lib/                  # Utilities and Supabase client
  pages/                # Next.js pages
    api/admin/          # Server-side API routes (Supabase admin operations)
    users/              # User management pages
    index.tsx           # Overview dashboard
    metrics.tsx         # KPI metrics dashboard
    audit-log.tsx       # Audit log viewer
    settings.tsx        # Settings (placeholder for Session 11)
  styles/               # Global CSS with Tailwind
  types/                # TypeScript type definitions
  index.ts              # Package exports
```

### Key Patterns

- **API Routes**: All Supabase admin (service role) operations go through `/api/admin/*` API routes to keep the service role key server-side only
- **Client Pages**: Pages fetch data from API routes using `fetch()`
- **UI Components**: Built from scratch using Tailwind CSS, following shadcn/ui patterns

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `STRIPE_SECRET_KEY` - Stripe secret key (for subscription lookups)

### Supabase Tables Used

- `profiles` - User profiles (read/write)
- `organizations` - Organization data (read)
- `team_members` - Team membership (read)
- `subscriptions` - Subscription status (read)
- `audit_logs` - Audit log entries (read/write)
- `notifications` - Notification data (read)
- `feedback` - User feedback (read)
- `waitlist` - Waitlist entries (read)

## Running

```bash
npm run dev    # Start dev server on port 5000
npm run build  # Production build
npm start      # Start production server
```

## Build Status

### Part 1 (Session 10) - COMPLETE
- Admin Layout (sidebar, header, breadcrumb)
- Overview page with metrics cards, quick actions, recent activity
- User Management (list, detail, team members, admin notes, impersonation)
- Metrics Dashboard (10 KPIs, NPS, charts, alerts, email report)
- Audit Log Viewer (filterable, searchable, expandable rows)

### Part 2 (Session 11) - NOT YET BUILT
- Setup Dashboard
- Remaining admin features
