# Platform Admin and Buzl Member Dashboard Capability Audit

> Authoritative Read-Only Capability, Permission, and UX Architecture Audit  
> Target System: Buzl Listing Platform  
> Date: 2026-09-18  
> Status: AUDIT COMPLETE — PENDING PRODUCT & ARCHITECTURE REVIEW

---

## 1. Executive Summary

This audit performs a rigorous, read-only inspection of the internal management capabilities of the Buzl Listing platform across the three authenticated internal roles:
1. **Platform Admin** (`admin`)
2. **Buzl Member — Listing Manager** (`buzl_member` + preset `listing_manager`)
3. **Buzl Member — Onboarding Member** (`buzl_member` + preset `onboarding_member`)

The inspection reviewed existing Next.js App Router routes, layouts, sidebar navigation components, server actions, database schema, Row-Level Security (RLS) policies, and database triggers.

### Key Audit Findings

1. **Category Management is a Critical Missing Capability (P0)**:
   - The PostgreSQL database schema already contains a robust `public.categories` table with slug uniqueness, active flags, sort order, hierarchical `parent_id`, deletion restrict foreign keys, and published category deactivation guards.
   - **Zero User Interface exists for Category Management.** Categories can currently only be created, edited, reordered, or archived directly via raw SQL queries or database migrations.
   - The permission `'category.manage'` is already defined in RBAC for Platform Admin, but has no corresponding route, UI, or server action.
   - **Recommendation**: Prioritize `/admin/categories` as the immediate next internal implementation task.

2. **Moderation Queue Navigation Blindspot (P0)**:
   - The route `/review/businesses` exists, contains permission checks allowing Admins and Listing Managers, and renders a table with publication actions (`publish`, `suspend`).
   - **`/review/businesses` is completely missing from the Sidebar Navigation (`Sidebar.tsx`)!** Neither Admins nor Listing Managers can discover or navigate to the review queue from the UI.
   - **Recommendation**: Add "Review Queue" with pending count pill to the sidebar for Admins and Listing Managers.

3. **Platform Admin Overview Dashboard is Missing (P1)**:
   - The route `/admin` currently executes an unconditional redirect to `/admin/businesses`.
   - Platform Admins lack a unified overview dashboard summarizing platform listing health, pending moderation queues, data quality alerts, and user distribution.
   - **Recommendation**: Implement a consolidated `/admin` dashboard that brings together high-level metrics, pending review queues, and quality flags without bloating the route structure.

4. **Buzl Member Post-Login Experience is Fragmented (P1)**:
   - After signing in, Buzl Members are redirected directly to `/admin/businesses/import`.
   - If they navigate to `/dashboard`, they see the generic business owner dashboard, filtered to listings they manage.
   - Buzl Members lack a dedicated workspace reflecting their assigned tasks, draft imports, and (for Listing Managers) their moderation queue.

---

## 2. Current Route & Architecture Map

