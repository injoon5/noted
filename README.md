# Noted

A self-hosted personal knowledge base. Clean, fast, yours.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Database & Backend | Convex (real-time, serverless) | 1.21 |
| Rich Text Editor | Tiptap (ProseMirror) | 2.11 |
| Auth | Custom JWT via `jose` + httpOnly cookies | 5.9 |
| Styling | Tailwind CSS | 4 |
| Drag & Drop | dnd-kit | 6/8 |
| UI Primitives | Radix UI | latest |
| Toasts | Sonner | 2 |
| Themes | next-themes | 0.4 |
| Offline Cache | IndexedDB via `idb` | 8 |
| Command Palette | cmdk | 1 |

---

## Features

- **Spaces** — top-level containers for organizing pages
- **Pages** — nested rich-text documents with cover images, icons, breadcrumbs, and public share links
- **Tasks** — task board with due dates, statuses (`todo` / `in progress` / `done`), and drag-to-reorder
- **Full-text search** — Convex search index across page titles and content
- **Command palette** — `⌘K` / `Ctrl+K` for navigation, search, and quick actions
- **Favorites** — pin pages for quick sidebar access
- **OG images** — dynamic Open Graph images for shared pages (edge-rendered)
- **Offline support** — pages cached in IndexedDB
- **Admin dashboard** — stats, recent activity, invite key management
- **Theme** — light / dark / system

---

## Architecture Overview

```
Browser ──── Next.js 16 (App Router) ──── Convex (serverless backend)
               │                              │
               │  JWT cookie (httpOnly)        │  Real-time queries
               │  middleware.ts guards         │  + mutations
               │  all /app routes              │
               │                              │
               ├── /app/*      (authenticated) │
               ├── /auth       (public)        │
               ├── /share/*    (public)        │
               └── /api/og     (edge, public)  │
```

**Data flow:**
- The Next.js frontend talks directly to Convex via the `convex/react` client (WebSocket).
- Server actions (`src/app/actions/auth.ts`) handle session cookie creation/deletion.
- Middleware validates the JWT on every request before the page renders.
- Convex functions are the only place that reads/writes the database.

---

## Project Structure

```
noted/
├── convex/                   # Convex backend — deployed separately
│   ├── schema.ts             # All table definitions and indexes
│   ├── auth.ts               # bootstrap / register / signIn mutations
│   ├── spaces.ts             # Space CRUD + reorder
│   ├── pages.ts              # Page CRUD + full-text search + favorites
│   ├── tasks.ts              # Task CRUD + reorder + date queries
│   ├── files.ts              # File metadata CRUD
│   └── admin.ts              # Stats, recent activity, invite key
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Convex + Theme providers)
│   │   ├── globals.css
│   │   ├── (app)/                   # Route group — requires auth
│   │   │   ├── layout.tsx           # App shell: sidebar + cmd palette
│   │   │   ├── page.tsx             # Home — auto-redirects to first space
│   │   │   ├── [spaceId]/
│   │   │   │   ├── page.tsx         # Space overview + page list
│   │   │   │   └── [...slug]/
│   │   │   │       └── page.tsx     # Page editor (Tiptap + auto-save)
│   │   │   ├── tasks/page.tsx       # Task board
│   │   │   ├── settings/page.tsx    # Theme, stats, users, invite key
│   │   │   └── admin/page.tsx       # Admin dashboard
│   │   ├── (auth)/auth/page.tsx     # Setup / sign-in / join
│   │   ├── share/[token]/
│   │   │   ├── page.tsx             # Server component — fetches shared page
│   │   │   └── share-page-client.tsx
│   │   └── api/
│   │       ├── og/route.tsx         # Edge: OG image generation
│   │       └── upload/route.ts      # Upload auth proxy (placeholder)
│   │
│   ├── components/
│   │   ├── editor/                  # Tiptap editor + all custom extensions
│   │   │   ├── editor.tsx
│   │   │   ├── extensions.ts        # Extension bundle
│   │   │   ├── toolbar.tsx          # Formatting toolbar
│   │   │   ├── slash-command.tsx    # /command menu
│   │   │   ├── callout-extension.ts
│   │   │   ├── toggle-extension.ts
│   │   │   └── page-link-extension.ts
│   │   ├── sidebar/                 # Sidebar + space tree + DnD
│   │   ├── page/page-header.tsx     # Icon picker, cover image, title
│   │   ├── tasks/                   # Task list + individual task items
│   │   ├── cmd/cmd-palette.tsx      # ⌘K command palette
│   │   ├── providers/               # ConvexClientProvider, ThemeProvider
│   │   └── ui/                      # Radix-based primitives + offline banner
│   │
│   ├── hooks/
│   │   ├── useCmdK.ts              # ⌘K open/close state
│   │   ├── useOffline.ts           # Network status detection
│   │   ├── usePWA.ts               # PWA install prompt
│   │   └── useEditor.ts            # Page editor state + auto-save
│   │
│   └── lib/
│       ├── session.ts              # createSession / getSession / clearSession
│       └── utils.ts                # cn(), formatRelativeTime()
│
├── middleware.ts                   # JWT guard — protects all app routes
├── next.config.ts                  # Remote image patterns
├── eslint.config.mjs
└── .env.local.example
```

---

