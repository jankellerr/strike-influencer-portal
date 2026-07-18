# Strike Influencer Portal

Lets Strike's influencers self-serve their coupon sales data, coupon metrics, per-product UTM short links, and click analytics — synced from Shopify (catalog) and Yampi (checkout/orders/coupons).

See `docs/PLAN.md`-equivalent context in the project history for the full architecture. This README covers day-to-day setup.

## Prerequisites / one-time provisioning

### 1. Postgres database (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the pooled connection string it gives you (starts with `postgresql://...`).
3. Put it in `.env` as `DATABASE_URL`.

### 2. Yampi API credentials

1. In the Yampi admin, go to **Perfil > Credenciais de API** (top-right).
2. Copy the **User Token** and **User Secret Key** into `.env` as `YAMPI_USER_TOKEN` and `YAMPI_SECRET_KEY`.
3. Your store's alias (the subdomain-like slug in your Yampi admin URL) goes in `YAMPI_ALIAS`.
4. Create a webhook in Yampi pointing at `https://<your-deployed-domain>/api/webhooks/yampi`, subscribed to `order.created`, `order.paid`, and `order.status.updated`. Yampi will ask you to set a secret for it — put that value in `YAMPI_WEBHOOK_SECRET`. This app verifies every inbound webhook against the `X-Yampi-Hmac-SHA256` header using that secret; requests that don't match are rejected with 401.

> Note: Yampi's public docs don't publish an exhaustive JSON schema for the order webhook payload. The shape used in `src/lib/yampi/upsertOrder.ts` (`YampiOrderData`) was confirmed against real orders via the REST API (`GET /orders`, `GET /orders/{id}`), which should share the same shape as the webhook's `resource` field — but double check the first time a real webhook actually fires. Two things the docs got wrong that are worth knowing: there is no `paid_at` field on an order at all (dropped from the original design), and the `scroll_id` cursor the orders list endpoint returns is always `null` on this account — pagination uses `page`/`meta.pagination.total_pages` instead, same as the coupons endpoint.

### 3. Shopify custom app

