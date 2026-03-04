# @musekit/admin Module

## Description

The admin dashboard module for the MuseKit SaaS platform. This is the largest module in the system, providing comprehensive administrative capabilities including user management, metrics dashboards, audit logging, and system configuration.

## Built Features (Session 10 - Part 1)

### Admin Layout (`src/layout/`)
- **AdminSidebar** - Collapsible sidebar with navigation sections (Overview, Users, Metrics, Audit Log, Settings)
- **AdminHeader** - Search bar, notification bell, user menu with avatar
- **AdminLayout** - Wrapper component combining sidebar + header + content area
- **Breadcrumb** - Dynamic breadcrumb navigation based on current route

### Overview Page (`src/pages/index.tsx`)
- High-level metrics cards (Total Users, Active Subscriptions, MRR, Active Sessions)
- Quick action cards (Manage Users, View Audit Logs, Settings)
- Recent activity feed from audit_logs table

### User Management (`src/pages/users/`)
- **UserList** (`index.tsx`) - Table with search, filter by role/status, pagination (20 per page)
- **UserDetail** (`[id].tsx`) - Profile info, subscription status, activity timeline
- **TeamMembers** - Org members view with role display (within UserDetail tabs)
- **AdminNotes** - Notes system for customer service tracking per user (within UserDetail tabs)
- **UserImpersonation** - Impersonate user with 30-minute session countdown and audit logging

### Metrics Dashboard (`src/pages/metrics.tsx`)
- 10 KPI cards: Total Users, New Users (30d), Active Subscriptions, MRR, ARPU, LTV, Churn Rate, Conversion Rate, Feedback Count, Waitlist Count
- NPS Score card with color-coded Net Promoter Score (green >= 70, yellow >= 50, red < 50)
- User Growth line chart (12-month view)
- Revenue Growth line chart (12-month view)
- Configurable alert thresholds for churn rate and user growth
- "Email Report" button (triggers KPI email stub)
- "Check Alerts" button (evaluates thresholds and shows results)

### Audit Log Viewer (`src/pages/audit-log.tsx`)
- Filterable, searchable audit log table
- Filter by: action type, resource type, date range
- Search across action and resource type fields
- Expandable rows showing full metadata/payload as formatted JSON
- Pagination (25 per page)

### API Routes (`src/pages/api/admin/`)
- `GET /api/admin/overview` - Overview metrics
- `GET /api/admin/users` - User list with search/filter/pagination
- `GET /api/admin/users/[id]` - User detail data
- `POST /api/admin/users/[id]` - User actions (add note, impersonate)
- `GET /api/admin/metrics` - KPI metrics data
- `GET /api/admin/audit-logs` - Audit log entries with filtering
- `GET /api/admin/audit-log-filters` - Available filter options

## NOT YET BUILT - Session 11 (Part 2)

The following features are planned for Session 11:

- **Setup Dashboard** - System configuration and setup wizard
- **Organization Management** - Full CRUD for organizations
- **Notification Management** - Admin notification system
- **Email Template Management** - Configure email templates via @musekit/email
- **Feature Flags** - Toggle features on/off
- **System Health Dashboard** - Infrastructure monitoring
- **Billing Management** - Stripe integration for subscription management
- **Export Tools** - Data export (CSV, JSON) for users, metrics, logs
- **Role-Based Access Control** - Fine-grained permission management
- **Admin Activity Dashboard** - Track admin user actions

## Dependencies

- next@14.2.18
- react@18.3.1
- react-dom@18.3.1
- @supabase/supabase-js
- recharts
- lucide-react
- tailwindcss@3.4.1
- typescript
- stripe
- date-fns

## Supabase Tables

| Table | Access | Usage |
|-------|--------|-------|
| profiles | read/write | User management |
| organizations | read | Org info |
| team_members | read | Team membership |
| subscriptions | read | Subscription status |
| audit_logs | read/write | Audit log viewer + impersonation logging |
| notifications | read | Notification counts |
| feedback | read | Feedback count for metrics |
| waitlist | read | Waitlist count for metrics |
