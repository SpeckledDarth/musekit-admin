# MuseKit Admin — Gap Closure Sprint Plan

## Overview

This document breaks the 11-gap closure work into 6 manageable sprints. Each sprint is scoped to fit within a single session, starts with a clean build, and ends with a verified clean build.

**Total Gaps**: 11
**Total Sprints**: 6
**Rule**: Start clean, end clean — every sprint begins and ends with `npm run build` passing with zero errors.

---

## Current State (Baseline)

Build status: **PASSING** (verified at checkpoint `97beda2c`)

Existing pages:
- Overview (`/`) — metric cards + recent activity, no charts
- Users (`/users`, `/users/[id]`) — list + detail with tabs (Subscription, Activity, Team, Admin Notes)
- Metrics (`/metrics`) — 10 KPIs, recharts charts, alerts
- Audit Log (`/audit-log`) — filterable log viewer
- Customer Service (`/customer-service`) — user lookup, subscription history, admin notes
- Onboarding (`/onboarding`) — funnel visualization
- Feature Toggles (`/feature-toggles`) — toggle management
- Setup Dashboard (`/setup/*`) — 11 sub-pages (branding, content, pages, pricing, social, features, api-keys, email, ai, security, passivepost)
- Settings (`/settings`) — placeholder

---

## Sprint 1 — Foundation & Navigation Updates

**Scope**: Add new types, update sidebar navigation links. Smallest sprint — sets the stage for everything else.

| Item | File(s) | What Changes |
|------|---------|--------------|
| Add `SupportTicket` type | `src/types/index.ts` | New interface for Gap 5 |
| Add Revenue sidebar link | `src/layout/AdminSidebar.tsx` | "Revenue" item under Main section, `DollarSign` icon |
| Add Testimonials sidebar link | `src/layout/SetupSidebar.tsx` | "Testimonials" item, `MessageSquare` icon |
| Add CSS Dashboard sidebar link | `src/layout/SetupSidebar.tsx` | "CSS Dashboard" item, `Palette` icon |

