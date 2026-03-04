# @musekit/admin

Admin dashboard module for the MuseKit SaaS platform.

## Project Overview

This is the admin panel for MuseKit, built with Next.js 14 (Pages Router). It provides user management, metrics dashboards, audit logging, setup configuration, feature toggles, customer service tools, and onboarding analytics.

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
  components/ui/        # Reusable UI components (Button, Card, Table, etc.)
  hooks/                # React hooks (useAdmin, useSettings)
  layout/               # Layout components (AdminSidebar, SetupLayout, etc.)
  lib/                  # Utilities and Supabase client
  pages/                # Next.js pages
    api/admin/          # Server-side API routes (Supabase admin operations)
      setup/            # Setup-related API routes (settings, toggles, email, api-keys)
    setup/              # Setup Dashboard sub-pages (11 pages)
    users/              # User management pages
    index.tsx           # Overview dashboard
    metrics.tsx         # KPI metrics dashboard
    audit-log.tsx       # Audit log viewer
    feature-toggles.tsx # Feature toggle management
    customer-service.tsx # Customer service tools
    onboarding.tsx      # Onboarding funnel analytics
    settings.tsx        # System settings
  styles/               # Global CSS with Tailwind
  types/                # TypeScript type definitions
  index.ts              # Package exports
```

### Key Patterns

- **API Routes**: All Supabase admin (service role) operations go through `/api/admin/*` API routes to keep the service role key server-side only
- **Client Pages**: Pages fetch data from API routes using `fetch()`
- **UI Components**: Built from scratch using Tailwind CSS, following shadcn/ui patterns
- **Setup Settings**: Uses `brand_settings` table with `key/value` pairs; `useSettings(prefix)` hook manages load/save per prefix
- **Sidebar**: Grouped navigation with sections (Main, Configuration, Tools, System)

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
- `brand_settings` - Key/value brand & setup settings (read/write)
- `feature_toggles` - Feature toggle flags (read/write)
- `email_templates` - Email templates (read/write)
- `api_keys` - API key management (read/write)

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
- Setup Dashboard with 11 sub-pages:
  - Branding (colors, logo, hero, header, footer)
  - Content (section ordering, visibility, bg colors)
  - Pages (about, contact, legal, custom pages)
  - Pricing (plans with Stripe price IDs)
  - Social Links (8 platforms)
  - Features & Integrations (auth providers, AI, webhooks, compliance)
  - API Keys (grouped, reveal/hide, validation)
  - Email Templates (editor with preview and test send)
  - AI / Support (provider config, help widget)
  - Security (SSO/SAML, MFA, password policies)
  - PassivePost (social posting defaults)
- Feature Toggles page (toggle on/off, search, add new)
- Customer Service page (user lookup, subscription history, admin notes)
- Onboarding Funnel page (4-stage funnel visualization)
- API routes: settings, feature-toggles, email-templates, api-keys, customer-service, onboarding
