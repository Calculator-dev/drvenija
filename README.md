# Drvenija

Monorepo workspace for the Drvenija customer webshop, admin CRM, and Fastify API.

## Apps

- `apps/storefront` - Next.js multilingual webshop frontend
- `apps/api` - Fastify + TypeScript + Drizzle backend scaffold
- `apps/crm` - React + TanStack Query admin frontend scaffold

## Notes

- Bosnian is the default storefront language.
- English routes live under `/en`.
- The storefront can use local seed data during development until the API is wired with production data.

## Database

The API uses PostgreSQL via Drizzle. Set `DATABASE_URL` in `apps/api/.env` (git-ignored).
Node.js 22+ is required; API commands load that file automatically.

- `pnpm --dir apps/api db:check`: read-only connectivity and table check.
- `pnpm --dir apps/api db:generate`: generate a migration after schema changes.
- `pnpm --dir apps/api db:migrate`: apply reviewed migrations to the configured database.
- `pnpm dev:api`: start the API with its environment file.

The initial migration creates seven application tables and enables row-level security
without public policies. The backend connection must use a trusted database role with
access to these tables; never expose DATABASE_URL in a frontend environment variable.
Public catalogue reads and order creation use PostgreSQL. Orders are saved atomically
with server-side prices. No demo records are automatically inserted.

The storefront reads the live public catalogue from the API and uses database UUIDs
for checkout. The CRM is still a
prototype; admin endpoints require a verified Supabase session and a server-managed admin role.

## CRM admin authentication

The CRM uses Supabase email/password sign-in. The API checks every admin request with
Supabase Auth `getUser(accessToken)` and requires a confirmed email and
`app_metadata.role === "admin"`. Editable `user_metadata` never grants access.
There is no public admin signup or role-grant endpoint.

