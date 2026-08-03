@AGENTS.md

# Rootly

An iOS-style mobile app for organizing bookmarks, built with Expo SDK 54 and expo-router.

**The core idea: a bookmark never lives alone.** Every link belongs to a **Root** (a real
thing you own or manage — a store, an office, a brand), and inside a Root links are grouped
onto **Shelves**. That hierarchy is `Root → Shelf → Link`, and it shows up everywhere: in the
navigation, the API paths, the schemas and the copy.

## Commands

```bash
npm start              # dev server
npm run android        # dev server + Android
npm run ios            # dev server + iOS
npm run web            # dev server + web
npm run lint           # eslint
npx tsc --noEmit       # typecheck — run this before you call anything done
npx expo export --platform web   # full bundle check
```

There is no test runner configured yet. Verification today = typecheck + lint + bundle +
walking the screens against the design reference.

## Non-negotiables

1. **Read the versioned Expo docs before writing code**: https://docs.expo.dev/versions/v54.0.0/
   The API surface changed meaningfully in 54. Don't write from memory.
2. **Never hardcode a hex value outside `src/theme/`.** Import from `@/theme`. If a colour
   isn't there, add it there first.
3. **Never call `fetch` directly.** Everything goes through `src/api/http.ts`, which routes
   to the mock or the network and validates the response.
4. **`src/app/` holds routes only.** A route file imports one screen component from
   `src/features/*/components/` and renders it. No layout, no data fetching, no styles.
5. **Match the design exactly.** `Rootly dashboard design system/design_handoff_rootly/` is
   the source of truth — `README.md` for tokens, `Rootly.dc.html` for the 17 screens. Open
   the HTML in a browser at 390px wide and compare side by side.

## Architecture

```
src/
├── app/          expo-router file-based routes (thin — see rule 4)
├── theme/        colours, typography, spacing, radii, shadows, font loading
├── components/
│   ├── ui/       design-system primitives (Button, Card, Avatar, Chip, …)
│   ├── icons/    the app's icon vocabulary + the custom RootMark logomark
│   └── layout/   Screen, ScreenHeader, FloatingTabBar, QueryBoundary
├── features/     one folder per domain: api.ts · hooks.ts · components/
├── api/          client, errors, schemas, endpoints, query config, mock server
├── store/        zustand — auth session and transient UI state
└── lib/          env, logger, storage, date, format
```

`@/*` resolves to `./src/*`.

### The layers, in dependency order

`lib` → `theme` → `api` → `store` → `components` → `features` → `app`

Nothing lower imports from something higher. The one deliberate exception is
`store/auth.store.ts`, which injects an auth bridge into the API client via
`configureApiClient` — that's how the client gets tokens without importing the store.

## Data flow

Every screen follows the same shape:

```tsx
const query = useThings();                    // features/<domain>/hooks.ts

<QueryBoundary query={query} isEmpty={…} empty={…}>
  {(data) => /* render */}
</QueryBoundary>
```

`QueryBoundary` (`src/components/layout/query-boundary.tsx`) owns the loading / error /
empty branching. Screens never hand-roll those four states.

**Adding an endpoint:**

1. Add the path to `src/api/endpoints.ts`.
2. Add or extend the zod schema in `src/api/schemas.ts` — types are inferred from schemas,
   never declared separately.
3. Add the endpoint function to `src/features/<domain>/api.ts`.
4. Add the hook to `src/features/<domain>/hooks.ts`, with a key from `src/api/query-keys.ts`.
5. Add a mock handler to `src/api/mock/handlers.ts` so the app still runs offline.

**Adding a screen:**

1. Build the component in `src/features/<domain>/components/`.
2. Add a route file in `src/app/` that renders it and nothing else.
3. Wrap the content in `<Screen>` — it owns the background, safe-area insets and tab-bar
   clearance. Screens must not apply their own top padding.

## Error handling

This is the part most worth understanding before changing anything.

Every failure — transport, HTTP, malformed JSON, schema mismatch — is normalised into a
single `ApiError` with a discriminated `kind`:

```
network · timeout · cancelled · parse · validation · auth · forbidden
notFound · conflict · badRequest · rateLimit · server · unknown
```

- **`src/api/client.ts`** — timeouts via `AbortController`, exponential backoff with jitter
  (only for retryable kinds, only on idempotent methods), `Retry-After` support, and a
  **single-flight 401 refresh** so concurrent requests share one refresh instead of
  stampeding.
- **`src/api/schemas.ts` + `http.ts`** — every response is parsed before it reaches a hook.
  A backend shape change surfaces as a `validation` error naming the failing field, not an
  `undefined is not an object` crash three components deep.
- **`src/api/errors.ts` → `toUserMessage(error)`** — the single source of user-facing error
  copy. **Screens must not write their own error strings.** Add a case here instead.
- **`src/api/query-client.ts`** — mutation failures raise a toast automatically. A mutation
  that renders its own inline error opts out with `meta: { silent: true }` (see
  `useArchiveLink`, `useSendInvite`).

Optimistic updates roll back on failure and show a specific message — see `useArchiveLink`
in `src/features/links/hooks.ts` for the pattern to copy.

## Mock server

`EXPO_PUBLIC_USE_MOCKS=true` (the default) serves everything from an in-memory server at
`src/api/mock/`, seeded with the handoff's exact data — mystore.pk, Head Office, Al-Karam,
Personal, the Ads shelf, Umar / Sana / Bilal / hina. Mutations write to `src/api/mock/db.ts`,
so the app behaves like a real client within a session. State resets on reload, deliberately.

