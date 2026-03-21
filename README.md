# Noted

A personal knowledge base. Clean, fast, yours.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Backend | Convex (real-time, serverless) |
| Editor | Tiptap (ProseMirror-based rich text) |
| Auth | Custom JWT via `jose` (cookie-based sessions) |
| Styling | Tailwind CSS v4 |
| Drag & Drop | dnd-kit |
| UI Components | Radix UI primitives + Sonner toasts |
| Themes | next-themes (light / dark / system) |
| Offline | IndexedDB via `idb` |

---

## Features

- **Spaces** — top-level containers for organizing pages
- **Pages** — nested rich-text documents with cover images, icons, and public sharing
- **Tasks** — lightweight task tracker with due dates, statuses, and drag-to-reorder
- **Command palette** — `⌘K` / `Ctrl+K` search and navigation
- **OG images** — dynamic Open Graph images for shared pages
- **Invite-key auth** — self-hosted, name-based login; no email/password required

---

## Project Structure

```
noted/
├── convex/               # Convex backend (queries, mutations, schema)
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Bootstrap, register, sign-in mutations
│   ├── spaces.ts         # Space CRUD
│   ├── pages.ts          # Page CRUD + full-text search
│   ├── tasks.ts          # Task CRUD
│   ├── files.ts          # File metadata
│   └── admin.ts          # Stats, invite key management
├── src/
│   ├── app/
│   │   ├── (app)/        # Authenticated app shell
│   │   │   ├── page.tsx          # Home (redirects to first space)
│   │   │   ├── [spaceId]/        # Space overview + page editor
│   │   │   ├── tasks/            # Task board
│   │   │   ├── settings/         # User settings
│   │   │   └── admin/            # Admin dashboard
│   │   ├── (auth)/auth/  # Login / register / setup
│   │   ├── share/[token] # Public page viewer
│   │   └── api/
│   │       ├── og/       # Dynamic OG image generation (edge)
│   │       └── upload/   # Upload proxy (placeholder for R2)
│   ├── components/
│   │   ├── editor/       # Tiptap editor + custom extensions
│   │   ├── sidebar/      # Sidebar, space tree, drag-and-drop
│   │   ├── tasks/        # Task list and item components
│   │   ├── cmd/          # Command palette
│   │   ├── page/         # Page header (icon, cover, title)
│   │   ├── providers/    # Convex and theme providers
│   │   └── ui/           # Reusable UI primitives
│   ├── hooks/            # useCmdK, useOffline, usePWA, useEditor
│   └── lib/
│       ├── session.ts    # JWT session helpers
│       └── utils.ts      # cn(), formatRelativeTime()
├── middleware.ts         # JWT auth guard for all app routes
└── next.config.ts        # Next.js config (remote image patterns)
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in every value:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | **Yes** | Convex deployment URL (from Convex dashboard) |
| `CONVEX_DEPLOYMENT` | **Yes** | Convex deployment name (used by Convex CLI) |
| `JWT_SECRET` | **Yes in prod** | Random secret for signing session cookies — must be set in production or the server will crash on startup |
| `SETUP_KEY` | First run | Key you choose during the initial setup wizard (typed into the browser UI) |

> **`JWT_SECRET`**: generate a strong random value, e.g. `openssl rand -hex 32`.
> The server throws on startup if `JWT_SECRET` is missing in production.

---

## Local Development

### Prerequisites

- Node.js 18+
- A free [Convex](https://convex.dev) account

### Steps

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd noted
npm install

# 2. Set up Convex
npx convex dev
# This prompts you to log in, create a project, and writes
# CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL to .env.local automatically.

# 3. Add remaining env vars to .env.local
echo 'JWT_SECRET=dev-only-not-for-production' >> .env.local

# 4. Start Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first visit you will be shown the **Setup** screen — create the admin account using any setup key you choose.

---

## First-Time Setup (Admin Bootstrap)

1. Visit `/auth` — you'll see the setup form since no users exist.
2. Enter your name and invent a **setup key** (any string you like). This is a one-time step; the key is stored in the database.
3. After setup, go to **Settings → Invite key → Regenerate** to create an invite key that other users can use to register.

---

## Deploying to Vercel

### 1. Deploy Convex backend

```bash
npx convex deploy
```

This pushes your schema and functions to your Convex production deployment and prints the production URL.

### 2. Create a Vercel project

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo via the [Vercel dashboard](https://vercel.com/new).

### 3. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex production URL (from `npx convex deploy` output) |
| `CONVEX_DEPLOYMENT` | Your Convex deployment name |
| `JWT_SECRET` | A long random secret (`openssl rand -hex 32`) |

> Do **not** set `SETUP_KEY` as an env var — it is only used in the browser during first-time setup.

### 4. Deploy

```bash
vercel --prod
```

Or push to your connected Git branch.

### 5. First-time setup on production

Visit your Vercel URL → `/auth`, complete the setup wizard, then generate an invite key in Settings.

---

## Auth Model

Noted uses a simple name-based auth system (no passwords, no email):

- **Bootstrap** — first user creates the admin account (one-time only, requires a setup key).
- **Sign in** — users sign in by name alone.
- **Join** — new users register using an invite key generated by the admin.
- **Session** — a JWT cookie (`noted-session`, 30-day expiry, `httpOnly`) is set on the server.
- **Middleware** — every route except `/auth`, `/share/*`, and `/api/*` requires a valid JWT.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex local dev (watches for schema/function changes) |
| `npx convex deploy` | Deploy Convex to production |
