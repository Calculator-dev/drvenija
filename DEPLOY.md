# Deploying Drvenija (free plans)

| Part | Where | Plan |
| --- | --- | --- |
| Webshop (`apps/storefront`) | Cloudflare Workers, via OpenNext | Workers Free |
| CRM (`apps/crm`) | Cloudflare Workers static assets | Workers Free |
| Keep-alive (`deploy/keepalive`) | Cloudflare Worker with a cron trigger | Workers Free |
| API (`apps/api`) | Render web service (`render.yaml`) | Render Free |
| Database, admin login | Supabase (already in use) | Supabase Free |
| Product photos | Backblaze B2 (already in use) | 10 GB free |
| Emails | Resend (already in use) | Free tier |

The API cannot run as a plain Cloudflare Worker (it uses Fastify, a Postgres driver and the
`sharp` image library), and Cloudflare's container hosting needs a paid plan, so the API runs
on Render's free plan. The keep-alive Worker requests the API every 10 minutes so Render does
not put it to sleep and Supabase does not pause the database.

## 1. Database

Back up the database (Supabase → Database → Backups), then apply migrations either locally:

```bash
pnpm --dir apps/api db:migrate
```

or from GitHub: add the repository secret `DATABASE_URL` (step 4) and run **Actions →
Database migrations → Run workflow**. Do this again whenever a pull request lists a new
migration, before merging it.

## 2. API on Render

1. In Render: **New → Blueprint**, choose this repository. Render reads `render.yaml`.
2. Fill in the values it asks for (same as `apps/api/.env`):
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `BACKBLAZE_ENDPOINT`, `BACKBLAZE_REGION`, `BACKBLAZE_KEY_ID`, `BACKBLAZE_APP_KEY`,
     `BACKBLAZE_BUCKET_NAME`
   - `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, `INQUIRY_NOTIFY_EMAIL`
   - `STOREFRONT_URL`: the webshop address (step 5), e.g. `https://drvenija.ba`
   - `CORS_ORIGINS`: the webshop and CRM addresses, comma-separated, e.g.
     `https://drvenija.ba,https://crm.drvenija.ba` (you can update this after step 5)
3. After the first deploy, note the API address, e.g. `https://drvenija-api.onrender.com`, and
   check `https://drvenija-api.onrender.com/health` shows `{"ok":true}`.

Render redeploys the API on every push to `master`.

## 3. Cloudflare

1. Create a free Cloudflare account. Note the **Account ID** (Workers & Pages → right sidebar).
2. **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** template. Copy it.
3. Image resizing for the webshop uses Cloudflare Images. If the dashboard asks you to enable
   Images (Images → Transformations), enable the free plan.

## 4. GitHub settings

In the repository: **Settings → Secrets and variables → Actions**.

Secrets:

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 3 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 3 |
| `DATABASE_URL` | only needed for the "Database migrations" workflow |

Variables:

| Name | Example |
| --- | --- |
| `CLOUDFLARE_DEPLOY` | `true` (deploys are skipped until this is set) |
| `API_URL` | `https://drvenija-api.onrender.com` (or `https://api.drvenija.ba`) |
| `SITE_URL` | `https://drvenija.ba` |
| `CONTACT_PHONE` | `+38761234567` (WhatsApp/Viber button and footer) |
| `CONTACT_EMAIL` | `info@drvenija.ba` |
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | the Supabase publishable (anon) key — never the secret key |

## 5. Deploy

Run **Actions → Deploy to Cloudflare → Run workflow** (later it runs on every merge to
`master`). It deploys three Workers:

- `drvenija-storefront` — the webshop, at `https://drvenija-storefront.<your-subdomain>.workers.dev`
- `drvenija-crm` — the CRM, at `https://drvenija-crm.<your-subdomain>.workers.dev`
- `drvenija-keepalive` — opening its URL runs one ping and shows the result

## 6. Your own domain (optional, free)

1. Add `drvenija.ba` to Cloudflare (Websites → Add a domain) and change the nameservers at your
   registrar to the two Cloudflare gives you.
2. Workers & Pages → `drvenija-storefront` → Settings → Domains & Routes → **Add custom domain**
   `drvenija.ba` (and `www.drvenija.ba`). Same for `drvenija-crm` → `crm.drvenija.ba`.
3. Render → `drvenija-api` → Settings → Custom Domains → `api.drvenija.ba`; add the CNAME record
   Render shows in Cloudflare DNS (set it to "DNS only", grey cloud).
4. Update `SITE_URL` and `API_URL` (GitHub variables), `STOREFRONT_URL` and `CORS_ORIGINS`
   (Render), and the keep-alive's API address, then run the deploy workflow again.
5. In Supabase → Authentication → URL Configuration, allow the CRM address as a redirect URL.
6. In Resend, verify the domain used in `ORDER_EMAIL_FROM`.

## Free-plan limits to know

These change over time; check each provider's pricing page.

- **Cloudflare Workers Free**: a daily request limit (100,000 at the time of writing) and a small
  CPU-time budget per request. If the webshop logs "exceeded CPU" errors, the Workers Paid
  plan ($5/month) removes the limit. The webshop bundle is about 1.5 MB compressed, within
  the free plan's size limit.
- **Render Free**: 512 MB RAM, 750 hours per month (enough for one service running all month),
  sleeps after 15 minutes without requests — the keep-alive Worker prevents that.
- **Supabase Free**: 500 MB database; projects pause after a week without activity — the
  keep-alive's requests count as activity.
- **Cloudflare Images**: a monthly number of free image transformations; each product photo
  in each displayed size counts once.
- **Resend Free**: a daily and monthly email limit.

## Previewing the Cloudflare build locally

```bash
pnpm --filter @drvenija/storefront cf:preview
```

This builds the webshop for Workers and runs it in Cloudflare's local runtime on port 8787
(set `API_URL` / `NEXT_PUBLIC_API_URL` in `apps/storefront/.env.local`).