| Route | Allowed Roles / Presets | Layout | Current Capability | Gaps & Missing Features |
|---|---|---|---|---|
| `/dashboard` | Authenticated users (`admin`, `buzl_member`, `business_owner`) | `DashboardLayout` (`Sidebar` + `Topbar`) | Generic 4-metric overview (Total, Published, Pending, Draft) + Recent listings table filtered by RLS. | Not tailored for Buzl Members or Admins; lacks quality flags, queue summaries, or assignment filters. |
| `/dashboard/businesses` | Authenticated users | `DashboardLayout` | List of businesses where user is manager (or all if admin); search, status filter. | No category, location, or verification filters; desktop table only (no mobile cards). |
| `/dashboard/businesses/new` | Authenticated users | `DashboardLayout` | 8-step business onboarding wizard with Google Places location. | None. Complete. |
| `/dashboard/businesses/[id]/edit` | Business Managers & Admins | `DashboardLayout` | 8-step business edit wizard with Google Places and public preview. | None. Complete. |
| `/admin` | `admin` only | `AdminLayout` | Immediate redirect to `/admin/businesses`. | **Missing dedicated Admin Overview Dashboard.** |
| `/admin/businesses` | `admin` only | `AdminLayout` | System-wide listings table with search, status filter, and row actions (publish, suspend, verify, delete, edit). | Missing sorting, category filters, location filters, verification filters, bulk actions, and quick preview drawer. |
| `/admin/businesses/import` | `admin`, `buzl_member` | `AdminLayout` | Single Buzl Profile JSON file upload, client schema validation, duplicate detection, draft creation. | No batch upload; no import history or error logging. |
| `/internal/businesses/import` | `admin`, `buzl_member` | None (redirect) | Redirects to `/admin/businesses/import`. | Legacy alias. |
| `/admin/users` | `admin` only | `AdminLayout` | 5 summary metric cards, live search, role pills, status dropdown, desktop table, mobile stacked cards. | Fully implemented in recent task. |
| `/admin/users/new` | `admin` only | `AdminLayout` | Dynamic invite user form with role cards, conditional preset selector for Buzl Members, admin privilege warning. | Fully implemented in recent task. |
| `/admin/users/[id]` | `admin` only | `AdminLayout` | User detail, auth metadata, associated businesses card, self-protection, last admin protection, password reset, session revoke modal. | Fully implemented in recent task. |
| `/review/businesses` | `admin`, `buzl_member` (with `listing_manager` preset) | Standalone (`Topbar` only, no `Sidebar`) | Moderation queue listing pending, published, and suspended businesses. Admins can verify/delete; Listing Managers can publish/suspend. | **Hidden from sidebar navigation;** no dedicated Pending-only focus; no rejection/change-request workflow. |
| `/admin/categories` | **DOES NOT EXIST** | — | **No UI or server actions exist.** | **Critical Missing Capability.** All category updates require direct DB intervention. |

---

## 3. Current Role & Permission Model

### Existing Roles in System

The application strictly models roles in `auth.users.raw_app_meta_data->'role'`:
- `admin` (Platform Administrator)
- `buzl_member` (Internal Buzl Team Member)
- `business_owner` (External Business Owner)

### Existing Account Lifecycle Statuses

Stored in `public.profiles.account_status`:
- `invited`: Invited via email, pending first sign-in
- `active`: Normal operational status
- `inactive`: Deactivated account; blocked by middleware and DB triggers
- `suspended`: Administratively blocked; sessions terminated; blocked by middleware and DB triggers

### Existing Buzl Member Permission Presets

Stored in `public.profiles.permission_preset`:
- `onboarding_member`: Onboarding operator focused on listing creation and profile imports.
- `listing_manager`: Elevated operational manager with moderation authority.

### Permission Mapping (Current `src/lib/rbac.ts` Implementation)

| RBAC Permission Key | Database Enforced? | Platform Admin | Listing Manager | Onboarding Member | Business Owner |
|---|---|:---:|:---:|:---:|:---:|
| `listing.view` | Yes (RLS) | ✓ (All) | ✓ (All moderated) | ✓ (Self-managed) | ✓ (Self-managed) |
| `listing.create` | Yes (RPC) | ✓ | ✓ | ✓ | ✓ |
| `listing.edit` | Yes (RLS/RPC) | ✓ | ✓ | ✓ | ✓ (Self-managed) |
| `listing.import` | Yes (Middleware/Action) | ✓ | ✓ | ✓ | ✕ |
| `listing.submit` | Yes (RPC) | ✓ | ✓ | ✓ | ✓ |
| `listing.publish` | Yes (RPC & RLS) | ✓ | ✓ | ✕ | ✕ |
| `listing.suspend` | Yes (RPC) | ✓ | ✓ | ✕ | ✕ |
| `user.view` | Yes (Server Action) | ✓ | ✕ | ✕ | ✕ |
| `user.create` | Yes (Server Action) | ✓ | ✕ | ✕ | ✕ |
| `user.activate` | Yes (Server Action) | ✓ | ✕ | ✕ | ✕ |
| `user.reset_password` | Yes (Server Action) | ✓ | ✕ | ✕ | ✕ |
| `member.view` | Yes (Server Action) | ✓ | ✕ | ✕ | ✕ |
| `member.manage` | Yes (RPC/Action) | ✓ | ✕ | ✕ | ✕ |
| `category.manage` | Yes (DB RLS, no UI) | ✓ | ✕ | ✕ | ✕ |
| `admin.access` | Yes (Middleware) | ✓ | ✕ | ✕ | ✕ |

