# Buzl Business Listing App — Project Documentation

**Project:** Buzl Business Listing / Citation Platform  
**Status:** Planning / Phase 0  
**Primary goal:** Build a public business listing platform focused first on local SEO citations, with room to evolve into a broader local discovery product.

---

## 1. Project Vision

Buzl will build its own business listing platform where businesses can create a public, indexable profile containing their core NAP and service information.

The first use case is **citation building for Buzl Digital Solutions clients and members**.

Later, the platform can accept registrations from businesses outside the Buzl ecosystem and gradually expand into a more complete local business directory similar in structure to platforms such as Justdial, but with a cleaner SEO-first and citation-first architecture.

The platform should be built as a modern web application rather than a simple static directory.

---

## 2. Primary Goals

### Initial goals

1. Allow Buzl clients and members to register their businesses.
2. Create public business listing pages.
3. Store consistent business citation data.
4. Support categories, tags, services and locations.
5. Show the business on a map.
6. Make listing pages highly indexable by search engines.
7. Generate structured metadata suitable for local SEO.
8. Provide user accounts and a dashboard for managing listings.
9. Prepare the architecture for moderation and approval workflows.
10. Allow non-Buzl users to register later.

### Long-term possibilities

- Reviews and ratings
- Claim business workflow
- Featured / premium listings
- Lead generation
- Local search by city, category and service
- Subscription plans
- Verification badges
- Business analytics
- Citation management services
- API / integrations
- AI-assisted listing creation
- Google Business Profile integrations
- Local SEO tools inside the Buzl ecosystem

---

## 3. Primary Users

### Buzl Admin

Controls the platform and business directory.

Potential responsibilities:

- Manage listings
- Manage categories
- Manage tags
- Manage users
- Approve / reject businesses
- Detect duplicate listings
- Manage locations
- Edit SEO content
- Manage featured listings
- View system activity

Moderation may be technically prepared in V1 but enabled later.

### Buzl Client / Member

Initial core audience.

Can:

- Register
- Create a business listing
- Update business information
- Add services
- Select categories and tags
- Manage contact information
- Add website and social profiles
- Add business location
- Upload logo and business images
- Preview the public listing

### External Business User

Future public signup user.

Will eventually have similar listing capabilities, subject to verification and moderation rules.

### Public Visitor

No login required.

Can:

- Browse businesses
- Search businesses
- Browse categories
- Browse locations
- View listing profiles
- View contact information
- Open maps
- Visit the business website

---

## 4. Core Business Listing Data

The platform should support the following core citation information.

### Identity

- Business name
- Slug
- Business description
- Business logo
- Cover image
- Business type

### Contact

- Primary phone number
- Alternate phone number
- Email address
- Website URL
- WhatsApp number

### Address / NAP

NAP consistency is one of the most important requirements.

Store address components separately:

- Address line 1
- Address line 2
- Area / locality
- City
- District
- State
- Country
- Postal / PIN code
- Latitude
- Longitude

### Business information

- Primary category
- Secondary categories
- Tags
- Services
- Products, if applicable
- Service areas
- Business hours
- Year established, optional

### Social / external links

Potential fields:

- Facebook
- Instagram
- LinkedIn
- YouTube
- X / Twitter
- Google Business Profile
- Other relevant citation URLs

---

## 5. Categories and Tags

The platform should not use one flat category field.

Recommended structure:

```text
Category
    └── Subcategory
            └── Business
```

Example:

```text
Home Services
    └── Plumbing
            ├── Business A
            └── Business B
```

Tags provide additional discovery context.

Example:

```text
24-hour
Emergency service
Residential
Commercial
Premium
Tamil-speaking
```

Categories should have SEO-friendly public landing pages.

Examples:

```text
/categories/
 /categories/restaurants/
 /categories/digital-marketing/
 /categories/plumbers/
```

---

## 6. Location Architecture

Location should be a first-class part of the platform.

Recommended hierarchy:

```text
Country
    └── State
        └── District
            └── City
                └── Locality
```

This enables future pages such as:

```text
/chennai/
/chennai/digital-marketing/
/coimbatore/web-design/
/madurai/restaurants/
```

Exact route architecture will be finalized during SEO research.

---

## 7. Maps

Each business profile should support geographic coordinates.

Potential map providers will be researched before implementation.

Options may include:

- Google Maps
- Mapbox
- OpenStreetMap-based providers