1. In `apps/api/.env`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`
   (legacy `SUPABASE_ANON_KEY` is also supported).
2. Copy `apps/crm/.env.example` to `apps/crm/.env.local` and configure
   `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`
   (or legacy `VITE_SUPABASE_ANON_KEY`). Use the same Supabase project.
   Never put a service-role key or database password in a `VITE_` variable.
3. Create or select a confirmed email/password user in Supabase Auth, and assign
   `app_metadata.role` to `admin` through a trusted administrative operation.
   Preserve existing app metadata when updating it. Removing this role denies
   subsequent API requests immediately because the API retrieves current user data.
4. Restart the API and CRM after configuration changes, then sign in.

`GET /admin/me` returns only the verified administrator's ID and email.
Missing/invalid sessions return 401, non-admin accounts return 403, and unavailable
or unconfigured authentication returns 503. The CRM verifies access before mounting
the dashboard, attaches the access token to API requests, and clears cached data
on auth changes and sign-out. Sign-out affects the current browser session.

Run `pnpm --dir apps/api test` for authorization and order tests, and
`pnpm --dir apps/crm build` for the CRM build. Tests mock Supabase responses;
a real sign-in check requires the configuration and an admin account above.
Admin products and categories use PostgreSQL. Dashboard and order views still use prototype data.

Admin provisioning: with SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) configured, run `node --env-file=.env scripts/create-admin.mjs EMAIL` from `apps/api` using Node 22+. This creates an unconfirmed user with no password and the admin role, or grants that role to the existing user while preserving other app metadata. It sends no email. Password setup links should redirect to the CRM with `?setup=password`, and the CRM URL must be allowed in Supabase Auth redirect settings.

## Starting local development

Use Node.js 22+ (`nvm use 25` on the current development computer), then run
`npm start` from the repository root. This starts the API on port 4000, the CRM
on port 3000, and the storefront on port 3001. Ctrl+C stops all three.
Stop existing development servers before starting this command.

For separate terminals, use `npm run dev:api`, `npm run dev:crm`, and
`npm run dev:storefront`. The API requires `apps/api/.env`; CRM configuration
is in `apps/crm/.env.local`. Dependency installation still uses pnpm and its
workspace lockfile; npm is supported for running these scripts.

## Adding products

In the CRM, select **New product** or open `/products/new`. Required fields are
Bosnian name and description, SKU, category, material/type, price in BAM,
dimensions, production time, and availability. Optional English fields fall back
to Bosnian. A new category can be created in the same transaction as the product.
Slugs and SEO defaults are generated automatically. Product listing and creation
use authenticated `/admin/products`; category selection uses `/admin/categories`.
Duplicate SKUs return a conflict without saving a partial product/category.
The storefront uses the public catalogue API.

## Editing products

Choose **Edit** on a product in the CRM catalogue. The form at
`/products/:id/edit` loads saved fields and submits a full update through
`PUT /admin/products/:id`; `GET /admin/products/:id` loads the record.
Both endpoints require admin authentication. Updates preserve existing slugs,
refresh SEO defaults and `updatedAt`, and return 404 for missing products or
409 for duplicate SKUs. Category creation and product updates are transactional.
Restart the API after backend code changes if it is already running.

## Reviewing orders

The CRM order list uses live database records. Open **Details** to view the
customer, delivery address, notes, ordered products, quantities, personalization,
and total amount. A submitted order can be accepted once, or declined with a
required explanation. The decision, review time, decline reason, and notification
time are saved in the database.

Customer decision emails are sent through Resend. Configure `RESEND_API_KEY` and
`ORDER_EMAIL_FROM` in `apps/api/.env`; the sender must use a domain verified in
Resend. If delivery is not configured or fails, the decision remains saved and
the CRM displays a warning so the customer can be contacted manually.

The same Resend configuration sends an immediate receipt after a customer places
an order. It includes the order number, products, total, and delivery address.
Email failures never roll back a successfully saved order; the CRM order details
show whether the receipt was sent.

## Product images

The product form accepts up to eight JPEG, PNG, or WebP images (10 MB each).
Uploads go through the authenticated API (`POST /admin/media` with the file as
its binary body and the matching Content-Type). The backend decodes and checks
images, rejects animation and oversized dimensions, strips metadata, and converts
them to WebP at a maximum of 2400 pixels per side.

Configure BACKBLAZE_ENDPOINT, BACKBLAZE_REGION, BACKBLAZE_KEY_ID,
BACKBLAZE_APP_KEY, and BACKBLAZE_BUCKET_NAME in `apps/api/.env`. The application
key needs read/write access to the configured bucket and the `products/` prefix.
The bucket can remain private; no browser CORS configuration is needed. Preview
links expire after one hour; reopen the edit page to renew them.

Choose a primary image and enter Bosnian/English image descriptions. Saving the
product links its images in the same database transaction as product changes.
Removing an image from the form takes effect on save and detaches it from the
product; it does not delete the original object from Backblaze. Uploads abandoned
before saving remain unlinked for future cleanup. Existing product updates that
omit `images` preserve all attachments; sending `images: []` detaches them.

Run `node --env-file=.env scripts/check-storage.mjs` in `apps/api` with Node 22+
to upload, read, and remove a generated test image. This needs delete permission
for the temporary test object in addition to normal read/write permissions.

## Live webshop catalogue

The webshop loads `GET /public/catalogue` on the server for categories, products,
translations, SEO, and attached images. The shop, featured products, product detail
pages, related products, and sitemap all use this data. Empty catalogues show no
sample products; failures show a retry page. Catalogue fetches use `no-store` so
CRM changes appear on a fresh page load. No database credentials go to the browser.

Set `API_URL` in `apps/storefront/.env.local` for server requests, and
`NEXT_PUBLIC_API_URL` for browser checkout requests. Both default to
`http://localhost:4000` locally. Set `NEXT_PUBLIC_SITE_URL` to the webshop's origin
for canonical links and SEO. Restart after changing environment variables.

Attached product images have stable `/api/media/:id` webshop URLs. The API checks
that each asset is attached to a product before redirecting to a temporary signed
Backblaze URL, allowing private buckets and persistent cart image links. All saved
products are public (there is no draft/publish switch yet). Existing localized
`/public/products`, `/public/products/:slug`, and `/public/categories` endpoints
remain available. The new catalogue endpoint provides full bilingual records.
