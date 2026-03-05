# Fix: All Database Table References and Actions

## Problem

The codebase references table names that don't match the real Supabase database schema. This causes runtime errors (table not found, column not found) across most admin API routes.

## Table Mapping

| Code Currently Says | Real DB Table | Column Differences |
|---|---|---|
| `brand_settings` | `settings` | No `updated_at`; columns: `id`, `key`, `value` |
| `team_invites` | `invitations` | Uses `organization_id` not `team_id`; has `token`, `invited_by`, `expires_at`, `accepted_at` |
| `team_members` | `organization_members` | Uses `organization_id` not `team_id`; columns: `id`, `organization_id`, `user_id`, `role`, `joined_at` |
| `support_tickets` | `tickets` | Uses `description` not `message`; has `ticket_number`, `category`, `resolved_at`, `closed_at` |
| `subscriptions` | `muse_product_subscriptions` | Has `product_slug`, `tier_id`, `cancel_at_period_end` |
| `waitlist` | `waitlist_entries` | Same structure |
| `api_keys` | `config_secrets` | Uses `key_name` not `name`, `encrypted_value` not `value`; columns: `id`, `key_name`, `encrypted_value`, `updated_at`, `updated_by` |
| `feature_toggles` | DOES NOT EXIST | Store in `settings` as `feature.*` key/value pairs |

### Tables That Are Correct (no changes needed)
`profiles`, `organizations`, `audit_logs`, `notifications`, `feedback`, `email_templates`

## Fixes

### FIX 1: Settings API
- **File**: `src/pages/api/admin/setup/settings.ts`
- **Change**: `brand_settings` -> `settings`, remove `updated_at` from upserts

### FIX 2: User API
- **File**: `src/pages/api/admin/users/[id].ts`
- **Changes**:
  - `team_members` -> `organization_members`
  - `team_invites` -> `invitations`
  - `subscriptions` -> `muse_product_subscriptions`
  - Add `token`, `expires_at` to invitation inserts

### FIX 3: Customer Service API
- **Files**: `src/pages/api/admin/customer-service.ts`, `src/types/index.ts`, `src/pages/customer-service.tsx`
- **Changes**:
  - `support_tickets` -> `tickets`
  - `subscriptions` -> `muse_product_subscriptions`
  - `message` column -> `description`
  - Add `ticket_number`, `category` to queries
  - Wire admin response to `ticket_comments` table insert
  - Remove mock fallback data

### FIX 4: Metrics, Overview, Revenue APIs
- **Files**: `src/pages/api/admin/metrics.ts`, `src/pages/api/admin/overview.ts`, `src/pages/api/admin/revenue.ts`
- **Changes**:
  - `subscriptions` -> `muse_product_subscriptions` (all files)
  - `waitlist` -> `waitlist_entries` (metrics only)

### FIX 5: API Keys
- **File**: `src/pages/api/admin/setup/api-keys.ts`
- **Changes**:
  - `api_keys` -> `config_secrets`
  - `label`/`name` -> `key_name`
  - `value` -> `encrypted_value`
  - Add `updated_by` (admin userId)
  - Remove `group`, `required` from inserts

### FIX 6: Feature Toggles
- **Files**: `src/pages/api/admin/setup/feature-toggles.ts`, `src/pages/feature-toggles.tsx`
- **Change**: Rewrite to use `settings` table with `feature.*` key prefix instead of non-existent `feature_toggles` table

### FIX 7: Testimonials
- **Files**: `src/pages/setup/testimonials.tsx`, `src/pages/api/admin/setup/testimonials.ts` (new)
- **Change**: Switch from `useSettings("testimonials")` JSON storage to dedicated `affiliate_testimonials` table with API route

### FIX 8: Email Templates
- **Files**: `src/pages/api/admin/setup/email-templates.ts`, `src/pages/setup/email.tsx`
- **Change**: Verify column alignment (`body` vs `body_html`/`body_text`), add `description` and `category`, ensure Create handler exists

### FIX 9: CSV Export Utility
- **Files**: `src/lib/csv-export.ts` (new), `src/pages/users/index.tsx`, `src/pages/customer-service.tsx`, `src/pages/revenue.tsx`
- **Change**: Create reusable `downloadCSV()` function, wire Export CSV buttons on Users, Tickets, Revenue pages

## Acceptance Criteria

- All API routes query correct table names
- All column references match real DB schema
- Feature toggles work via `settings` table
- Testimonials load from `affiliate_testimonials`
- CSV export works on Users, Tickets, Revenue pages
- TypeScript builds with zero errors
- No console errors about missing tables/columns