V1 requirements:

- Store latitude and longitude.
- Show a map on the public listing.
- Provide directions / map link.
- Avoid unnecessary map API costs during development.

---

## 8. Public Listing Page

Every approved / public business should receive a dedicated canonical URL.

Example concept:

```text
/business/acme-digital-marketing-chennai
```

A public page may contain:

1. Business name
2. Logo
3. Primary category
4. Description
5. Phone
6. Email
7. Website
8. Address
9. Map
10. Business hours
11. Services
12. Categories
13. Tags
14. Social profiles
15. Related businesses
16. Structured data
17. Breadcrumbs

The listing page should prioritize clean citation information over visual clutter.

---

## 9. SEO and Citation Strategy

SEO is not an afterthought in this project.

It is part of the platform architecture.

### Core SEO requirements

- Server-rendered or statically optimized public pages
- Unique page titles
- Unique meta descriptions
- Canonical URLs
- XML sitemap
- Robots.txt
- Breadcrumbs
- Open Graph metadata
- Social sharing metadata
- Clean URLs
- Internal linking
- Strong Core Web Vitals
- Mobile-first rendering
- Proper heading hierarchy
- Accessible HTML

### Structured data

Potential schemas include:

- `LocalBusiness`
- Relevant LocalBusiness subtype
- `Organization`
- `WebSite`
- `BreadcrumbList`

Schema should be generated from actual business records.

Do not invent data.

### Citation integrity

The platform should preserve exact NAP information.

Important principle:

> Business name, address and phone number should remain consistent wherever that business is rendered inside the platform.

---

## 10. Search and Discovery

V1 search can remain intentionally simple.

Potential search dimensions:

- Business name
- Category
- Service
- Tag
- Location

Future search can include:

- Distance / near me
- Rating
- Open now
- Verified
- Featured
- Service radius

Do not over-engineer search infrastructure during the first release.

---

## 11. Authentication

Supabase Auth is currently the preferred authentication layer.

Potential login methods:

- Email + password
- Magic link
- OTP
- Google login later

User roles should support at minimum:

```text
admin
business_owner
user
```

Additional roles may be added later.

---

## 12. Moderation

Moderation is required architecturally, but it does not need to block the initial internal Buzl rollout.

Suggested listing states:

```text
draft
pending
published
rejected
suspended
archived
```

During early internal usage, Buzl-owned listings may be published automatically.

Later:

```text
User submits listing
        ↓
Pending review
        ↓
Admin reviews
        ↓
Approved / rejected
        ↓
Public listing
```

---

## 13. Technology Stack

### Frontend / application

**Next.js**

Recommended direction:

- Next.js App Router
- TypeScript
- Server Components where appropriate
- Server-side rendering / static generation for SEO pages

### Database / backend platform

**Supabase**

Supabase can provide:

- PostgreSQL
- Authentication
- Storage
- Row Level Security
- APIs
- Realtime capabilities if required

### Local development

The project should use a local Supabase environment through Docker / Supabase CLI.

Expected workflow:

```text
Developer machine
        ↓
Docker Desktop
        ↓
Supabase local stack
        ↓
Next.js development app
```

Database migrations should be version-controlled.

Production changes should be reproducible through migrations rather than manual dashboard edits wherever possible.

### Styling

The final styling approach will be selected after extracting the existing Buzl dashboard design system.

The project should reuse Buzl's established visual language rather than creating a disconnected new brand.

---

## 14. Design System Strategy

The existing Buzl dashboard is the visual reference.

Once access is available, extract:

- Brand colors
- Neutral colors
- Typography
- Font sizes
- Font weights
- Line heights
- Border radius
- Shadows
- Spacing scale
- Grid system
- Buttons
- Inputs
- Dropdowns
- Tables
- Cards
- Navigation
- Sidebar
- Alerts
- Badges
- Modal patterns
- Responsive behavior

Until then, use semantic placeholder tokens.

Example:

```css
--color-primary
--color-primary-hover
--color-background
--color-surface
--color-text
--color-text-muted
--color-border
--color-success
--color-warning
--color-error
```

Do not hard-code a temporary visual identity throughout the application.

All UI should consume centralized design tokens.

---

## 15. Design Extraction Plan

When dashboard login becomes available:

1. Open the Buzl dashboard.
2. Capture representative pages.
3. Run a design-system extraction extension if useful.
4. Obtain CSS / source styles if available.
5. Record typography and spacing.
6. Capture key components.
7. Convert findings into one stable design specification.

