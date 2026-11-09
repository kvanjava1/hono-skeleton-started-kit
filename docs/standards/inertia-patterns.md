# Inertia Patterns (Inertia.js + Svelte 5)

This document defines the conventions for building web pages with **Inertia.js + Svelte 5** on top of this skeleton, using the official [`@hono/inertia`](https://github.com/honojs/middleware) middleware. It extends — never replaces — the [Architecture Standard](./architecture.md): the `Routes → Controllers → Services → Repositories` flow is unchanged.

---

## 🧭 Mental Model

Inertia is **not an API consumer**. A "page" is a Svelte component served by a normal web route:

- **First visit**: Hono renders the root shell (`resources/views/inertia/AppShell.tsx`) containing the serialized page object — Svelte mounts and renders the component.
- **Subsequent navigation**: requests carry the `X-Inertia` header; the middleware responds with a JSON page object and the client swaps components — no full page reload, no API layer.

```text
GET /admin/users (first visit)
  Routes → Web Controller → c.render('dashboard-admin/Admin/Users/Index', props)
         → AppShell.tsx (HTML shell + data-page JSON)
         → Svelte mounts Admin/Users/Index.svelte

GET /admin/users?page=2 (Inertia navigation)
  Same handler → JSON page object (X-Inertia: true) → Svelte swaps component
```

A full working reference lives in `src/controllers/web/admin/user.controller.ts` (+ `src/routes/web/admin/user.router.ts` + `src/routes/web/admin/auth.router.ts`): the admin dashboard serves login/logout and User Management entirely through web routes — **no API endpoints involved**.

---

## 📁 File Placement & Naming

| Component | Path | Naming |
|---|---|---|
| Client bootstrap (per app) | `resources/js/apps/<app>/app.ts` | `app.ts` |
| Page components | `resources/js/apps/<app>/pages/` | `PascalCase.svelte` (e.g. `Admin/Users/Index.svelte`) |
| Root view (HTML shell) | `resources/views/inertia/AppShell.tsx` | `AppShell` |
| Inertia utils | `src/utils/inertia.util.ts` | `camelCase.util.ts` |
| Web controllers / routes | `src/controllers/web/<domain>/`, `src/routes/web/<domain>/` | existing conventions |

### Multi-App Convention

`resources/js/apps/` hosts **client apps** — one folder per app, fully self-contained (bootstrap entry + pages):

```text
resources/js/apps/
└── dashboard-admin/     ← satu client app
    ├── app.ts           ← bootstrap entry (createInertiaApp)
    ├── components/      ← komponen presentational reusable (AdminLayout, Modal, ...)
    └── pages/
        └── Admin/
            ├── Login.svelte
            └── Users/
                └── Index.svelte
```

Page names are **namespaced by app** on the server; the root shell derives which app's entry to load from the page name prefix:

```ts
c.render("dashboard-admin/Admin/Users/Index", { users }) // → resources/js/apps/dashboard-admin/pages/Admin/Users/Index.svelte
```

To add a new client app:
1. Create a new folder under `apps/` with an `app.ts` (copy `dashboard-admin/app.ts` as-is — the resolve logic is app-agnostic).
2. Register its entry in `vite.config.ts` → `rollupOptions.input` (`resources/js/apps/<app>/app.ts`).
3. Serve its pages from a web controller via `c.render("<app>/<PagePath>", props)`.

---

## 🖥️ Server Side

### Rendering a page (controller)

Controllers use `c.render(component, props)` (added by the Inertia middleware). Props must be **JSON-serializable** — never pass Hono `Context`, connections, or class instances (same rule as queue payloads).

```ts
export const showUsersIndex = async (c: Context) => {
  const result = await UserService.listUsers({ page: 1 });
  return c.render("dashboard-admin/Admin/Users/Index", {
    users: result.rows.map(toUserView), // DTO — never leak passwordHash
    total: result.total,
  });
};
```

### Shared props

Global props (`appName`, `isDev`) come from `getSharedProps()` in `src/utils/inertia.util.ts`, wired via the middleware `share` option — the equivalent of Laravel's `HandleInertiaRequests::share()`. Page props override shared keys.

### Asset versioning

`X-Inertia-Version` is the SHA-256 of `public/build/.vite/manifest.json` (`getAssetVersion()`), computed once at startup. A stale client version triggers `409 + X-Inertia-Location` → full reload. Development uses the constant `"dev"` (HMR handles freshness).

---

## 📝 Forms & Validation (Error Bag Contract)

Forms are submitted **to web routes** via Inertia (`useForm().post('/path')`) — not to `/api/*`. The contract differs from the API error envelope **on purpose**:

```text
X-Inertia request + form validation failure  →  422 page envelope:
                                                { component, props: { ..., errors: { field: message } }, url, version }
                                                + X-Inertia response header
Any other request                            →  existing contract: { status, message, data }
```

- `@inertiajs/core` 3.x treats any response **without the `X-Inertia` response header** as "not a valid Inertia response" (error modal) and fills `useForm()` errors from `page.props.errors` after `setPage()`. A plain `422 { errors }` JSON therefore never reaches the error bag.
- Web controllers re-render the **origin page** themselves via `inertiaValidationErrorResponse()` (`src/utils/inertia.util.ts`): the envelope must carry the page's **full props** (the client replaces props wholesale) and `url` must be the origin page URL — not the form action — so the address bar stays put. The Zod → error bag mapping lives in `toInertiaErrorBag()`.
- Service-level `ValidationError`s (thrown outside the web controllers) take the **redirect-back fallback**: the Global Error Handler flashes the error bag to the session and responds 303 to the Referer path — `getSharedProps(c)` then exposes it as the `errors` prop, which pages map into `form.setError()`. Submitted input is NOT preserved on this fallback path (old-input handling is a Phase 3 item).
- Controller-level failures respond in-place (no redirect), so submitted values remain intact there — no "old input" mechanism needed on the main path.
- Success path: `c.redirect(...)` (POST-redirect-GET). The middleware rewrites 302→303 automatically for PUT/PATCH/DELETE Inertia requests per protocol.

### Session, CSRF & flash (web only)

- **Session** (Laravel `SESSION_DRIVER=cookie` parity): `webSessionMiddleware` (`src/middlewares/web/session.middleware.ts`, wired on the web router) loads or creates the session state (CSRF token + flash bag) from a single httpOnly signed cookie and persists both cookies **after** the handler, so flash written on redirect responses survives. Config lives in `src/configs/session.config.ts` — `SESSION_SECRET` (required in production; dev falls back to an insecure fixed value), `SESSION_COOKIE_NAME`, `SESSION_TTL_MINUTES`. API paths pass through untouched.
- **CSRF (two layers)**: `csrfGuard` (evolved from `sameOriginGuard`) keeps the Origin/Referer check **and** validates the `X-XSRF-TOKEN` header against `webSession.csrfToken`. The Inertia client (3.11 `XhrHttpClient`) reads the non-httpOnly `XSRF-TOKEN` cookie and sends the header automatically on same-origin mutations — zero client changes. Missing/mismatched token → 403.
- **Flash**: `flashSuccess()` / `flashError()` write to the session; `getSharedProps(c)` consumes the flash **once per render** and exposes `flash` (+ Laravel-style `errors`) as shared props. The demo pages render a one-shot banner and map `errors` into `form.setError()`.
- **Service-level `ValidationError` fallback (P17)**: the global error handler now redirects back (303) with the error bag flashed to the session — no more plain-JSON response the client rejects with its modal. Controller-level Zod failures keep the 422 envelope.

### Admin pages & web auth (dashboard-admin)

The admin dashboard (`resources/js/apps/dashboard-admin/`) is the first **authenticated** Inertia app. Conventions it introduced:

- **Route namespace**: `ROUTES.WEB.ADMIN` (`/admin/login`, `/admin/logout`, `/admin/users...`) — constants only, no literals. `LOGIN` and `LOGIN_SUBMIT` intentionally share one path (GET renders, POST submits).
- **Auth claim lives in the existing session cookie**: `WebSession.userId?` + `rotateSessionForAuth()` (fresh CSRF token on login → session-fixation protection; mutates in place because the session middleware persists the reference it captured before the handler) and `clearAuthUser()` on logout. One cookie, CSRF + flash keep working for anonymous visitors.
- **Guards** (`src/middlewares/web/auth.middleware.ts`): `authGuard` (flash "Silakan login" + redirect `/admin/login`) and `guestGuard` (logged-in visitors are sent to `/admin/users`). Wire them per route in the admin routers; mutations still need `csrfGuard`.
- **No API endpoints**: User Management is web-only (`src/routes/web/admin/*.router.ts` → `src/controllers/web/admin/*.controller.ts` → `src/services/admin/user.service.ts` → `src/repositories/admin/user.repository.ts`). Services throw `AppError`s; controllers map them (Zod/conflict → 422 error bag; row actions → `flashError` + redirect).
- **DTO rule**: service rows contain `passwordHash`; controllers MUST map to a view DTO (`toUserView`) before `c.render` — never pass secrets as props.
- **Reusable component layer**: NusaAdmin (`public/examples/templates/dashboard/`, read-only) was ported into global classes in `resources/css/app.css` (`card`, `btn-*`, `input`, `badge`, `nav-link`, `dropdown-*`, table grid) plus thin presentational Svelte components under `apps/dashboard-admin/components/` (`Button`, `Modal`, `Dropdown`, `Pagination`, `SearchModal`, `AdminLayout`, ...). Template folder stays untouched.
- **Dark mode**: Tailwind v4 class variant — `@custom-variant dark (&:where(.dark, .dark *))` in `app.css`; the root shell (`AppShell.tsx`) pre-paints `html.dark` from `localStorage.theme` (dark-first) and loads the Inter font once for every app.
- **Self-protection**: an admin cannot delete or deactivate their own account (service/controller guard + UI hides those row actions).

> **Phase 3 note:** registration, old-input handling, and error-page rendering build on this session layer; see `plans/inertia-session-csrf/phase-1/ideas/01-options.md`.

---

## 🧭 Route Registry (single source of truth for web paths)

Every web path is defined exactly once, in `ROUTES.WEB` (`src/configs/routes.config.ts`). The file is dependency-free on purpose so the client bundle can import it.

1. **Define the path once**: `ROUTES.WEB.<DOMAIN>.<ACTION>` with `:name` params (e.g. `/admin/users/:id`). Action names are method-agnostic — the HTTP method is chosen at the call site (`router.put`, `form.post`, ...).
2. **Routers use the constants**, never string literals (see `src/routes/web/admin/user.router.ts`).
3. **Client code resolves paths with `route()`**: import `{ ROUTES, route }` from `resources/js/lib/routes.ts` (a straight re-export of the registry) — never interpolate strings in Svelte pages.
4. **Params are mandatory**: `route()` throws when a required param is missing, so `/admin/users/undefined` can never be built silently.
5. **`make domain` scaffolds it**: the generator inserts the `ROUTES.WEB.<DOMAIN>` block above the `[make:web-domain]` marker and its web router references the constants.
6. **Adding a route manually**: add the constant to the registry first, then reference it from the router and the client.

```svelte
import { ROUTES, route } from '../../../../../lib/routes.ts'
form.post(route(ROUTES.WEB.ADMIN.USERS_CREATE))
router.delete(route(ROUTES.WEB.ADMIN.USERS_DELETE, { id: user.id }))
```

---

## 🧱 Client Side

- Bootstrap: **per app** — `resources/js/apps/<app>/app.ts` (`createInertiaApp` from `@inertiajs/svelte` with `import.meta.glob('./pages/**/*.svelte')` lazy resolution + code splitting per page). The app prefix of the page name is stripped in `resolve`, so the file is identical for every app.
- Pages are plain Svelte 5 components with typed props (runes):

```svelte
<script lang="ts">
import { Link, useForm } from '@inertiajs/svelte'
import { ROUTES, route } from '../../../../../lib/routes.ts'
let { appName = '', users = [] }: Props = $props()
const form = useForm({ name: '', email: '', password: '' })
const submit = () => form.post(route(ROUTES.WEB.ADMIN.USERS_CREATE))
</script>
```

- Use `<svelte:head><title>...</title></svelte:head>` for the document title (the Svelte adapter has no `<Head>` component), `<Link>` for SPA navigation, and `router` for programmatic visits (`router.delete(...)` etc.).
- Form state is directly reactive: `bind:value={form.field}`, `form.errors.field`, `form.processing`.
- Tailwind CSS classes work out of the box (global stylesheet).
- Type checking for `.svelte` files runs via `bun run check:frontend` (`svelte-check` + `resources/js/tsconfig.json`) — `tsc --noEmit` only covers TypeScript sources, not Svelte components.

---

## 🔄 Build & Scripts

| Script | Purpose |
|---|---|
| `bun run dev:all` | Hono server + Vite dev server (Tailwind CSS **and** Svelte HMR) |
| `bun run build:assets` | One Vite build → CSS + JS + `public/build/.vite/manifest.json` |

Production serves hashed assets from `/build/*` via the existing static-asset middleware; the compiled `./server` binary is unaffected (client bundles are static files).

---

## ⚠️ Rules

1. **Never build an API endpoint just to feed an Inertia page** — use the web controller + `c.render`.
2. **Props must be JSON-serializable** and should be typed on both ends.
3. **Keep services unaware of Inertia** — no `c`, no page objects inside `src/services/`.
4. **Do not skip `csrfGuard`** (origin check + session-bound token) on web POST/PUT/PATCH/DELETE routes.
5. **Run `bun run build:assets` before production** — a missing manifest disables versioning (logged as an error).
6. `resources/views/` is now reserved for the Inertia root shell and email templates — do not reintroduce JSX-only web pages for Inertia-covered routes without a reason.
7. **Resolve web paths through `ROUTES.WEB` + `route()`** — no string literals or template interpolation in routers, controllers, or Svelte pages (see [Route Registry](#-route-registry-single-source-of-truth-for-web-paths)).

---

[Back to Standards](./README.md)
