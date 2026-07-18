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

> Note: Yampi's public docs don't publish an exhaustive JSON schema for the order webhook payload. The first time a real webhook arrives in each environment, log the raw body once (temporarily) and confirm the field names in `src/lib/yampi/upsertOrderFromWebhook.ts` match — adjust the `YampiOrderWebhookPayload` type if anything differs.

### 3. Shopify custom app

Shopify retired the old "Develop apps in admin" static-token flow — custom apps are now created in the [Dev Dashboard](https://dev.shopify.com/dashboard).

1. In the Dev Dashboard: **Apps > Create app > Start from Dev Dashboard**. Name it, e.g. "Strike Influencer Portal".
2. **Versions** tab: set any app URL placeholder, add scope `read_products` only, pick the newest Webhooks API version, **Release**.
3. **Home** tab: **Install app**, select Strike's store, **Install**. (Requires the app and store to be in the same Shopify organization.)
4. **Settings** tab: copy **Client ID** and **Client secret** into `.env` as `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. Also set `SHOPIFY_STORE_DOMAIN` to `your-store.myshopify.com`.
5. In the Dev Dashboard app's **Configuration** (or **URLs**) settings, add `http://localhost:3000/api/shopify/oauth/callback` to the allowed redirect URLs (add the production URL too once deployed).
6. **Get the real access token** — this is the part that differs from most tutorials: on a production store, the `client_credentials` grant silently returns a token with no scopes (it only works on Shopify dev stores). Instead, run the app locally (`npm run dev`) and visit `http://localhost:3000/api/shopify/oauth/start` in your browser. You'll be asked to approve access on the Shopify side; after approving, the callback page shows a permanent offline access token — copy it into `.env` as `SHOPIFY_ADMIN_ACCESS_TOKEN`. This is a one-time step.

### 4. App secrets

- `AUTH_SECRET` — generate with `openssl rand -base64 32`, used to sign influencer magic-link tokens.
- `CRON_SECRET` — generate the same way. When set, Vercel Cron automatically sends it as `Authorization: Bearer <value>`, which is how `/api/cron/*` routes authorize scheduled runs (see `vercel.json`).
- `APP_BASE_URL` — the deployed URL, used when building short links (`/l/:slug`).

## Local development

```bash
npm install
npx prisma migrate dev   # creates tables in your Neon DB from prisma/schema.prisma
npm run dev
```

## Data sync model

- **Orders**: real-time via the Yampi webhook at `/api/webhooks/yampi` — no polling needed for sales data.
- **Coupons**: reconciled every 30 min via `/api/cron/sync-coupons` (Yampi `pricing/promocodes`). This only *updates* coupons already mapped to an influencer in the admin panel — it never auto-creates the influencer↔coupon link, since that's a deliberate business decision.
- **Products**: reconciled every 30 min via `/api/cron/sync-products` (Shopify Admin GraphQL). Products not published to the Online Store sales channel are skipped (no page to link to).

## Project structure

```
src/
  app/
    api/webhooks/yampi/    # Yampi order webhook receiver
    api/cron/               # Scheduled coupon/product sync (Vercel Cron)
    l/[slug]/                # Short-link redirect + click logging
  lib/
    yampi/                  # Yampi API client, webhook verification, order upsert
    shopify/                 # Shopify Admin GraphQL client, product sync
    cron/                    # Cron auth guard
    prisma.ts                # Prisma client singleton (Neon driver adapter)
prisma/schema.prisma          # Influencer, Coupon, Order, Product, UtmLink, ClickEvent
```

## What's built vs. what's next

Built so far (Phase 0–1 of the project plan): project scaffold, data model, Yampi webhook ingestion, Yampi coupon sync, Shopify product sync, short-link redirect + click logging.

Not yet built: influencer/admin authentication, the admin panel (influencer↔coupon mapping UI), and the influencer dashboard (reports, UTM link generator UI). Those are Phases 2–4.