Suggested screenshots:

- Main dashboard
- Sidebar / navigation
- Data table page
- Form page
- Detail page
- Settings page
- Modal / popup
- Mobile view if available

A small set of representative screenshots is preferable to hundreds of images.

Final extracted design data should become:

```text
docs/design/DESIGN_SYSTEM.md
```

Agents should read the documentation rather than repeatedly reverse-engineering screenshots.

---

## 16. Agent Development Strategy

Development will involve multiple AI coding agents.

Primary:

- OpenAI Codex

Fallback / continuation:

- Google Antigravity

Potential additional agents may be used later.

The project must therefore be **agent-independent**.

No important project knowledge should exist only inside a Codex conversation or Antigravity session.

### Core principle

> Git + repository documentation are the persistent project memory.

Agents are interchangeable execution engines.

---

## 17. Agent Handoff Workflow

Typical workflow:

```text
ChatGPT research / planning
        ↓
Finalized repository documentation
        ↓
Codex implementation
        ↓
Tests
        ↓
Update CURRENT_STATE.md
        ↓
Git commit
        ↓
Continue with Codex
        OR
Switch to Antigravity
        ↓
New agent reads repository state
        ↓
Continue from same checkpoint
```

When Codex credits become low:

1. Finish the current atomic task.
2. Run tests.
3. Update current state.
4. Commit changes locally.
5. Open the same repository with Antigravity.
6. Ask Antigravity to read the project control files.
7. Continue from the latest commit.

This prevents agent-switching from blocking development.

---

## 18. Token Optimization Strategy

Codex should primarily **implement**, not conduct broad exploratory research.

Use ChatGPT for:

- Internet research
- Product research
- Competitor analysis
- Architecture discussion
- SEO research
- GitHub repository evaluation
- Feature planning
- Decision making

Then convert those findings into concise repository documents.

### Avoid prompts such as

> Read the whole repository, research every option and build the entire platform.

### Prefer

> Read `AGENTS.md`, `docs/CURRENT_STATE.md` and `docs/features/business-listing.md`. Implement Task BL-04 only.

This reduces context usage and makes execution easier to verify.

---

## 19. Recommended Repository Organization

```text
buzl-listing/
│
├── AGENTS.md
├── README.md
├── PLAN.md
├── STACK.md
├── WORKFLOW.md
├── .gitignore
│
├── app/
│
├── components/
│
├── lib/
│
├── public/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│   ├── PROJECT_DOCUMENTATION.md
│   ├── CURRENT_STATE.md
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── SEO.md
│   ├── SECURITY.md
│   ├── DECISIONS.md
│   │
│   ├── design/
│   │   ├── DESIGN_SYSTEM.md
│   │   └── DESIGN_TOKENS.md
│   │
│   ├── features/
│   │   ├── authentication.md
│   │   ├── business-listings.md
│   │   ├── categories.md
│   │   ├── locations.md
│   │   ├── search.md
│   │   └── moderation.md
│   │
│   └── exec-plans/
│       ├── PHASE_00_FOUNDATION.md
│       ├── PHASE_01_RESEARCH.md
│       └── PHASE_02_MVP.md
│
├── skills/
│   ├── HANDOFF.md
│   ├── QUALITY_GATE.md
│   ├── DATABASE_CHANGES.md
│   └── UI_IMPLEMENTATION.md
│
└── .research/
    ├── competitors/
    ├── github/
    ├── seo/
    ├── screenshots/
    ├── experiments/
    └── notes/
```

---

## 20. Research Folder

`.research/` is intentionally temporary and should not be committed.

Add:

```gitignore
.research/
```

Use it for:

- Competitor notes
- GitHub repository analysis
- Raw screenshots
- Temporary exports
- Experimental prompts
- Benchmark results
- Architecture alternatives
- Rough notes

Stable conclusions should move from `.research/` into `docs/`.

Example:

```text
.research/github/directory-repos.md
        ↓ research completed
docs/DECISIONS.md
        ↓
"Decision: build on our own Next.js/Supabase architecture."
```

---

## 21. Core Project Control Files

### `AGENTS.md`

Very short instructions every coding agent must follow.

It should contain:

- Files to read first
- Coding rules
- Testing requirements
- Documentation update rules
- Git / handoff expectations
- Forbidden actions

Keep it concise.

