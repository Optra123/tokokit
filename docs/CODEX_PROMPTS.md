# Codex Prompts for TokoKit

## Prompt 1: Review Supabase Frontend

```text
Read README.md, SPEC.md, frontend/app.js, frontend/styles.css, and docs/SUPABASE_SCHEMA.sql.

Review:
1. Route handling for /login, /register, /app/*, /store/:slug, /checkout/:slug, and /success/:orderNumber.
2. Supabase auth flow.
3. Demo fallback mode when config.js is empty.
4. Seller CRUD flows.
5. Public checkout flow.
6. Loading, error, and empty states.
7. Mobile responsiveness.
8. JavaScript runtime risks.

Fix issues found.
Do not add a framework.
Do not add payment gateway yet.
Do not expose service role keys.
```

## Prompt 2: Supabase RLS Review

```text
Read docs/SUPABASE_SCHEMA.sql.

Check:
1. Every tenant-owned table has RLS enabled.
2. Seller can only access rows for their tenant.
3. Public users can read only active stores and active products.
4. Public users can create checkout rows only for active stores.
5. Public users cannot update/delete checkout data.
6. Authenticated onboarding can create tenant, profile, and initial store.

Fix policy issues found.
```

## Prompt 3: Product Polish

```text
Improve frontend polish for a production-grade UMKM SaaS tool.

Improve:
- Admin dashboard density
- Store setup clarity
- Product modal UX
- Orders table scanning
- Checkout mobile flow
- Storefront product cards
- Empty/error states

Keep:
- Vanilla HTML/CSS/JS
- Supabase client SDK
- Indonesian labels
- Manual payment v1 only
```

## Prompt 4: Deployment Readiness

```text
Review README.md, docs/DEPLOYMENT_GUIDE.md, vercel.json, and frontend/config.js.

Check:
1. Local run instructions work from repo root.
2. Vercel rewrites support all SPA routes.
3. Supabase setup instructions are complete.
4. No secrets are committed.
5. Legacy Apps Script is clearly marked as reference only.

Fix documentation and config issues found.
```