---

## 4. Category Management Audit (Detailed Priority Analysis)

### Current Database Readiness: **READY**

The database schema (`public.categories`) was architected on Day 1 (`supabase/migrations/20260912140000_day1_foundation.sql`) with comprehensive constraints:

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  parent_id uuid references public.categories(id) on delete restrict,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### Existing Integrity Rules:
1. **Parent Hierarchy**: Self-referencing foreign key `parent_id` with `on delete restrict`. Prevents accidental deletion of parent categories that contain children.
2. **Published Listing Protection Trigger**: Trigger `categories_prevent_published_deactivation` executes `prevent_published_category_deactivation()`:
   - If an administrator attempts to set `active = false` on a category that is currently the `primary_category_id` of any `published` business, PostgreSQL raises an exception and aborts the update!
3. **Admin-Only RLS Policy**:
   - `categories_admin_manage`: Restricted strictly to `public.is_admin()` for `INSERT`, `UPDATE`, and `DELETE`.
   - `categories_select_active_or_admin`: Anonymous users and business owners only see `active = true`. Admins see both active and inactive categories.

### Current Application Reality: **MISSING INTERNAL CAPABILITY**

- **Zero UI routes exist** (`/admin/categories` does not exist).
- **Zero server actions exist** for category creation, editing, archiving, or reordering.
- When an operator needs to add a new category (e.g. "Pet Care & Veterinary"), an engineer must currently connect to PostgreSQL or write an ad-hoc migration.
- In the Buzl Profile Importer, if a source profile specifies a category that is not active, the UI flags "Category Review Required" and forces the operator to map it to an existing category, because the operator cannot add new categories on the fly.

### Category Management Proposal (`/admin/categories`)

1. **Route**: `/admin/categories` (Admin only).
2. **Features**:
   - **Category Hierarchy Tree / Table**: Displays name, slug, parent category, sort order, active status badge, and **Listing Usage Count** (`select count(*) from businesses where primary_category_id = categories.id`).
   - **Add Category Modal / Slide-over**: Fields for Category Name, Auto-generated URL slug, Parent Category (dropdown of active top-level categories), Sort Order, and Active toggle.
   - **Edit Category Modal**: Allows renaming, slug update (with redirect warning if published listings exist), and parent reassignment.
   - **Archive / Deactivate Toggle**: Soft deactivation (`active: false`). Safely blocked by DB trigger if published listings are currently attached.
   - **Reorder UX**: Simple numeric sort-order input or drag-to-reorder.
   - **Search / Filter**: Filter by status (Active / Inactive) and text search.

### Category Management Permissions:
- **Platform Admin**: Full management (Create, Edit, Archive, Reorder).
- **Buzl Listing Manager**: View categories with usage statistics. *Suggest/Request Category* workflow (REQUIRES PRODUCT DECISION if editing allowed).
- **Buzl Onboarding Member**: Read-only selection in forms. No structural mutations.

---

## 5. Listing Management & Moderation Audit

### Current Strengths:
- Multi-step validation, phone normalization, duplicate warnings, and Google Places location integration are robust.
- Database RPC `transition_business_publication` enforces server-side permission checks:
  - Normal owners can only transition `draft -> pending`.
  - Listing Managers and Admins can transition to `published` or `suspended`.
  - Publication triggers strict integrity validation (`assert_business_publishable`).
- `AdminBusinessRowActions` provides immediate action buttons (Publish, Suspend, Verify, Delete).

### Current Critical Gaps:
1. **Moderation Queue Discoverability**:
   - `/review/businesses` is isolated and not linked in `Sidebar.tsx`.
   - Listing Managers who sign in have no visible link to their primary job responsibility (moderating listings).
2. **Missing "Reject / Return for Changes" Workflow**:
   - Currently, an admin/manager can only leave a listing in `pending` or suspend it.
   - There is no formal `rejected` status or "Return to Draft with Feedback" action where the manager can provide specific reasons (e.g., "Invalid storefront address", "Inappropriate cover photo") visible to the business owner.
   - *Requires Product Decision*: Introduce `rejected` or return to `draft` with a moderation note.