Shopify retired the old "Develop apps in admin" static-token flow — custom apps are now created in the [Dev Dashboard](https://dev.shopify.com/dashboard).

1. In the Dev Dashboard: **Apps > Create app > Start from Dev Dashboard**. Name it, e.g. "Strike Influencer Portal".
2. **Versions** tab: set any app URL placeholder, add scope `read_products` only, pick the newest Webhooks API version, **Release**.
3. **Home** tab: **Install app**, select Strike's store, **Install**. (Requires the app and store to be in the same Shopify organization.)
4. **Settings** tab: copy **Client ID** and **Client secret** into `.env` as `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. Also set `SHOPIFY_STORE_DOMAIN` to `your-store.myshopify.com`.
5. In the Dev Dashboard app's **Configuration** (or **URLs**) settings, add `http://localhost:3000/api/shopify/oauth/callback` to the allowed redirect URLs (add the production URL too once deployed).
6. **Get the real access token** — this is the part that differs from most tutorials: on a production store, the `client_credentials` grant silently returns a token with no scopes (it only works on Shopify dev stores). Instead, run the app locally (`npm run dev`) and visit `http://localhost:3000/api/shopify/oauth/start` in your browser. You'll be asked to approve access on the Shopify side; after approving, the callback page shows a permanent offline access token — copy it into `.env` as `SHOPIFY_ADMIN_ACCESS_TOKEN`. This is a one-time step.

### 4. Resend (influencer login emails)

Influencers log in via a magic link sent to their email — no passwords for them.

1. Sign up at [resend.com](https://resend.com), create an API key, put it in `.env` as `RESEND_API_KEY`.
2. **Important limitation**: until you verify a sending domain (e.g. `strikeco.com.br`) in Resend, it only lets you send to the email address on your own Resend account (sandbox mode) — real influencers won't receive anything. Verify a domain (Resend walks you through adding a few DNS records) before relying on this for real influencers.
3. Set `EMAIL_FROM` to something like `Strike Influencer Portal <login@strikeco.com.br>` once the domain is verified (or `onboarding@resend.dev` for sandbox testing to your own address only).

### 5. App secrets

- `AUTH_SECRET` — generate with `openssl rand -base64 32`. Signs both the admin session cookie and the influencer session cookie.
- `CRON_SECRET` — generate the same way. When set, Vercel Cron automatically sends it as `Authorization: Bearer <value>`, which is how `/api/cron/*` routes authorize scheduled runs (see `vercel.json`).
- `ADMIN_PASSWORD` — generate with `openssl rand -hex 12`. Shared password for the Strike staff admin panel at `/admin` (single credential by design — no per-staff accounts yet).
- `APP_BASE_URL` — the deployed URL, used when building short links (`/l/:slug`) and influencer login magic links.

## Local development

```bash
npm install
npx prisma migrate dev   # creates tables in your Neon DB from prisma/schema.prisma
npm run dev
```

## Data sync model

- **Orders**: real-time via the Yampi webhook at `/api/webhooks/yampi` for orders placed going forward. Pre-existing order history for a coupon is pulled in by the backfill (see below) — the webhook alone doesn't retroactively fill in the past.
- **Order backfill**: `backfillOrders()` (`src/lib/yampi/backfillOrders.ts`) scans every order in Yampi (paginated, ~582 orders as of writing — cheap) and upserts any with a coupon. Runs automatically after mapping a new influencer, on-demand via the **Resync orders** admin button, and once daily via `/api/cron/sync-orders` as a safety net for any webhook Yampi failed to deliver.
- **Coupons**: reconciled once daily via `/api/cron/sync-coupons` (Yampi `pricing/promocodes`) — daily, not more frequent, since Vercel's Hobby plan rejects cron schedules faster than once/day. This only *updates* coupons already mapped to an influencer in the admin panel — it never auto-creates the influencer↔coupon link, since that's a deliberate business decision (see admin panel below).
- **Products**: reconciled once daily via `/api/cron/sync-products` (Shopify Admin GraphQL). Products not published to the Online Store sales channel are skipped (no page to link to).

Revenue/order-count anywhere in the app excludes `cancelled`, `refused`, and `waiting_payment` orders — see `src/lib/orderStatus.ts` for the full logic, confirmed against Strike's real order status distribution.

## Admin panel

`/admin` (protected by `ADMIN_PASSWORD`, see above) is where Strike staff map an influencer to their Yampi coupon:

1. Log in at `/admin/login`.
2. **+ New influencer** — pick from a live list of Yampi coupons not yet mapped to anyone, fetched directly from the Yampi API at page-load time (not from the local cache, so it's always current). Creating the influencer immediately backfills any pre-existing orders on that coupon.
3. The dashboard lists every influencer with their coupon, order count, and revenue, and lets you deactivate/reactivate or trigger a manual **Resync orders**.

Auth is a single shared password (no per-staff accounts) signed into an HttpOnly session cookie — intentionally simple for Phase 2; see `src/lib/session.ts` and `src/proxy.ts`.

> Note: this Next.js version renamed the `middleware.ts` file convention to `proxy.ts` (the old name is deprecated) — that's why route protection lives in `src/proxy.ts`, not `src/middleware.ts`.

## Influencer dashboard

`/login` → influencer enters their email → gets a one-time magic link (15 min expiry, single use) via Resend → `/dashboard`.

The dashboard shows, filterable by date range (`?from=YYYY-MM-DD&to=YYYY-MM-DD`, defaults to all-time): total revenue, order count, average order value, discount given, total link clicks, and a per-order table — all scoped strictly server-side to the logged-in influencer's own coupon (see `verifyInfluencerSession` in `src/lib/dal.ts`).

## UTM link generator

`/dashboard/links` — an influencer picks a product from Strike's synced catalog and gets a short link (`{APP_BASE_URL}/l/{slug}`, e.g. `strike-influencer-portal.vercel.app/l/MwpyWqjw`). Visiting that short link logs a click (`ClickEvent`) then 302-redirects to the real Shopify product page with `utm_source` (the influencer's coupon code), `utm_medium=influencer`, and `utm_campaign` (the product handle) attached — so both this app's own click count *and* Strike's Shopify/GA analytics can attribute traffic to the right influencer and product.

## Project structure

```
src/
  app/
    admin/                   # Admin panel pages (login, dashboard, new influencer)
    login/                    # Influencer magic-link login page
    dashboard/                 # Influencer sales dashboard
    dashboard/links/            # UTM link generator + click counts
    api/admin/                # Admin login/logout/influencer mutation routes
    api/login/                 # Magic-link request + verify routes
    api/logout/                # Influencer logout
    api/dashboard/links/       # Create a UTM link
    api/webhooks/yampi/       # Yampi order webhook receiver
    api/cron/                  # Scheduled coupon/product/order sync (Vercel Cron)
    l/[slug]/                   # Short-link redirect + click logging
  lib/
    yampi/                    # Yampi API client, webhook verification, order upsert, backfill
    shopify/                   # Shopify Admin GraphQL client, product sync
    cron/                      # Cron auth guard
    session.ts                 # Admin + influencer session cookies sign/verify (jose)
    dal.ts                      # verifyAdminSession() / verifyInfluencerSession() DAL helpers
    email.ts                    # Resend magic-link email sending
    orderStatus.ts              # Shared "counts as revenue" status classification
    prisma.ts                   # Prisma client singleton (Neon driver adapter)
  proxy.ts                      # Route protection for /admin and /dashboard (renamed from middleware.ts)
prisma/schema.prisma            # Influencer, LoginToken, Coupon, Order, Product, UtmLink, ClickEvent
```

## What's built vs. what's next

All four phases of the original plan are built and tested end-to-end against real Yampi/Shopify/database data: the sync foundation, the admin panel, the influencer dashboard, and the UTM link generator with click tracking.

The one thing still needed before influencers can actually receive login emails: verifying a sending domain in Resend (see the Resend setup section above) — until then, magic-link emails only deliver to the Resend account owner's own address (sandbox mode).
