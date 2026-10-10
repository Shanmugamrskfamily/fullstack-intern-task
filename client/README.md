# Layora web app

The React front end for **Layora**, a Mini SaaS Template Store.

**Live:** https://layora-template-store.vercel.app · **API:** https://layora-api.onrender.com/api

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Data layer](#data-layer)
- [Forms and validation](#forms-and-validation)
- [Design system](#design-system)
- [UX details](#ux-details)
- [Accessibility](#accessibility)
- [Security](#security)
- [Performance](#performance)
- [Testing](#testing)
- [Deployment (Vercel)](#deployment-vercel)

## Tech stack

| Concern      | Choice                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Framework    | React 19 + Vite 8, TypeScript (strict)                                    |
| Styling      | **Tailwind CSS v4** with CSS-variable design tokens (light and dark)      |
| Components   | shadcn/ui patterns on Radix UI primitives (dialog, dropdown menu, select) |
| Server state | TanStack Query 5 (caching, infinite pagination, optimistic updates)       |
| HTTP         | Axios (one instance with auth and error interceptors)                     |
| Routing      | React Router 7 (data router, lazy-loaded pages)                           |
| Forms        | React Hook Form + Zod (mirrors the API's validation rules)                |
| Feedback     | Sonner toasts, Lucide icons, self-hosted Plus Jakarta Sans                |
| Testing      | Vitest + React Testing Library (jsdom)                                    |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api and /static to http://localhost:5000)
```

Run the API at the same time (`npm run dev` in `../server`, or `npm run dev` at the repo root to start both).

| Script              | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Vite dev server                            |
| `npm run build`     | Type-check and production build to `dist/` |
| `npm run preview`   | Serve the production build locally         |
| `npm test`          | Vitest test suite                          |
| `npm run lint`      | ESLint (zero warnings)                     |
| `npm run typecheck` | TypeScript project references              |

## Environment variables

All values are public build-time settings (nothing secret ships to the browser).

| Variable        | Default                 | Purpose                                                               |
| --------------- | ----------------------- | --------------------------------------------------------------------- |
| `VITE_API_URL`  | `/api`                  | API base URL. Dev uses the Vite proxy; production uses the Render URL |
| `VITE_SITE_URL` | `http://localhost:5173` | Public site URL for absolute Open Graph image links (link previews)   |

Production values are in [`.env.production`](.env.production); see [`.env.example`](.env.example).

## Project structure

```
src/
├── app/                router (lazy routes) and TanStack Query client
├── components/
│   ├── ui/             button, input, dialog, dropdown menu, select, skeleton, toaster
│   ├── brand/          BrandMark / BrandLogo and the animated BrandLoader
│   ├── layout/         AppShell, Navbar, MobileTabBar, UserMenu, ThemeToggle, Footer
│   └── feedback/       CookieNotice, ServerWakeBanner, OfflineBanner, empty/error states
├── features/
│   ├── auth/           AuthProvider, route guards, login/register pages, schemas, guest intent
│   ├── templates/      catalogue page, card, search, chips, sort, detail dialog, queries
│   ├── favorites/      favorites page, favourite button, optimistic mutation
│   └── theme/          ThemeProvider (light default, persisted)
├── lib/                http client, api errors, security helpers, storage, query keys, utils
├── pages/              cookie policy, 404
├── styles/globals.css  Tailwind v4 theme, soft-UI utilities, motion, reduced motion
└── test/               test setup and render helpers
```

## Routes

| Path                  | Access    | Notes                                                                                              |
| --------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `/templates`          | public    | Catalogue. `?q=`, `?category=`, `?sort=` live in the URL                                           |
| `/templates/:id`      | public    | Detail dialog over the grid; deep-linkable                                                         |
| `/favorites`          | signed in | The user's shelf; `/favorites/:id` opens the dialog over it                                        |
| `/login`, `/register` | guests    | `?next=` returns the user afterwards; `?intent=favorite:<id>` saves a template right after sign-in |
| `/cookies`            | public    | Cookie and storage policy                                                                          |
| `*`                   | public    | Friendly 404                                                                                       |

## Data layer

- **Query-key factory** (`lib/query-keys.ts`) defines every cache entry.
- **Catalogue:** `useInfiniteQuery` with 12 templates per page and **Load more**; previous results stay visible while new filters load (`keepPreviousData`).
- **Details:** prefetched on card hover or focus, and seeded from the list cache, so the dialog opens instantly.
- **Favorites:** a cached list; card hearts read a memoised `Set` of ids via `select`.
- **Optimistic toggle:** the heart, the counts and the favourites list update instantly, roll back with an error toast if the request fails, and removal shows an **Undo** toast. Mutations for the same template run one at a time (`scope`), so rapid taps never race.
- **Session:** the token is read on load (expired tokens are discarded), the profile loads from `GET /auth/me`, the app signs out automatically when the token expires, any 401 ends the session with a "Session expired" toast, and signing in or out syncs across tabs.
- **Cold starts:** `ServerWakeBanner` pings `/api/health`; if it is slow it explains that the free-tier API is waking up, retries with backoff, and refetches anything that failed.

## Forms and validation

React Hook Form with `zodResolver`, `mode: 'onTouched'`: a field is validated when you leave it, then on every keystroke once it has an error.

- Labels on every field, required markers, helper text, `autocomplete` and `inputmode` attributes, show/hide password (44 px), live password strength meter (rules shown as text and icons).
- Errors appear under the field (`role="alert"`, linked with `aria-describedby`); the first invalid field gets focus.
- Server errors are mapped back: 409 → the email field, 401 → a form-level alert, 429 → "too many attempts".
- The Zod rules mirror the API's (`server/src/modules/auth/auth.schemas.ts`); the API re-validates everything.
- **Continue with demo account** signs in with one click.

## Design system

**Soft UI Evolution:** neumorphic depth with accessible contrast. Tokens are CSS variables in `styles/globals.css`, mapped into Tailwind with `@theme inline`, and switched by a `.dark` class.

| Token group | Examples                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Surfaces    | `bg-background`, `bg-surface`, `bg-inset`                                                           |
| Text        | `text-foreground`, `text-muted-foreground`, `text-subtle` (all ≥ 4.5:1)                             |
| Brand       | `bg-primary` (indigo), `text-primary-text`, `text-rose` (favourites)                                |
| Depth       | `soft-raised`, `soft-raised-sm`, `soft-raised-lg`, `soft-pressed`, `soft-inset` (custom `@utility`) |
| Motion      | `animate-heart-pop`, `animate-card-in`, `animate-slide-up`, `skeleton`                              |

The brand mark is an L-shaped layout grid with a rose "favourite" tile; the loader animates the tiles building up and the heart beating.

## UX details

- **Light by default.** The theme choice is saved and applied before first paint by `public/theme-init.js` (no flash), and synced across tabs.
- **Cookie notice:** appears gently 1.2 s after load, never blocks or steals focus, is remembered for 12 months, and steps aside while a dialog is open.
- **Guest intent:** tapping ♥ while signed out leads to sign-in and saves the template afterwards.
- **States:** skeleton cards with the exact card geometry, empty states with next steps, error states with retry, offline banner, error boundary, 404.
- **Navigation:** top bar on tablet and desktop; floating bottom tab bar on phones; logout lives in the account menu, separated from navigation.
- **Motion:** 150–300 ms transitions on `transform` and `opacity` only; staggered card entrance; everything respects `prefers-reduced-motion`.
- **Developer footer** with the author's logo, which switches between light and dark versions.

## Accessibility

Skip link · focus moves to the page heading after navigation · visible focus rings · 44 px touch targets · `aria-pressed` hearts · category chips as an arrow-key radio group · dialog focus trap with focus returned to the card · `aria-live` result counts and toasts · descriptive image `alt` text · page titles per route · WCAG AA contrast verified in both themes.

## Security

- **No raw HTML:** React escapes output, and ESLint forbids `dangerouslySetInnerHTML`.
- **Open-redirect guard:** `?next=` only accepts same-site paths (`lib/security.ts`).
- **Untrusted URL params:** search is cleaned and clamped to 64 characters, category and sort are validated against allowlists, ids are checked as ObjectIds.
- **`safeUrl()`:** only `http(s)` image URLs are rendered.
- **Strict CSP** in `vercel.json`: `script-src 'self'` (the theme script is an external file, not inline), `connect-src` and `img-src` limited to this site and the API, `frame-ancestors 'none'`; plus HSTS, `nosniff`, Referrer-Policy and Permissions-Policy.
- **Storage:** the JWT is kept in `localStorage` as the task requires; it is cleared on logout, expiry or any 401.

## Performance

Route-level code splitting for the dialog, favourites, auth and cookie pages · vendor chunks (`react`, `data`, `ui`) · self-hosted variable font · SVG thumbnails with fixed aspect ratio (no layout shift) and lazy loading below the fold · immutable caching for hashed assets.

## Testing

```bash
npm test
```

24 tests across 7 files: open-redirect guard and input cleaning, URL filter fallbacks, route guards, guest favourite intent, optimistic favourite removal, login validation, normalisation and error mapping, theme persistence, cookie notice timing and memory.

## Deployment (Vercel)

The Vercel project uses `client` as its root directory with the Vite preset. [`vercel.json`](vercel.json) adds SPA rewrites, the CSP and security headers, and long-term caching for `/assets`. Pushing to `main` deploys to production.