### `docs/CURRENT_STATE.md`

This is the most important agent handoff document.

It should record:

```text
Current phase
Completed work
Current implementation
Known problems
Tests status
Next exact task
Relevant files
Database migration status
```

Update it before switching agents.

### `PLAN.md`

High-level product roadmap.

### `STACK.md`

Approved technologies and versions.

### `WORKFLOW.md`

Human + agent development process.

### `docs/DECISIONS.md`

Architecture Decision Record-lite.

Example:

```text
DEC-001
Decision: Use Next.js.
Reason: SEO + application architecture.

DEC-002
Decision: Use Supabase.
Reason: PostgreSQL, Auth, Storage and strong local tooling.

DEC-003
Decision: Git is the cross-agent handoff mechanism.
```

---

## 22. Proposed Initial Database Entities

This is preliminary and will be refined after research.

### profiles

Application user profile.

Potential fields:

```text
id
user_id
full_name
phone
avatar_url
role
created_at
updated_at
```

### businesses

Core business record.

Potential fields:

```text
id
owner_id
name
slug
description
email
phone
alternate_phone
whatsapp
website
logo_url
cover_url
status
primary_category_id
latitude
longitude
created_at
updated_at
published_at
```

### business_addresses

```text
id
business_id
address_line_1
address_line_2
locality
city
district
state
country
postal_code
latitude
longitude
```

### categories

```text
id
parent_id
name
slug
description
status
```

### tags

```text
id
name
slug
```

### business_tags

```text
business_id
tag_id
```

### services

```text
id
business_id
name
slug
description
```

### business_hours

```text
id
business_id
day_of_week
opens_at
closes_at
is_closed
```

### business_social_links

```text
id
business_id
platform
url
```

Additional tables will be finalized after schema research.

---

## 23. Security Requirements

Security should be built in from the beginning.

Minimum expectations:

- Supabase Row Level Security
- Role-based permissions
- Server-side authorization
- Input validation
- Sanitized user-generated content
- Secure upload rules
- Rate limits where appropriate
- Prevent unauthorized listing edits
- Prevent arbitrary admin role assignment
- Protect internal admin routes
- Audit sensitive operations later

Never rely only on hidden UI elements for authorization.

---

## 24. Performance Requirements

The directory may eventually contain large numbers of public pages.

Design for:

- Fast initial load
- Minimal JavaScript on public listing pages
- Optimized images
- Pagination
- Database indexes
- Query efficiency
- Cached public content where appropriate
- Scalable sitemap generation
- Lazy-loaded maps
- Core Web Vitals

Do not introduce premature distributed infrastructure during MVP.

---

## 25. Accessibility Requirements

Target practical WCAG 2.2 AA compliance.

Important areas:

- Keyboard navigation
- Visible focus states
- Semantic headings
- Form labels
- Error states
- Contrast
- Touch targets
- Alt text
- Screen-reader-friendly controls

---

## 26. Git Strategy

Git should act as the persistent checkpoint between agents.

Suggested initial branch structure:

```text
main
develop
feature/*
fix/*
```

For a small early-stage team, `main + feature branches` may be sufficient.

Commit after coherent units of work.

Example:

```text
feat(auth): add Supabase email authentication
feat(listings): create business onboarding form
feat(seo): add LocalBusiness JSON-LD
fix(listing): validate duplicate slugs
docs: update current project state
```

Before switching agents, create a clean local commit.

---

## 27. Phase Plan

### Phase 0 — Project Control Layer

No product coding.

Tasks:

- Initialize repository
- Create documentation structure
- Create `.research/`
- Add `.research/` to `.gitignore`
- Create `AGENTS.md`
- Create `PLAN.md`
- Create `STACK.md`
- Create `WORKFLOW.md`
- Create `CURRENT_STATE.md`
- Commit

Goal:

> Make the repository safe for agent switching before implementation begins.

---

### Phase 1 — Research

Research should primarily happen outside Codex to conserve coding tokens.

Topics:

- Competitor directory architecture
- Justdial-style information architecture
- Citation requirements
- Local SEO
- Schema.org LocalBusiness
- URL architecture
- Category taxonomy
- Location taxonomy
- Maps
- Open-source directory projects
- GitHub projects
- Next.js directory implementations
- Supabase directory implementations
- Duplicate business handling
- Moderation approaches

Raw findings:

```text
.research/
```

Final decisions:

```text
docs/
```

---

### Phase 2 — Product Specification

Lock:

- MVP scope
- User journeys
- Business fields
- Category model
- Location model
- URL strategy
- SEO requirements
- Authentication
- Permissions
- Database schema
- Listing lifecycle

No major implementation should begin before these are stable.

---

### Phase 3 — Technical Foundation

Build:

- Next.js app
- TypeScript configuration
- Supabase local environment
- Database migrations
- Authentication
- Application layout
- Design-token layer
- Validation utilities
- Testing setup

---

### Phase 4 — Business Listing MVP

Implement:

```text
Register / login
        ↓
Create business
        ↓
Business details
        ↓
Address
        ↓
Category
        ↓
Services / tags
        ↓
Map location
        ↓
Publish
        ↓
Public listing URL
```

---

### Phase 5 — Directory Discovery

Implement:

- Home
- Search
- Category pages
- Location pages
- Category + location landing pages
- Related listings

---

### Phase 6 — SEO Hardening

Implement / verify:

- Metadata
- Canonicals
- JSON-LD
- Sitemap
- Robots
- Breadcrumbs
- Pagination rules
- Internal linking
- Crawl rules
- Performance
- Accessibility

---

### Phase 7 — Admin and Moderation

Implement:

- Listing queue
- Approve
- Reject
- Suspend
- Duplicate detection
- Category administration
- User administration
- Audit information

Enable moderation for external registrations when needed.

---

## 28. MVP Boundary

The first version should avoid trying to become Justdial immediately.

MVP:

```text
Authentication
Business onboarding
Business management
Categories
Tags
Services
Address
Map
Public listing page
Basic search
SEO
Schema
Sitemap
Admin foundation
```

Not required initially:

```text
Consumer reviews
Complex ranking engine
Advertising marketplace
Chat
Booking engine
Payment system
Lead marketplace
Recommendation AI
Native mobile app
```

These can be added after the citation product is working reliably.

---

## 29. Build From Scratch vs Open Source

Current direction:

> Research open-source directories for architecture ideas and reusable patterns, but do not commit to cloning an existing product before evaluating code quality, licensing, maintainability and fit.

The likely preferred strategy is a hybrid approach:

- Own Buzl database model
- Own product architecture
- Own SEO strategy
- Own UI
- Reuse proven open-source packages
- Study strong open-source directory projects
- Port isolated patterns where licensing allows

This avoids inheriting an unsuitable legacy architecture just to save a small amount of initial development time.

---

## 30. Immediate Next Step

The next task is **Phase 0 only**.

No business application functionality should be implemented yet.

The coding agent should:

1. Read this document.
2. Create the proposed control files.
3. Create the documentation folders.
4. Create the `.research/` folders.
5. Add `.research/` to `.gitignore`.
6. Add concise starter content to the control files.
7. Initialize Git if required.
8. Create a clean Phase 0 checkpoint.
9. Stop.

After that checkpoint, return to product research before starting the Next.js application.

---

## 31. Codex Starter Instruction

After placing this document in:

```text
docs/PROJECT_DOCUMENTATION.md
```

use a prompt similar to:

```text
Read docs/PROJECT_DOCUMENTATION.md.

Execute Phase 0 only.

Create the repository control/documentation structure described in the document.
Do not implement the application yet.
Do not install unnecessary dependencies.
Add .research/ to .gitignore.
Create concise AGENTS.md, PLAN.md, STACK.md, WORKFLOW.md and docs/CURRENT_STATE.md.
Create the documented folders and placeholder spec files where useful.

When finished:
1. verify the structure,
2. update docs/CURRENT_STATE.md,
3. show me exactly what was created,
4. stop before Phase 1 or any application coding.
```

---

## 32. Project Principles

The project should follow these rules throughout development:

1. **Citation accuracy first.**
2. **SEO is architecture, not a later plugin.**
3. **Buzl owns the data model.**
4. **Public pages should remain fast and indexable.**
5. **Documentation is shared agent memory.**
6. **Git is the cross-agent checkpoint.**
7. **Research and implementation are separate activities.**
8. **Raw research stays out of Git.**
9. **Agents receive small, explicit tasks.**
10. **Never invent business information for published listings.**
11. **Design tokens must be centralized.**
12. **Security rules live on the server/database, not only in the UI.**
13. **Build the citation MVP before expanding into a giant directory.**

---

**End of project documentation**