**Acceptance**: `npm run build` passes. New sidebar links visible (pages won't exist yet — that's OK, they'll 404 until built).

**Estimated effort**: Small

---

## Sprint 2 — Overview Charts + Revenue Dashboard

**Scope**: 2 features — add charts to the existing overview page and create a brand-new revenue page with its API route.

| Gap | File(s) | What Changes |
|-----|---------|--------------|
| Gap 1: Overview Charts | `src/pages/index.tsx`, `src/pages/api/admin/overview.ts` | Add MRR trend (AreaChart), user growth (LineChart), churn rate visualization below existing metric cards. Expand API to return chart data arrays. |
| Gap 4: Revenue Dashboard | `src/pages/revenue.tsx` (new), `src/pages/api/admin/revenue.ts` (new) | New page: MRR/ARR/ARPU cards, MRR trend chart, revenue by plan bar chart, transaction history table with search + date filter, CSV export button. New API route to aggregate revenue data. |

**Dependencies**: Sprint 1 (Revenue sidebar link must exist)

**Acceptance**: Both pages render without errors. Charts display with responsive sizing. API routes return structured data. `npm run build` passes.

**Estimated effort**: Medium-Large

---

## Sprint 3 — User Features (Health Scores + Team Management)

**Scope**: Modify 2 existing user pages — add health scores and expand team management.

| Gap | File(s) | What Changes |
|-----|---------|--------------|
| Gap 2: Health Scores | `src/pages/users/[id].tsx`, `src/pages/users/index.tsx` | Client-side health score algorithm (login recency 30%, subscription 25%, activity 25%, account age 10%, profile completeness 10%). Colored meter in user detail sidebar. Health score column in user list table. |
| Gap 3: Team Management | `src/pages/users/[id].tsx`, `src/pages/api/admin/users/[id].ts` | Expand Team tab: invite member form (email + role selector), change roles inline, remove members with confirmation, revoke pending invitations. Expand API to handle team CRUD. |

**Dependencies**: None (can run independently of Sprint 2)

**Acceptance**: Health scores visible and color-coded in both list and detail views. Team tab supports invite/role-change/remove. `npm run build` passes.

**Estimated effort**: Medium

---

## Sprint 4 — Customer Service Expansion + Testimonials

**Scope**: Expand customer service with support tickets, create new testimonials setup page.

| Gap | File(s) | What Changes |
|-----|---------|--------------|
| Gap 5: Support Tickets | `src/pages/customer-service.tsx`, `src/pages/api/admin/customer-service.ts` | Add Tabs component: "Customer Profiles" (existing content) + "Support Tickets" (stat cards, search, filters, ticket list, detail panel with admin response + status update). Expand API for ticket CRUD. |
| Gap 6: Testimonials CRUD | `src/pages/setup/testimonials.tsx` (new) | Setup sub-page: add/edit/delete testimonials, reorder via arrows, approve/feature toggle, summary cards (Total, Approved, Featured). Save via settings API. |

**Dependencies**: Sprint 1 (SupportTicket type, Testimonials sidebar link)

**Acceptance**: Customer service has two working tabs. Testimonials page has full CRUD. `npm run build` passes.

**Estimated effort**: Medium-Large

---

## Sprint 5 — Setup Page Expansions (API Keys, CAPTCHA, Watermark)

**Scope**: Expand 3 existing setup pages — no new pages, just enriching what's already there.

| Gap | File(s) | What Changes |
|-----|---------|--------------|
| Gap 7: API Keys Expansion | `src/pages/setup/api-keys.tsx` | Expand from 6 to 23+ platforms across 12 categories (Core, Email, OAuth, Social, AI, Analytics, Infrastructure, Automation, Security, CDN, Custom). Add search/filter bar, validation indicators, collapsible sections. |
| Gap 10: CAPTCHA Config | `src/pages/setup/security.tsx` | Add "CAPTCHA Configuration" section: enable toggle, provider selector (hCaptcha, reCAPTCHA v2/v3, Turnstile), site/secret key inputs, per-page toggles (Login, Signup, Password Reset), test button. |
| Gap 11: Watermark Settings | `src/pages/setup/branding.tsx` | Add "Post Watermark" section at bottom: enable toggle, text input, preview on sample post, "Higher tiers can disable" note. |

**Dependencies**: None

**Acceptance**: All 3 pages render correctly with new sections. Existing functionality preserved. `npm run build` passes.

**Estimated effort**: Medium

---

## Sprint 6 — CSS Dashboard + PassivePost Expansion

**Scope**: 1 new setup page + 1 major expansion of an existing page. Final sprint.

| Gap | File(s) | What Changes |
|-----|---------|--------------|
| Gap 8: CSS Dashboard | `src/pages/setup/css-dashboard.tsx` (new) | Interactive CSS variable editor with 6+ groups (Colors, Typography, Spacing, Shadows, Transitions, Component overrides). Color pickers, live preview panel, light/dark toggle, export CSS button, save to settings API. |
| Gap 9: PassivePost Expansion | `src/pages/setup/passivepost.tsx` | Replace simple form with 5-tab config: Platforms (per-platform settings), Scheduling (presets, days, time windows, content mix), Templates (6 content types, media settings), AI Prompts (model, tone, brand voice, guardrails), Analytics (engagement metrics + chart). |

**Dependencies**: Sprint 1 (CSS Dashboard sidebar link)

**Acceptance**: CSS Dashboard renders with live preview. PassivePost has 5 functional tabs. `npm run build` passes. All 11 gaps closed.

**Estimated effort**: Medium-Large

---

## Sprint Dependency Graph

```
Sprint 1 (Foundation)
  ├── Sprint 2 (Charts + Revenue)
  ├── Sprint 3 (User Features)     ← independent of Sprint 2
  ├── Sprint 4 (Tickets + Testimonials)
  ├── Sprint 5 (Setup Expansions)  ← independent of all others
  └── Sprint 6 (CSS + PassivePost)
```

Sprints 2, 3, 4, 5, and 6 all depend on Sprint 1 being complete, but are otherwise independent of each other. The recommended order is as listed (highest priority gaps first), but any order works after Sprint 1.

---

## Files Summary

| File | Sprints | Action |
|------|---------|--------|
| `src/types/index.ts` | 1 | Add SupportTicket type |
| `src/layout/AdminSidebar.tsx` | 1 | Add Revenue nav item |
| `src/layout/SetupSidebar.tsx` | 1 | Add Testimonials + CSS Dashboard items |
| `src/pages/index.tsx` | 2 | Add charts below metric cards |
| `src/pages/api/admin/overview.ts` | 2 | Expand with chart data |
| `src/pages/revenue.tsx` | 2 | New file |
| `src/pages/api/admin/revenue.ts` | 2 | New file |
| `src/pages/users/[id].tsx` | 3 | Health scores + team management |
| `src/pages/users/index.tsx` | 3 | Health score column |
| `src/pages/api/admin/users/[id].ts` | 3 | Team CRUD endpoints |
| `src/pages/customer-service.tsx` | 4 | Support tickets tab |
| `src/pages/api/admin/customer-service.ts` | 4 | Ticket CRUD |
| `src/pages/setup/testimonials.tsx` | 4 | New file |
| `src/pages/setup/api-keys.tsx` | 5 | Expand to 23+ platforms |
| `src/pages/setup/security.tsx` | 5 | Add CAPTCHA section |
| `src/pages/setup/branding.tsx` | 5 | Add watermark section |
| `src/pages/setup/css-dashboard.tsx` | 6 | New file |
| `src/pages/setup/passivepost.tsx` | 6 | 5-tab expansion |
