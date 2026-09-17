# Staging Team Review — Buzl Listing

- **Review Date**: 2026-09-18
- **Staging URL**: https://listing.rclk.in
- **Staging Commit**: `42c06d2`
- **Environment**: Staging VPS (Ubuntu / Docker Compose / Next.js 16 / Supabase)
- **Reviewers / Participants**: Product Owner, Core Engineering, Staging Review Team
- **Decision Status**: **APPROVED** (Zero blocking bugs; product decisions cataloged for upcoming milestone)

---

## 1. Executive Summary

A comprehensive staging audit of the Buzl Listing platform was conducted on commit `42c06d2`. The audit evaluated 7 primary operational vectors:
1. Staging Indexing & Exposure Defense Guards
2. Authentication Architecture & WhatsApp UI Preview
3. Business Owner Onboarding & Multi-Step Lifecycle Flow
4. Administrative Moderation & Role-Based Access Controls (RBAC)
5. Public Directory Representation & Zero-Data-Leakage Privacy Invariants
6. Multi-Device Mobile Responsiveness (375px, 390px, 430px)
7. Identity Security & Multi-Tenant Data Isolation

**Audit Result**: **100% Checks Passed (Zero Blockers)**. Staging is operating in accordance with the Day 1/Day 1.5/Day 2 product contracts and design tokens.

---

## 2. WhatsApp Status Presentation

| Component | Status | Operational Details |
|---|---|---|
| **WhatsApp UI Tabs** | **AVAILABLE FOR REVIEW** | Visible on `/login` and `/signup` between "Email Code (OTP)" and "Password". Fully responsive, formatted with country code dropdown (+91 India default). |
| **Availability Notice** | **ACTIVE** | Banner titled *"WhatsApp verification is coming soon"* informs users that OTP delivery is being activated and provides a direct *"Use Email Code →"* switch action. |
| **Input & Validation** | **ACTIVE** | Client-side validation using provider-neutral phone utilities (`src/lib/whatsapp/phone.ts`). Rejects invalid inputs; valid numbers trigger activation status notice. |
| **Token Verification Screen** | **INTENTIONALLY DISABLED** | Strictly avoids displaying any fake OTP 6-digit input screen or pretending codes were dispatched. |
| **Live WhatsApp OTP Delivery** | **PENDING PROVIDER ACTIVATION** | Meta Cloud API credentials remain pending in private staging environment. Server-only GoTrue SMS hook and delivery adapters remain held in `feature/whatsapp-otp-auth`. |

---

## 3. Areas Reviewed & Verification Results

### 3.1 Staging Indexing & Crawler Guards
- **Health Check (`/api/health`)**: Responds HTTP 200 with header `X-Robots-Tag: noindex, nofollow, noarchive`.
- **Robots Policy (`/robots.txt`)**: Responds HTTP 200 with `User-Agent: *\nDisallow: /` and `X-Robots-Tag: noindex`.
- **XML Sitemap (`/sitemap.xml`)**: Responds HTTP 200 with empty `<urlset>` (zero public listings indexed).
- **Result**: **PASS**

### 3.2 Authentication & User Onboarding
- **Default Auth Mode**: `Email Code (OTP)` is the default active tab on both `/login` and `/signup`.
- **WhatsApp UI Tab**: Second tab; renders explanatory notice, country dropdown, and phone input with `min-w-0` to eliminate mobile overflow.
- **Password Mode**: Third tab; supports fallback login and registration.
- **Open Redirect Protection**: `getSafeRedirectUrl` prevents malicious cross-site redirects.
- **Result**: **PASS**

### 3.3 Business Owner Journey (8-Step Flow)
- **Step 1 (Business Details)**: Business Name, Year Established, Description. Clean labels without developer jargon (`canonical_name`).
- **Step 2 (Contact Information)**: Phone, Contact Email, Website URL, and Google Business Profile Link (`google_business_profile_url`).
- **Step 3 (Category & Services)**: Primary category selector, service name, service description textarea, `X / 20 Services` counter, and empty state guidance.
- **Step 4 (Products & Offerings)**: Product name, product image, description textarea, `X / 20 Products` counter, and friendly empty state.
- **Step 5 (Media & Gallery)**: Logo, Cover, and Multi-Photo Gallery with drag/order controls. Clear notice requiring draft save before file storage.
- **Step 6 (Location & Coverage)**: Storefront / Service-Area / Hybrid location models. Google Places autocomplete. Zero instances of `PostGIS` or `Geospatial Coordinates` jargon.
- **Step 7 (Operating Hours & Social)**: Day-by-day open/closed/24-hour toggles, time pickers, and social profile links.
- **Step 8 (Preview & Submit)**: Live Listing Readiness Summary checklist card and Public Listing Preview card.
- **Submission Feedback**: Clicking *"Submit for Review"* triggers toast *"Your listing has been submitted for review"* and displays the persistent *Pending Review* banner informing owners that edits remain permitted during review.
- **Owner Restrictions**: Business owner **cannot** self-publish or self-verify.
- **Result**: **PASS**