## Database Schema (Convex)

| Table | Key Fields |
|---|---|
| `users` | `name`, `role` (`admin` \| `member`), `createdAt` |
| `spaces` | `title`, `icon`, `order`, `ownerId`, `isPublic`, `shareToken` |
| `pages` | `spaceId`, `parentId`, `title`, `content`, `icon`, `coverImage`, `order`, `isPublic`, `shareToken`, `isFavorite` |
| `tasks` | `title`, `description`, `status`, `dueDate`, `linkedPageId`, `order` |
| `files` | `storageId`, `url`, `name`, `size`, `mimeType`, `linkedPageId` |
| `settings` | `key`, `value` — stores `INVITE_KEY`, `SETUP_KEY` |
| `offlinePages` | `pageId`, `userId`, `cachedAt` |

**Indexes:** `pages` — `by_space`, `by_parent`, `by_share_token`, `search_title`, `search_content` · `tasks` — `by_due_date`, `by_status` · `settings` — `by_key`

---

## Environment Variables

Copy the example file and fill in all values before running:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | **Yes** | Your Convex deployment URL — starts with `https://…convex.cloud` |
| `CONVEX_DEPLOYMENT` | **Yes** | Convex deployment slug, e.g. `dev:my-project-123` |
| `JWT_SECRET` | **Yes in production** | Secret for signing session cookies. Missing in production causes a startup crash. |

> Generate a strong secret: `openssl rand -hex 32`

---

## Local Development

### Prerequisites

- **Node.js** 18 or later
- A free [Convex account](https://convex.dev) — no credit card needed

### 1. Install dependencies

```bash
git clone <repo-url>
cd noted
npm install
```

### 2. Start Convex (in its own terminal)

```bash
npx convex dev
```

On first run this will:
1. Prompt you to log in to Convex (browser opens)
2. Create a new project or select an existing one
3. Automatically write `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
4. Watch `convex/` for changes and push them live

Keep this terminal running while developing.

### 3. Set remaining env vars

```bash
# .env.local (JWT_SECRET can be anything locally)
echo 'JWT_SECRET=local-dev-secret' >> .env.local
```

### 4. Start Next.js (in a second terminal)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time setup

On first visit, the app detects no users exist and shows the **Setup** screen:

1. Enter your name and choose any **setup key** — this is a one-time password you invent yourself. It gets stored in the database and secures the setup endpoint.
2. You're logged in as admin.
3. Go to **Settings → Invite key → Regenerate** to generate a code other users can use to register.

---

## Deploying to Vercel

### Step 1 — Deploy the Convex backend

```bash
npx convex deploy
```

This compiles and pushes all functions and schema to your Convex **production** deployment. Note the production URL printed at the end.

### Step 2 — Push your code to GitHub

Vercel deploys from Git. Push to your repo:

```bash
git push origin main
```

### Step 3 — Create a Vercel project

Option A — Vercel CLI:
```bash
npm install -g vercel
vercel          # follow the prompts
```

Option B — Vercel dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)

### Step 4 — Set environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex production URL from Step 1 |
| `CONVEX_DEPLOYMENT` | Convex production deployment slug |
| `JWT_SECRET` | Strong random secret — `openssl rand -hex 32` |

> Set all three variables for **Production**, **Preview**, and **Development** environments.

### Step 5 — Deploy

```bash
vercel --prod
```

Or just merge a PR — Vercel deploys automatically on push.

### Step 6 — First-time setup on production

Visit your live URL → `/auth`, complete the setup wizard, then generate an invite key in **Settings**.

---

## Auth Flow

Noted uses a lightweight name-based auth (no email/password by design):

```
Sign in:   enter name → Convex looks up user → server sets JWT cookie
Register:  enter name + invite key → Convex validates → creates user → sets JWT cookie
Bootstrap: enter name + setup key → only works when 0 users exist → creates admin → sets JWT cookie
```

| Property | Detail |
|---|---|
| Cookie name | `noted-session` |
| Expiry | 30 days |
| Algorithm | HS256 |
| Flags | `httpOnly`, `secure` (prod), `sameSite: lax` |
| Middleware | Validates JWT on every request to `/(app)/*` |
| Public routes | `/auth`, `/share/*`, `/api/*` — no token required |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Start production server (run build first) |
| `npm run lint` | ESLint across `src/` and `convex/` |
| `npx convex dev` | Start Convex dev server + file watcher |
| `npx convex deploy` | Deploy Convex schema and functions to production |

---

## Troubleshooting

**`NEXT_PUBLIC_CONVEX_URL` is not defined**
Run `npx convex dev` first — it writes this to `.env.local` automatically.

**Server crashes with "JWT_SECRET environment variable is required in production"**
Add `JWT_SECRET` to your Vercel environment variables (see Step 4 above).

**Convex functions not updating**
Make sure `npx convex dev` is running in a separate terminal. Changes to `convex/` are not picked up by `npm run dev` alone.

**Can't sign up — "Invalid invite key"**
No invite key has been generated yet. Sign in as admin → **Settings** → **Regenerate invite key**, then share the key with new users.

**Page content not saving**
Auto-save fires 800 ms after you stop typing. Check the browser console for Convex errors — the most common cause is a stale `NEXT_PUBLIC_CONVEX_URL`.
