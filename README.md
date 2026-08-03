# Rootly

Every link has a home.

Rootly is a mobile bookmark manager built on the idea that **a bookmark never lives alone** —
every link belongs to a **Root** (a real thing you manage: a store, an office, a brand), and
inside a Root links are grouped onto **Shelves**.

Built with Expo SDK 54, expo-router, TanStack Query and Zustand.

## Getting started

```bash
npm install
npm start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

**The app runs out of the box with no backend.** Every request is served by an in-memory
mock server seeded with the design's data, so you can walk all 17 screens immediately.

### Two optional setup steps

**1. Fonts.** Inter Tight installs from npm automatically. General Sans is a Fontshare face
that has to be downloaded by hand — grab the four weights from
[fontshare.com/fonts/general-sans](https://www.fontshare.com/fonts/general-sans) and drop
them into `assets/fonts/`:

```
GeneralSans-Regular.otf
GeneralSans-Medium.otf
GeneralSans-Semibold.otf
GeneralSans-Bold.otf
```

Until then the app falls back to the platform system font — no crash, just slightly off the
design.

**2. Environment.** Copy `.env.example` to `.env` if you want to change anything. The
defaults are fine for development.

## Connecting a real API

```bash
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=https://your-api.example.com/v1
```

Restart with `npx expo start --clear` (Expo inlines these at build time).

Nothing else changes — the same hooks, components and types serve both. The two files to
reconcile against your real contract are `src/api/endpoints.ts` (paths) and
`src/api/schemas.ts` (response shapes).

## Seeing the error states

The API layer normalises every failure into a typed `ApiError`, and every screen renders its
loading / error / empty states through a shared `QueryBoundary`. To watch it work:

```bash
EXPO_PUBLIC_MOCK_FAILURE_RATE=0.5   # half of all requests fail
```

For a deterministic single failure of a specific kind, call `forceMockFailure(1, 'network')`
from `src/api/mock/server.ts`. `clearRoots()` in `src/api/mock/db.ts` empties the roots list
so you can reach the zero-state Home.

## Project layout

```
src/
├── app/          routes (expo-router) — thin files that render one screen each
├── theme/        design tokens: colours, typography, spacing, radii, shadows
├── components/   ui primitives · icons · layout scaffolding
├── features/     one folder per domain — api.ts, hooks.ts, components/
├── api/          http client, error model, zod schemas, mock server
├── store/        auth session and UI state (zustand)
└── lib/          env, logger, storage, date and formatting helpers
```

See [CLAUDE.md](./CLAUDE.md) for the full architecture guide, conventions, and the
screen ↔ design-frame map.

## Design reference

The complete design lives in `Rootly dashboard design system/design_handoff_rootly/` —
`README.md` documents the tokens, and `Rootly.dc.html` is a browser-viewable gallery of all
17 screens. Open it at 390px wide to compare against the running app.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server |
| `npm run ios` / `android` / `web` | Dev server on a platform |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npx expo export --platform web` | Full bundle check |
