# Handoff: Rootly — mobile bookmark manager

## Overview
Rootly is an iOS-style mobile app for organizing bookmarks. Its core idea: **a bookmark never lives alone — every link belongs to a "Root"** (a real thing you own or manage, e.g. a store, an office, a brand), and inside a Root links are grouped onto **shelves**. The app covers browsing roots, drilling into shelves/links, an AI assistant ("Rootly assistant"), an add flow, onboarding, auth, team workspaces, and settings.

This bundle is a **design reference**, not production code — see below.

## About the Design Files
`Rootly.dc.html` is a **design reference created in HTML** — a prototype gallery showing the intended look and behavior of every screen. It is **not** production code to copy directly.

Your task: **recreate these designs in the target codebase's existing environment** (React Native, SwiftUI, Flutter, React web, etc.) using its established patterns, component library, navigation, and state management. If no codebase exists yet, choose the most appropriate mobile framework and implement there. Match the visuals pixel-for-pixel; do not ship the raw HTML.

> The HTML file is a **single canvas** laying out ~18 phone frames (390×844) side by side, each with a numbered caption. Each frame is one screen of the app. Ignore the outer canvas chrome (the "Rootly" header at the top, the caption pills under each frame) — those are gallery scaffolding, not part of the product UI.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and copy are all locked. Recreate pixel-perfectly using the codebase's existing libraries. All exact values are in **Design Tokens** below.

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Canvas / app background | `#EAE0CE` | outer gallery bg (sand) |
| Screen background | `#FBF3E7` | primary screen bg (warm cream) |
| Ink / primary | `#111111` | text, dark cards, primary buttons, dark nav icons |
| Ink on dark card panel | `#111111` | "resume" card, AI CTA button bg |
| Muted text | `#6B6660` | secondary labels, inactive icons, meta |
| Surface / card | `#FFFFFF` | cards, chips, list rows |
| Card border | `rgba(0,0,0,.06)` | 1px hairline on white cards |
| Card shadow | `0 4px 16px rgba(0,0,0,.05)` | standard card elevation |
| Nav bar shadow | `0 6px 24px rgba(0,0,0,.1)` | floating bottom nav |
| Neutral avatar / +N chip | `#EDE6D8` | overflow avatar bg |

### Accent palette (avatar / root / category colors — rotate through these)
| Hex | Name |
|---|---|
| `#F7B6D6` | pink (primary accent — FAB, key highlights) |
| `#A9C6F0` | blue |
| `#F2D45C` | yellow |
| `#9CB55F` | green |
| `#D9C4F5` | lavender |
| `#E4574B` | red (error / "link died" / destructive) |

The splash logo ring is a `conic-gradient` cycling pink → blue → yellow → green → lavender, separated by `#111` 8° gaps (`from -8deg`).

### Typography
- **Display / headings / numerals:** `Inter Tight` (Google Fonts), weights 500/600/700/800. Used for the wordmark, screen titles, avatar initials, status-bar clock. Tight tracking: `letter-spacing:-.02em` to `-.03em` on large sizes.
- **Body / UI:** `General Sans` (Fontshare), weights 400/500/600/700. Default `body` font. Buttons use 600.
- Type scale seen: wordmark 40–44px/800; screen title 26px/700; section header 17px/600; card title 16px/600; body 15px/1.45; label 13px; meta 11–12px.

### Radii
- Phone frame: `54px`
- Cards / chips / list rows / dark panels: `24px`
- Inner icon tiles: `16px`
- Pills, avatars, FAB, bottom nav, spinner: `999px`

### Spacing
- Screen content horizontal padding: `20px`
- Card padding: `18px` (list rows), `20–22px` (feature cards)
- Gaps: `12px` between cards/chips, `8–16px` inside rows

### Shadows
- Card: `0 4px 16px rgba(0,0,0,.05)`
- Floating bottom nav: `0 6px 24px rgba(0,0,0,.1)`
- FAB (pink): `0 8px 20px rgba(247,182,214,.6)`

## Screens / Views
Frames in the file, in order. Each is a 390×844 iOS frame: status bar (9:41, signal/wifi/battery SVGs), Dynamic-Island pill (112×34, top 12px), and home indicator (134×5 pill, bottom 9px).

0. **Splash** — dark (`#111`) launch screen. Animated conic-gradient logo ring (150px) with a "root" glyph, "Rootly / Every link has a home." wordmark, spinner + "Growing your roots…". Animations: `ringIn` (scale .86→1, .7s ease-out), `spin` (1s linear infinite).
1. **Home — Your roots** — greeting header ("Tuesday, 28 July / Good morning, Umar") + avatar; horizontal scroll of root chips; dark "Jump back in" resume card; "Your roots" list of root rows (overlapping member avatars + name + link/shelf counts + chevron); pink AI assistant card with "Review" CTA; floating bottom nav.
2. **Root Detail** — a single Root's shelves.
3. **Shelf Links** — links within a shelf.
4. **Link Detail** — a single link's metadata.
5. **Ask** — AI assistant / query screen.
6. **Add Flow** — add a link (dark-accented step).
7. **Onboarding**
8. **Empty Home** — zero-state of Home.
9. **Settings / Profile**
11. **Notifications Inbox**
12. **Manual Add / Edit**
13. **Auth** — sign in / up.
14. **Timeline** — activity feed.
15. **Team Workspace**
16. **Invite Members**