Flip `EXPO_PUBLIC_USE_MOCKS=false` and set `EXPO_PUBLIC_API_URL` to go live. Hooks,
components and types are untouched — only `endpoints.ts` and `schemas.ts` should need
reconciling against the real contract.

**To exercise error states:** set `EXPO_PUBLIC_MOCK_FAILURE_RATE=0.5`, or call
`forceMockFailure(1, 'network')` from `src/api/mock/server.ts` for a deterministic single
failure of a chosen kind. `clearRoots()` in `src/api/mock/db.ts` empties the roots list to
reach the zero-state Home.

Env vars are documented in `.env.example`. Expo inlines `EXPO_PUBLIC_*` at build time, so
changing one needs `npx expo start --clear`.

## Design system

Tokens live in `src/theme/` and are transcribed verbatim from the handoff.

- **Colours** — `colors.ink` `#111`, `colors.screen` `#FBF3E7` (warm cream), `colors.brand`
  `#F7B6D6` (pink), plus a five-colour accent rotation and `status` (live / slow / dead /
  pending). Note `status.slow` pairs amber text with a yellow dot — that mismatch is in the
  design, not a bug.
- **Typography** — `text.screenTitle()`, `text.bodySm()` etc., reached through the `Text`
  component's `variant` prop. Inter Tight for display/numerals/initials, General Sans for
  body.
- **Card shadows are selective.** The handoff omits them on shelf rows, related-link rows,
  the onboarding explainer and all pink AI cards. Use `<Card elevated={false}>` there.
- **The brand ring** (`ConicRing`) is a CSS conic-gradient in the design; RN has no such
  thing, so it's rebuilt as five 64° SVG arcs from −8° with 8° gaps. Used at 150px (splash),
  236px (root detail) and 180px @ 40% (empty home).

### Fonts

Inter Tight installs from npm. **General Sans does not** — it's a Fontshare face whose
`.otf` files must be downloaded by hand into `assets/fonts/`:

```
assets/fonts/GeneralSans-Regular.otf
assets/fonts/GeneralSans-Medium.otf
assets/fonts/GeneralSans-Semibold.otf
assets/fonts/GeneralSans-Bold.otf
```

Get them from https://www.fontshare.com/fonts/general-sans. Until they exist the app runs
fine on the platform system font — `useAppFonts` detects the absence and falls back without
crashing. Body text will look slightly off the design until they're added.

## Screen ↔ frame map

Every screen names its handoff frame in a comment at the top.

| Frame | Screen | Route |
|---|---|---|
| 0 | Splash | `SplashOverlay`, mounted by the root layout |
| 1, 8 | Home + zero-state | `/(tabs)/` |
| 2 | Root detail | `/roots/[rootId]` |
| 3 | Shelf → links | `/roots/[rootId]/shelves/[shelfId]` |
| 4 | Link detail | `/links/[linkId]` |
| 5 | Ask | `/ask` |
| 6 | Add flow (sheet) | `/quick-add` |
| 7 | Onboarding | `/(onboarding)` |
| 9 | Settings | `/(tabs)/settings` |
| 11 | Notifications | `/notifications` |
| 12 | Manual add / edit | `/link-form` |
| 13 | Auth | `/(auth)/sign-in` |
| 14 | Timeline | `/(tabs)/timeline` |
| 15 | Team workspace | `/(tabs)/spaces` |
| 16 | Invite members | `/team/invite` |

(The handoff skips frame 10.)

Screens the handoff implies rather than draws — each opens from a frame above and keeps its
design language: `/profile` (frame 9's account card), `/team/switch` (frame 15's workspace
name), `/team/invite-options` (a frame 15 pending-invite row).

The phone bezel, iOS status bar and home indicator in the HTML are **gallery scaffolding**,
not product UI — the OS provides them. Don't rebuild them.

## Known gaps

- **Auth is UI + session plumbing only.** Token storage, 401 refresh and route gating are
  real; the Google and Apple buttons hit a stub that returns "not connected yet". Wiring
  them up means adding `expo-auth-session` / `expo-apple-authentication` and implementing
  `POST /auth/oauth/:provider`.
- **Light mode only** — the handoff has no dark variant.
- Secondary actions that aren't built yet raise a "coming soon" toast rather than failing
  silently, so the gaps are visible in the UI instead of hidden in the code.
- **Workspace switching is real.** The mock seeds three workspaces — mystore.pk, Head Office,
  Al-Karam — and every `/workspace*` endpoint reads whichever is active, so switching changes
  the members, folders, assignments and invites on screen. Umar's role differs per workspace
  (owner / admin / member) so all three branches of the member sheet's permission logic are
  reachable without editing code.
- **Every timeline row and alert carries a `target`**, so tapping one opens the link, shelf or
  root it's about. `hrefForTarget` (`src/features/timeline/targets.ts`) is the single place
  that turns one into a route, and it hands the router `pathname` + `params` rather than an
  interpolated string.
- **Timeline row actions are real.** What a row's label does comes from `actionKind` on the
  event: `open` navigates to its target, `undo` calls `POST /timeline/:id/undo` (the merged
  duplicates are seeded as archived links, so undoing restores something real), and `reply`
  opens `/timeline-reply`, which posts the reply as its own feed event. There's no comment
  thread behind it yet — a reply is a timeline entry, not a message in a conversation.
- **Ownership transfer** is the one workspace action the member sheet doesn't offer — the
  mock rejects it with a `forbidden`, so the sheet explains rather than pretends.
