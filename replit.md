# @musekit/admin

Admin dashboard module for the MuseKit SaaS platform.

## Project Overview

This is the admin panel for MuseKit, built with Next.js 14 (Pages Router). It provides user management, metrics dashboards, audit logging, setup configuration, feature toggles, customer service tools, revenue analytics, and onboarding funnel tracking.

## Tech Stack

- **Framework**: Next.js 14.2.18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4.x
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth SSR**: @supabase/ssr (cookie-based session handling for API routes)
- **Payments**: Stripe (subscription lookups)

## Architecture

### Directory Structure

```
src/
  components/ui/        # Reusable UI components (Button, Card, Table, etc.)
  hooks/                # React hooks (useAdmin, useSettings)
  layout/               # Layout components (AdminSidebar, SetupLayout, etc.)
  lib/                  # Utilities and Supabase client
  pages/                # Next.js pages
    api/admin/          # Server-side API routes (Supabase admin operations)
      setup/            # Setup-related API routes (settings, toggles, email, api-keys)
    setup/              # Setup Dashboard sub-pages (13 pages)
    users/              # User management pages (list + detail with health scores + team mgmt)
    index.tsx           # Overview dashboard with charts
    metrics.tsx         # KPI metrics dashboard
    audit-log.tsx       # Audit log viewer
    revenue.tsx         # Revenue dashboard with MRR/ARR charts
    feature-toggles.tsx # Feature toggle management
    customer-service.tsx # Customer service + support tickets
    onboarding.tsx      # Onboarding funnel analytics
    settings.tsx        # System settings
  styles/               # Global CSS with Tailwind
  types/                # TypeScript type definitions
  index.ts              # Package exports
docs/                   # Sprint plans and documentation
```

### Key Patterns

- **API Routes**: All Supabase admin (service role) operations go through `/api/admin/*` API routes to keep the service role key server-side only
- **Admin Auth**: All API routes use `verifyAdmin()` from `src/lib/admin-auth.ts` — supports both Bearer token (programmatic) and Supabase SSR cookies (browser) via `@supabase/ssr`
- **Client Pages**: Pages fetch data from API routes using `fetch()`
- **UI Components**: Built from scratch using Tailwind CSS, following shadcn/ui patterns
- **Setup Settings**: Uses `brand_settings` table with `key/value` pairs; `useSettings(prefix)` hook manages load/save per prefix
- **Sidebar**: Grouped navigation with sections (Main, Configuration, Tools, System)
- **Health Scores**: Client-side computed from login recency, subscription, activity, account age, profile completeness

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `STRIPE_SECRET_KEY` - Stripe secret key (for subscription lookups)

### Supabase Tables Used

- `profiles` - User profiles (read/write)
- `organizations` - Organization data (read)
- `team_members` - Team membership (read/write)
- `team_invites` - Pending team invitations (read/write)
- `subscriptions` - Subscription status (read)
- `audit_logs` - Audit log entries (read/write)
- `notifications` - Notification data (read)
- `feedback` - User feedback (read)
- `waitlist` - Waitlist entries (read)
- `brand_settings` - Key/value brand & setup settings (read/write)
- `feature_toggles` - Feature toggle flags (read/write)
- `email_templates` - Email templates (read/write)
- `api_keys` - API key management (read/write)
- `support_tickets` - Customer support tickets (read/write)

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

### Part 2 (Session 11) - COMPLETE
- Sidebar updated with grouped sections (Main, Configuration, Tools, System)
- Setup Dashboard with 11 sub-pages (branding, content, pages, pricing, social, features, api-keys, email, ai, security, passivepost)
- Feature Toggles, Customer Service, Onboarding Funnel pages
- API routes with verifyAdmin security

### Part 3 — Gap Closure (Session 12) - COMPLETE
All 11 gaps closed across 6 sprints:

- **Gap 1**: Overview dashboard charts (MRR trend AreaChart, user growth LineChart, churn BarChart)
- **Gap 2**: User health scores (color-coded in both list and detail views)
- **Gap 3**: Team management UI (invite, change roles, remove members, revoke invites)
- **Gap 4**: Revenue dashboard (MRR/ARR/ARPU cards, trend charts, transaction table, CSV export)
- **Gap 5**: Support ticket admin (tabbed customer service with ticket CRUD)
- **Gap 6**: Testimonials CRUD setup page (add/edit/delete/reorder/approve/feature)
- **Gap 7**: API keys expanded to 52 platforms across 12 categories with search
- **Gap 8**: CSS dashboard (interactive variable editor, live preview, light/dark toggle, export)
- **Gap 9**: PassivePost expanded to 5-tab config (platforms, scheduling, templates, AI prompts, analytics)
- **Gap 10**: CAPTCHA admin config (provider selector, keys, per-page toggles, test button)
- **Gap 11**: Watermark settings in branding page (toggle, text, preview)

### Security Fix (Session 13)
- Fixed critical `verifyAdmin()` cookie auth bug — replaced hardcoded `sb-access-token` cookie name with `@supabase/ssr`'s `createServerClient` which handles chunked Supabase auth cookies automatically
- Deduplicated admin role check into single code path
- Removed obsolete `extractCookieValue` helper