> (There is no frame 10 — numbering skips it.)

### Shared components (build these once, reuse)
- **PhoneFrame** — 390×844, radius 54, bg per screen, `box-shadow:0 4px 16px rgba(0,0,0,.05), 0 0 0 12px #111, 0 0 0 13px #2a2a2a`, `overflow:hidden`. In a real app this maps to a screen container, not literal chrome — drop the bezel/status-bar/home-indicator when targeting a native device (the OS provides them).
- **Card** — white, radius 24, 1px `rgba(0,0,0,.06)` border, card shadow.
- **RootRow** — overlapping avatar stack (26px circles, 2px white border, `-8px` overlap, up to 3 shown + `+N` overflow chip in `#EDE6D8`) + title + meta + right chevron.
- **Avatar / initial chip** — circle, accent bg from palette, Inter Tight initial. Sizes: 26 (stack), 44–48 (header/chip), 52 (feature).
- **RootChip** — 118px white card, 48px accent avatar, name + "N links".
- **AI card** — pink (`#F7B6D6`) radius-24, sparkle icon + "Rootly assistant" + body + dark pill CTA.
- **Bottom nav** — floating pill (`#FBF3E7`, radius 999, nav shadow), 5 slots: Home / Clock(recent) / center pink FAB (raised `-30px`) / Grid / Settings-gear. Active icon stroke `#111`, inactive `#6B6660`.
- **Button (primary)** — `#111` bg, white text, radius 999, 11×20 padding, General Sans 600.

## Icons
**All icons are inline SVG, 24×24 viewBox, Lucide/Feather-style line icons** — `fill:none`, `stroke:currentColor` (rendered `#111` active / `#6B6660` inactive), `stroke-width:1.6–1.8`, round caps/joins. Recreate with **Lucide** (or your codebase's existing icon set) — do not re-copy the raw paths unless convenient. Icons observed:
- **Home** — house (`lucide: home`)
- **Recent** — clock (`clock`)
- **Add / FAB** — plus (`plus`)
- **Grid / roots** — 2×2 squares (`layout-grid`)
- **Settings** — gear (`settings`)
- **Chevron** — right chevron on rows (`chevron-right`)
- **Resume / audio** — speaker/volume glyph (`volume-2`)
- **AI / assistant** — sparkle/star, **filled** `#111` (`sparkles` / `star`)
- **Root glyph** (splash) — custom "sprouting root" mark (stem + circle node + branching legs). This is the **brand logomark** — keep custom; do not substitute a stock icon.
- Status bar: signal bars, wifi, battery — custom SVG, iOS-style; provided by the OS in a real build.

## Interactions & Behavior
- **Splash → Home** after load (`ringIn` + `spin` animations, ~1–1.5s).
- **Navigation:** tab bar switches Home / Recent / Grid / Settings; FAB opens Add flow. Root row → Root Detail → Shelf Links → Link Detail (push navigation, chevron affordance).
- **AI assistant:** surfaces suggestions (e.g. "4 links in Head Office haven't been opened in 90+ days. Archive them?") with a Review action.
- **Error state:** dead links shown in red (`#E4574B`), e.g. "3 links died recently".
- Horizontal scroll for root chips (hidden scrollbar — `.hidescroll`).
- Empty Home (frame 8) is the zero-state; wire it when a user has no roots.

## State Management
- Current user (name, avatar color/initial), current date/greeting.
- Roots list: each `{ name, avatarColor, linkCount, shelfCount, members[], deadLinkCount }`.
- Shelves per root; links per shelf: each `{ title, url, root, shelf, favicon/accent, lastOpened, status: alive|dead }`.
- "Jump back in" = most-recent link.
- AI suggestions feed; notifications inbox.
- Team workspace: members, roles, invites.
- Auth session.

## Assets
No external image assets — all avatars are colored circles with initials, all icons are inline SVG (map to Lucide). Fonts loaded from Google Fonts (Inter Tight) and Fontshare (General Sans); in a real app, bundle these or use the codebase's existing font pipeline. The custom **root logomark** SVG (splash + status glyph) should be extracted from `Rootly.dc.html` (frame 0) as the app icon / brand mark.

## Files
- `Rootly.dc.html` — the full design reference (all ~18 screens). Open in a browser to view. Ignore the `<x-dc>` / `support.js` wrapper and the gallery captions; read the inline styles per frame for exact values.
