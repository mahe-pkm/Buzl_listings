# Docker Workflow

This repository packages the Buzl Listing Next.js application only. Supabase
remains the existing local CLI stack or the isolated Buzl Supabase stack on the
VPS; this Compose file does not create a second database, Auth service, or
Storage service.

## Prerequisites

- Docker Desktop with Docker Compose v2.
- Node.js and npm for native development and repository checks.
- Supabase CLI for the local Supabase stack.

## Local Supabase and native development

Start the existing repository-specific local Supabase stack:

```powershell
npx supabase start
```

For native Next.js development, create `.env.local` from the values reported by
`npx supabase status`, then run:

```powershell
npm ci
npm run dev
```

## Docker Desktop workflow

Copy the Docker template and replace the public Supabase values with the local
values from `npx supabase status`:

```powershell
Copy-Item .env.docker.example .env.docker.local
```

Run the application container:

```powershell
docker compose --env-file .env.docker.local up --build
```

Open `http://localhost:3000`. The container health endpoint is
`http://localhost:3000/api/health` and returns only `{ "status": "ok" }`.

`NEXT_PUBLIC_*` values are supplied at build time because Next.js compiles them
into browser code. `SUPABASE_INTERNAL_URL` is server-only and lets Next.js
server code reach local Supabase from inside Docker. On Docker Desktop it uses
`http://host.docker.internal:54321`; browser code continues to use
`http://127.0.0.1:54321`.

Do not prefix `SUPABASE_INTERNAL_URL` with `NEXT_PUBLIC`. Do not put
`SUPABASE_SERVICE_ROLE_KEY`, passwords, or other secrets in the image, Docker
build arguments, Git, or browser code. Privileged operational scripts receive
their service-role key only from a local or server runtime environment.

## Common commands

```powershell
# Build without starting
docker build -t buzl-listing:local .

# Inspect the resolved Compose configuration
docker compose --env-file .env.docker.local config

# Background start and logs
docker compose --env-file .env.docker.local up -d --build
docker compose logs -f app

# Restart only the application
docker compose restart app

# Stop containers without deleting Supabase data
docker compose down
```

Never use `docker compose down -v` as part of normal Buzl application work.
The application container is stateless; Buzl data belongs to Supabase.

## Local authentication fixtures

Authenticated smoke tests use deterministic local-only fixtures. They never
use a committed password and the fixture reset refuses a non-loopback Supabase
URL. Use `scripts/local-auth-fixtures.example.env` as the variable reference,
load the values only into your local shell, then run:

```powershell
$env:BUZL_LOCAL_FIXTURES = "true"
$env:BUZL_MUTATION_ENV = "local"
$env:APP_ENV = "local"
$env:LOCAL_SUPABASE_URL = "http://127.0.0.1:54321"
$env:LOCAL_SUPABASE_SERVICE_ROLE_KEY = "<local-service-role-key>"
$env:LOCAL_FIXTURE_OWNER_EMAIL = "owner@buzl.test"
$env:LOCAL_FIXTURE_OWNER_PASSWORD = "<local-owner-password>"
$env:LOCAL_FIXTURE_MEMBER_EMAIL = "member@buzl.test"
$env:LOCAL_FIXTURE_MEMBER_PASSWORD = "<local-member-password>"
$env:LOCAL_FIXTURE_ADMIN_EMAIL = "admin@buzl.test"
$env:LOCAL_FIXTURE_ADMIN_PASSWORD = "<local-admin-password>"
npm run test:fixtures:auth
```

The command creates a missing fixture, or resets an existing local fixture's
password, role metadata, profile name, and expected Buzl Member identifiers
without creating duplicates. Then run authenticated smoke tests with the same
local environment:

```powershell
$env:TEST_BASE_URL = "http://localhost:3000"
npm run test:smoke:auth
```

Scripts that create, update, or delete test data also require
`BUZL_MUTATION_ENV=local` and reject any non-loopback target. A staging mutation
requires `BUZL_MUTATION_ENV=staging`, `BUZL_ENV=staging`,
`ALLOW_STAGING_MUTATIONS=true`, and an exact `STAGING_MUTATION_TARGET_HOST`.
`APP_ENV=production` rejects all guarded mutations.

## Troubleshooting

- **Cannot connect to Supabase from server-rendered routes:** confirm local
  Supabase is running and that `SUPABASE_INTERNAL_URL` uses
  `host.docker.internal`, not `127.0.0.1`.
- **Browser cannot connect to Supabase:** confirm
  `NEXT_PUBLIC_SUPABASE_URL` is the browser-reachable local address, normally
  `http://127.0.0.1:54321`.
- **Build-time public configuration is stale:** rebuild with
  `docker compose --env-file .env.docker.local up --build` after changing any
  `NEXT_PUBLIC_*` value.
- **Port 3000 is occupied:** stop the conflicting process or change the host
  side of the `3000:3000` mapping in `compose.yml`.

## VPS deployment concept

The verified staging topology is:

```text
listing.rclk.in -> HTTPS reverse proxy -> Buzl Next.js container
api-listing.rclk.in -> isolated Buzl Supabase stack
```

The VPS uses its own `buzl-listing` Compose project and reverse-proxy network.
The repository's `deploy/hostinger-vps/docker-compose.app.yml` is the VPS
overlay; it is intentionally not the local Compose file. Rebuild and restart
only the Buzl application container after a reviewed Git checkpoint. Do not
modify the unrelated VPS Supabase project.

## Update and rollback

1. Check out a reviewed Git commit.
2. Supply the server environment file outside the repository.
3. Build the application image and recreate only the Buzl application service.
4. Verify `/api/health`, the public homepage, and required authenticated flows.
5. Roll back by checking out the previous reviewed commit and rebuilding the
   same application service.

No database migration, seed, or data-volume operation is part of this
application-container rollback process.

The VPS overlay sets `APP_ENV=staging`. The demo credential helper is available
only to staging detection and always returns 404 when `APP_ENV=production`,
even if demo fixture environment variables are present.