3. **Listing Table Filtering Limitations**:
   - `/admin/businesses` only filters by `searchTerm` and `publication_status`.
   - Cannot filter by: Category, City/State, Location Mode (Storefront vs Service Area), Verification Status (Verified vs Unverified), or Import Source.
4. **No Quick Review Drawer**:
   - Inspecting a business requires clicking "Edit", which loads the heavy 8-step wizard.
   - A slide-over review drawer showing business NAP, categories, services, products, media previews, Google Places status, and Google Business Profile URL would accelerate review throughput 5x.

---

## 6. User Management Capability Status

Platform Admin User Management (`/admin/users`) was fully implemented and deployed to staging in `ADMIN-USER-MANAGEMENT-UX`.

### Current Live Capabilities:
- 5 KPI summary cards (Total Users, Business Owners, Buzl Members, Admins, Suspended).
- Search by name, email, member ID with instant filter clear.
- Role filter pills and account status dropdown.
- Fully responsive mobile stacked cards view (375px, 390px, 430px).
- Dynamic role-aware invite modal with Buzl Member presets and admin warnings.
- User management detail screen with profile settings, auth metadata, associated businesses card, self-protection, last active admin protection, password reset, and session revocation modals.

### Recommendations for User Management:
- **Keep Admin-Only**: User creation, role changes, and session management must remain strictly restricted to Platform Admin.
- **Listing Manager View (Contextual Only)**: When a Listing Manager reviews a business listing in the moderation queue, they should see the owner's name and contact email in the listing context, without granting access to `/admin/users`.

---

## 7. Data Quality & Health Tools

Rather than inventing arbitrary "SEO Scores", the internal dashboard should provide concrete, actionable data quality indicators:

| Quality Indicator | Target Population | Purpose | Classification |
|---|---|---|:---:|
| **Missing Google Business Profile (GBP) Link** | Published / Pending listings | Encourages citation consistency and "View on Google" user engagement. | **P1 (MVP)** |
| **Missing Location Verification** | Storefront / Hybrid listings | Identifies listings lacking Google Places Place ID or verified coordinates. | **P1 (MVP)** |
| **Incomplete Media Showcase** | Published listings | Identifies live listings without a Logo, Cover Photo, or Gallery images. | **P1 (MVP)** |
| **Empty Service / Product Offerings** | Published listings | Flags listings with zero services or products listed. | **P2** |
| **Category Usage Distribution** | Platform-wide | Identifies unused categories (0 listings) and over-concentrated categories. | **P1 (MVP)** |
| **Potential Duplicate Queue** | Platform-wide | Surfaces listings flagged by phone/domain/name similarity for manual operator inspection. | **P2** |

---

## 8. Proposed Navigation Architecture

### A. Proposed Platform Admin Navigation

A clean, unbloated sidebar grouping high-level management without multiplying redundant sub-pages:

```text
[Buzl Listing Platform Admin]
───────────────────────────────
OVERVIEW
  📊 Dashboard               → /admin (KPIs, pending alerts, quality cards)

LISTING OPERATIONS
  🏢 All Listings            → /admin/businesses (Search, advanced filters, bulk tools)
  ⚖️ Moderation Queue         → /review/businesses (Pending review focus, quick review drawer)
  📥 Import Profiles         → /admin/businesses/import (JSON upload & mapping)

TAXONOMY & QUALITY
  🏷️ Categories              → /admin/categories (P0: Hierarchy, active status, usage counts)

PLATFORM GOVERNANCE
  👥 Users                   → /admin/users (User list, invite, roles, presets, sessions)
  ➕ Add User                → /admin/users/new (Direct invite shortcut)
```

### B. Proposed Buzl Member Navigation — Listing Manager

```text
[Buzl Listing Manager]
───────────────────────────────
OPERATIONS
  📊 Dashboard               → /dashboard (My queue, pending moderation metrics)
  ⚖️ Moderation Queue         → /review/businesses (P0: Exposed in sidebar! Pending review focus)
  🏢 All Listings            → /dashboard/businesses (Read-only / moderation view)
  📥 Import Profiles         → /admin/businesses/import (JSON import tool)

REFERENCE
  🏷️ Categories              → /admin/categories (Read-only category directory & usage)
```

