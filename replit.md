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
- `organization_members` - Team membership (read/write)
- `invitations` - Pending team invitations (read/write)
- `muse_product_subscriptions` - Subscription status (read)
- `audit_logs` - Audit log entries (read/write)
- `notifications` - Notification data (read)
- `feedback` - User feedback (read)
- `waitlist_entries` - Waitlist entries (read)
- `settings` - Key/value settings including feature toggles as `feature.*` prefix (read/write)
- `email_templates` - Email templates (read/write)
- `config_secrets` - API key management with `key_name`/`encrypted_value` columns (read/write)
- `tickets` - Customer support tickets (read/write)
- `ticket_comments` - Ticket comments/admin responses (read/write)
- `affiliate_testimonials` - Customer testimonials (read/write)

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

### Database Alignment (Session 14)
Fixed all table name and column mismatches between codebase and real Supabase schema:
- `brand_settings` → `settings` (removed `updated_at` from upserts)
- `team_members` → `organization_members`
- `team_invites` → `invitations` (added `token`, `expires_at`)
- `subscriptions` → `muse_product_subscriptions`
- `support_tickets` → `tickets` (`message` → `description`, added `ticket_number`, `category`)
- `waitlist` → `waitlist_entries`
- `api_keys` → `config_secrets` (`name` → `key_name`, `value` → `encrypted_value`)
- `feature_toggles` → stored in `settings` table as `feature.*` key/value pairs
- Testimonials switched from `useSettings` JSON to `affiliate_testimonials` table
- Admin responses now saved to `ticket_comments` table
- Email templates aligned with real column names, added Create/Delete handlers
- Reusable CSV export utility added (`src/lib/csv-export.ts`), wired to Users, Tickets, Revenue

### Prompt 09 Sprint 1: Foundations (Session 15)
Infrastructure for the functional layer — all reusable components, hooks, and utilities:
- **Sonner toasts**: Installed `sonner`, added `<Toaster />` to `_app.tsx` for app-wide toast notifications
- **ConfirmDialog** (`src/components/ui/ConfirmDialog.tsx`): Reusable modal for destructive confirmations with `destructive` variant
- **EmptyState** (`src/components/ui/EmptyState.tsx`): Reusable empty-state component with icon, title, description, CTA
- **ImageUpload** (`src/components/ui/ImageUpload.tsx`): Supabase Storage drag-drop uploader with progress, preview, 5MB limit
- **useSortable** (`src/hooks/useSortable.ts`): Generic column sorting hook (asc → desc → none toggle)
- **useDebounce** (`src/hooks/useDebounce.ts`): Value debouncing hook (300ms default)
- **useUnsavedChanges** (`src/hooks/useUnsavedChanges.ts`): beforeunload guard for dirty forms
- **useListView** (`src/hooks/useListView.ts`): URL-persisted search/filter/sort/pagination via router query params
- **logAuditEvent** (`src/lib/audit-log.ts`): Server-side audit log helper for all CRUD mutations
- **App Router Fix A**: `setup/index.tsx` and `users/[id].tsx` migrated from `next/router` to `next/navigation`
- All new components/hooks exported from `src/index.ts`

### Prompt 09 Sprint 2: Page Upgrades (Session 16)
Applied Standards B (list-view), C (CRUD + audit), and E (UX) to 5 pages + Users detail:
- **Users list** (`src/pages/users/index.tsx`): Sortable columns (7), debounced search, 25-row pagination, checkbox + bulk actions (suspend/delete/export CSV), clickable rows, Invite User modal, EmptyState, row count in title, relative timestamps, toast notifications, ConfirmDialog for destructive actions
- **Users detail** (`src/pages/users/[id].tsx`): Inline profile editing (name/email/role/status) with save/cancel, Suspend + Delete user with ConfirmDialog, unsaved changes guard, form validation, breadcrumbs, toasts, EmptyState for empty tabs, relative timestamps with tooltips, tab counts
- **Users API** (`src/pages/api/admin/users/[id].ts`): Added PUT (update profile) + DELETE (delete user) handlers with audit logging via logAuditEvent
- **Users list API** (`src/pages/api/admin/users.ts`): Changed PAGE_SIZE to 25, added POST actions for invite/bulk_suspend/bulk_delete with audit logging
- **Audit Log** (`src/pages/audit-log.tsx`): Sortable column headers (5 columns), Export CSV button, row count in title, relative timestamps with tooltips
- **Revenue** (`src/pages/revenue.tsx`): Sortable transaction table, plan + status filters, clickable rows with detail modal, 25-row pagination, checkbox + bulk export, row count, relative timestamps
- **Feature Toggles** (`src/pages/feature-toggles.tsx`): Converted to table layout, sortable columns, category filter, edit modal, delete with ConfirmDialog, bulk enable/disable/delete, CSV export, Add Toggle modal, row count, toasts
- **Feature Toggles API** (`src/pages/api/admin/setup/feature-toggles.ts`): Added PATCH (edit) + DELETE handlers with audit logging
- **Branding** (`src/pages/setup/branding.tsx`): ImageUpload for logo + favicon (drag-drop, 5MB limit), unsaved changes guard, toast notifications on save
