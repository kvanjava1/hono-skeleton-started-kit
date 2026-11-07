# Inertia Patterns (Inertia.js + Svelte 5)

This document defines the conventions for building web pages with **Inertia.js + Svelte 5** on top of this skeleton, using the official [`@hono/inertia`](https://github.com/honojs/middleware) middleware. It extends — never replaces — the [Architecture Standard](./architecture.md): the `Routes → Controllers → Services → Repositories` flow is unchanged.

---

## 🧭 Mental Model

Inertia is **not an API consumer**. A "page" is a Svelte component served by a normal web route:

- **First visit**: Hono renders the root shell (`resources/views/inertia/AppShell.tsx`) containing the serialized page object — Svelte mounts and renders the component.
- **Subsequent navigation**: requests carry the `X-Inertia` header; the middleware responds with a JSON page object and the client swaps components — no full page reload, no API layer.

```text
GET / (first visit)
  Routes → Web Controller → c.render('example1/Cruds/Index', props)
         → AppShell.tsx (HTML shell + data-page JSON)
         → Svelte mounts Cruds/Index.svelte

GET /cruds/1/edit (Inertia navigation)
  Same handler → JSON page object (X-Inertia: true) → Svelte swaps component
```

A full working reference lives in `src/controllers/web/example/crud.controller.ts` (+ `src/routes/web/example/crud.router.ts`): it serves the CRUD demo at `/` **reusing the same `CrudService` and Zod schemas as `/api/example/cruds`** — one service layer, two HTTP boundaries (REST API and Inertia pages).

---

## 📁 File Placement & Naming

| Component | Path | Naming |
|---|---|---|
| Client bootstrap (per app) | `resources/js/apps/<app>/app.ts` | `app.ts` |
| Page components | `resources/js/apps/<app>/pages/` | `PascalCase.svelte` (e.g. `Cruds/Index.svelte`) |
| Root view (HTML shell) | `resources/views/inertia/AppShell.tsx` | `AppShell` |
| Inertia utils | `src/utils/inertia.util.ts` | `camelCase.util.ts` |
| Web controllers / routes | `src/controllers/web/<domain>/`, `src/routes/web/<domain>/` | existing conventions |

### Multi-App Convention

`resources/js/apps/` hosts **client apps** — one folder per app, fully self-contained (bootstrap entry + pages):

```text
resources/js/apps/
└── example1/            ← satu client app
    ├── app.ts           ← bootstrap entry (createInertiaApp)
    └── pages/
        └── Cruds/
            ├── Index.svelte
            └── Edit.svelte
```

Page names are **namespaced by app** on the server; the root shell derives which app's entry to load from the page name prefix:

```ts
c.render("example1/Cruds/Index", { cruds }) // → resources/js/apps/example1/pages/Cruds/Index.svelte
```

To add a new client app:
1. Create a new folder under `apps/` with an `app.ts` (copy `example1/app.ts` as-is — the resolve logic is app-agnostic).
2. Register its entry in `vite.config.ts` → `rollupOptions.input` (`resources/js/apps/<app>/app.ts`).
3. Serve its pages from a web controller via `c.render("<app>/<PagePath>", props)`.

---

## 🖥️ Server Side

### Rendering a page (controller)

Controllers use `c.render(component, props)` (added by the Inertia middleware). Props must be **JSON-serializable** — never pass Hono `Context`, connections, or class instances (same rule as queue payloads).

```ts
export const showCrudsIndex = async (c: Context) => {
  const cruds = await CrudService.listCruds();
  return c.render("example1/Cruds/Index", { cruds });
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
X-Inertia request + ValidationError  →  422 { "errors": { "field": "message" } }
Any other request                    →  existing contract: { status, message, data }
```

- The mapping Zod → error bag lives in `toInertiaErrorBag()` (`src/utils/inertia.util.ts`); throw `new ValidationError("Validation failed", toInertiaErrorBag(parsed.error))`.
- The Global Error Handler (`src/middlewares/common/errorHandler.ts`) converts it to the 422 `{errors}` response when the request carries `X-Inertia`; `useForm()` fills `form.errors` automatically.
- Because there is no redirect on failure, submitted values remain intact in the client — no "old input" mechanism needed.
- Success path: `c.redirect(...)` (POST-redirect-GET). The middleware rewrites 302→303 automatically for PUT/PATCH/DELETE Inertia requests per protocol.

> **Phase 2 note:** flash messages and session-bound CSRF tokens require the session layer (see `plans/inertia-vue-integration/phase-1/ideas/03-session-csrf-error-bag.md`). Until then, avoid authenticated mutations via Inertia.

### Same-origin guard

Unsafe web methods (POST/PUT/PATCH/DELETE) go through `sameOriginGuard` (`src/middlewares/web/sameOrigin.middleware.ts`): an `Origin`/`Referer` that mismatches the request host is rejected with 403. Note: the built-in `hono/csrf` only covers classic form content-types, while Inertia submits JSON — hence the custom guard. Strict session-bound CSRF tokens are Phase 2.

---

## 🧱 Client Side

- Bootstrap: **per app** — `resources/js/apps/<app>/app.ts` (`createInertiaApp` from `@inertiajs/svelte` with `import.meta.glob('./pages/**/*.svelte')` lazy resolution + code splitting per page). The app prefix of the page name is stripped in `resolve`, so the file is identical for every app.
- Pages are plain Svelte 5 components with typed props (runes):

```svelte
<script lang="ts">
import { Link, useForm } from '@inertiajs/svelte'
let { appName = '', cruds = [] }: Props = $props()
const form = useForm({ title: '', content: '' })
const submit = () => form.post('/cruds')
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
4. **Do not skip `sameOriginGuard`** on web POST/PUT/PATCH/DELETE routes.
5. **Run `bun run build:assets` before production** — a missing manifest disables versioning (logged as an error).
6. `resources/views/` is now reserved for the Inertia root shell and email templates — do not reintroduce JSX-only web pages for Inertia-covered routes without a reason.

---

[Back to Standards](./README.md)