### 3.4 Administrative Moderation & RBAC
- **Admin Dashboard**: Lists draft, pending, published, and suspended businesses with clean *"Listing Status"* header.
- **Publication Controls**: Admin can publish pending listings, transition published listings to suspended, and toggle verification status.
- **Public Navigation Link**: Once published, direct *"View Public Listing ↗"* button links directly to `/business/[slug]`.
- **Member Access Control**: Buzl Member (`buzl_member`) role has access to importer (`/admin/businesses/import`) but is blocked from user administration (`/admin/users`).
- **Result**: **PASS**

### 3.5 Public Directory Listing & Privacy Invariants
- **Public Presentation**: Verified rendered attributes including Business Name, Category, Cover image, Logo, Gallery, Services with descriptions, Products with descriptions, Contact details, and *"View on Google"* CTA button.
- **Zero Data Leakage Invariants**:
  - `place_id`: Zero exposure in public HTML/DOM.
  - `latitude` / `longitude`: Zero exposure in public DOM.
  - `PostGIS`: Zero exposure in public DOM.
  - `member_id` (`BUZL-M-*`): Zero exposure in public DOM.
  - `auth email` / `auth phone`: Zero exposure in public DOM (only explicit business contact fields shown).
- **Service-Area Privacy**: Service-area-only businesses (e.g. Laptech) suppress street address lines and coordinates, displaying only named coverage areas.
- **Result**: **PASS**

### 3.6 Mobile Viewport Responsiveness (375px, 390px, 430px)
- **375px (iPhone SE)**: `scrollWidth = 375px`, `clientWidth = 375px` (**0 horizontal overflow**). Input widths `293px+` (comfortable touch targets).
- **390px (iPhone 14/15)**: `scrollWidth = 390px`, `clientWidth = 390px` (**0 horizontal overflow**).
- **430px (iPhone Pro Max)**: `scrollWidth = 430px`, `clientWidth = 430px` (**0 horizontal overflow**).
- **Forms & Step Header**: Compact mobile header (`Step X of 8`) with progress bar displays cleanly on small viewports.
- **Result**: **PASS**

---

## 4. Review Feedback & Observations

| ID | Area | Category | Priority | Observation | Requested Change / Recommendation | Decision | Status |
|---|---|---|---|---|---|---|---|
| `REV-001` | Auth | UX | LOW | Users clicking "Continue with WhatsApp" with valid numbers see notice banner but may miss that they need to click "Use Email Code" or switch tabs. | Keep current clear banner; consider auto-switching to Email OTP tab with pre-filled notification upon click in future iteration. | Retain current manual switch for preview clarity | ACCEPTED |
| `REV-002` | Business Form | UX | LOW | In Step 4 (Products), product image upload requires saved draft, similar to media gallery. | Explanatory note "Save draft to upload files" is present; consider adding an explicit "Save Draft" button inside Step 4 like Step 5 has. | Consider for future polish | LOGGED |
| `REV-003` | Public Page | COPY | LOW | Public listing footer displays directory category links; verify all categories link to active public category routes. | Verified `/category/[slug]` routes render correctly and return HTTP 200. | No change required | VERIFIED |
| `REV-004` | Dashboard | UX | MEDIUM | Owner business list currently displays single business per owner; pagination ready for multi-business owners. | Confirmed table renders empty state or populated listings cleanly with "Listing Status" header. | Current behavior approved | APPROVED |

---

## 5. Product Decisions Surfaced for Stakeholder Alignment

The following 9 architectural questions were surfaced during the review for stakeholder resolution:

### 1. Should Products support Price?
- **Current State**: Products have Name, Description (up to 1000 chars), and Image. No price field.
- **Recommendation**: Keep Price optional. Some local service businesses offer fixed-price products (e.g. ₹499 screen protector), while custom businesses prefer "Price on Request". If added, provide currency prefix and optional display flag.
- **Status**: **PENDING_DECISION**

### 2. Should Products support an external Product URL?
- **Current State**: Products do not include outbound URLs.
- **Recommendation**: Support optional external URL (e.g. link to Shopify, Amazon, or company store) with `rel="noopener noreferrer"` and click tracking.
- **Status**: **PENDING_DECISION**

### 3. Should the Gallery have a maximum image count?
- **Current State**: Currently unconstrained (typical usage 5-10 images).
- **Recommendation**: Cap at **15 photos** for MVP to protect page load speed, mobile bandwidth, and storage quotas.
- **Status**: **PENDING_DECISION**

### 4. What should happen when a published listing is edited by its owner?
- **Current State**: Saved edits update the business record immediately in database.
- **Recommendation**: For Day 1/Day 2 MVP prototype, keep direct update while logging timestamp. For enterprise moderation, implement draft revision staging.
- **Status**: **PENDING_DECISION**

### 5. Should published listing edits require moderation re-review?
- **Current State**: Status remains `published` on owner edits to allow live corrections.
- **Recommendation**: Minor edits (hours, phone, products) stay published; major identity changes (business name, category) could flag an admin review notice without delisting.
- **Status**: **PENDING_DECISION**

### 6. Should business owners later be able to add multiple managers or users?
- **Current State**: Strict 1 owner per business listing (`owner_user_id`).
- **Recommendation**: Retain 1:1 ownership for MVP. Multi-manager delegation (Agency/Manager invites) belongs in Phase 3 / Post-MVP.
- **Status**: **POST_MVP**

### 7. When should "Claim Listing" be introduced?
- **Current State**: Member-imported listings are unassigned or assigned to specific owners by admin. No public "Claim this business" workflow.
- **Recommendation**: Introduce Claim Listing during the Public Launch Phase, backed by phone/email verification against imported citation records.
- **Status**: **PLANNED_PHASE_3**

### 8. Is Automatic Website Generation planned for the next major phase?
- **Current State**: Public directory listing page (`/business/[slug]`) serves as the digital citation page.
- **Recommendation**: Micro-site/website generation (standalone custom domain or subdomain) is a distinct milestone planned after directory core metrics are proven.
- **Status**: **PLANNED_FUTURE**

### 9. Should WhatsApp OTP become mandatory, optional, or remain one of multiple login methods when activated?
- **Current State**: Multi-auth architecture: `Email Code (OTP)` (default), `WhatsApp OTP` (preview), `Password` (fallback).
- **Recommendation**: **Remain one of multiple methods (optional)**. WhatsApp OTP provides high local conversion in India, but Email OTP and Password provide essential redundancy if WhatsApp service is unreachable or user lacks data connectivity.
- **Status**: **RECOMMENDED: MULTI_METHOD**

---

## 6. Security, Privacy & Invariant Verification

1. **Auth Email != Business Contact Email**:
   - Authentication email (`owner@buzl.test`) is never automatically exposed on public listings.
   - Public contact email (`contact@teamreview.test`) is explicitly controlled by owner.
2. **Auth Phone != Business Phone**:
   - Authentication phone is stored solely in Supabase Auth GoTrue identity tables.
   - Business primary phone is stored in `public.businesses` and formatted for customer contact.
3. **Private Address & Geospatial Shielding**:
   - Storefront coordinates are stored in PostGIS for radius/bounding-box queries but suppressed from raw DOM leaks.
   - Service-area listings completely suppress physical address lines and coordinates.
4. **Tenant Isolation**:
   - RLS policies and server-side RPCs ensure Owner A cannot view, edit, or delete Owner B's listings.
5. **Inactive / Suspended User Enforcement**:
   - Suspended accounts are immediately blocked from session actions and dashboard routes.

---

## 7. Go / No-Go Decision

- **Verdict**: **GO**
- **Decision**: **APPROVED**
- **Blocking Issues**: **0**
- **Next Task Recommendation**: **TRACKING-AND-MEASUREMENT** (or **STAGING-REVIEW-FIXES** if team requests minor UX adjustments prior to instrumentation).