### C. Proposed Buzl Member Navigation — Onboarding Member

```text
[Buzl Onboarding Member]
───────────────────────────────
OPERATIONS
  📊 Dashboard               → /dashboard (My drafts, my created listings)
  🏢 My Listings             → /dashboard/businesses (Managed listings list)
  ➕ Add Business            → /dashboard/businesses/new (8-step listing wizard)
  📥 Import Profiles         → /admin/businesses/import (JSON import tool)

REFERENCE
  🏷️ Categories              → /admin/categories (Read-only category directory)
```

---

## 9. Security & Authorization Matrix

Any proposed dashboard feature must follow the principle of least privilege:

| Capability | View | Create | Edit | Publish / Suspend | Delete / Archive |
|---|---|---|---|---|---|
| **Platform Dashboard (`/admin`)** | Admin | — | — | — | — |
| **Member Dashboard (`/dashboard`)** | All Authenticated | — | — | — | — |
| **Listings — Own Drafts** | Creator / Manager | Creator | Creator | ✕ | Creator (Draft only) |
| **Listings — Review Queue** | Admin, Listing Manager | — | Admin, Listing Manager | Admin, Listing Manager | Admin only |
| **Listings — Publication State** | All (Public = published only) | — | — | Admin, Listing Manager | — |
| **Listings — Verification State**| All | — | — | Admin only | — |
| **Categories — Active** | All (Public included) | Admin | Admin | Admin | Admin (Deactivate) |
| **Categories — Inactive** | Admin, Listing Manager | Admin | Admin | Admin | Admin |
| **User Accounts** | Admin | Admin | Admin | Admin (Suspend) | Admin (Deactivate) |
| **Buzl Member Presets** | Admin | Admin | Admin | — | Admin |
| **Profile JSON Import** | Admin, Buzl Member | Admin, Buzl Member | — | — | — |
| **Audit Logs (Future)** | Admin | System | — | — | — |

---

## 10. Recommended Phased Implementation Roadmap

### Phase A: Navigation & Review Queue Visibility (Immediate P0 Quick Win)
1. Expose `Review Queue` (`/review/businesses`) in `Sidebar.tsx` for Admins and Listing Managers.
2. Add a dynamic pending count badge on the "Review Queue" sidebar link.
3. Ensure `/review/businesses` uses the standard dashboard sidebar layout rather than an isolated header.

### Phase B: Category Management System (P0 Critical Milestone)
1. Create `/admin/categories` route with `AdminLayout`.
2. Implement Category Tree / Table with listing counts, active pills, and sort order.
3. Implement Server Actions (`createCategory`, `updateCategory`, `toggleCategoryActive`, `reorderCategories`).
4. Enforce soft-archive rules respecting the database integrity trigger.
5. Provide read-only category directory for Buzl Members.

### Phase C: Platform Admin & Buzl Member Dashboard Foundations (P1)
1. Convert `/admin` from a redirect into a genuine Platform Admin Dashboard:
   - Metric cards: Total Listings, Published, Pending, Suspended, Verified, Total Users, Active Admins.
   - Widgets: Pending Review Queue snippet, Recent Listings, Data Quality Alerts.
2. Customize `/dashboard` for Buzl Members:
   - Listing Managers see Moderation Queue summary + Recent Activity.
   - Onboarding Members see My Drafts + Import Shortcuts.

### Phase D: Listing Search & Quality Filters (P1)
1. Enhance `BusinessTableView` with:
   - Category filter dropdown.
   - Location (City/State) filter.
   - Verification status filter (`Verified`, `Unverified`).
   - Data quality flags (Missing GBP, Missing Media, Unverified Location).
2. Implement slide-over Quick Review Drawer for moderation.

### Phase E: Advanced Operations & Audit Logging (P2 Post-Launch)
1. Rejection / Change-request workflow with moderation notes.
2. Duplicate review queue and listing comparison tool.
3. Audit history logging (`activity_logs` table for listing and user mutations).
4. Bulk export capabilities for listings and users.
