# Noted

A self-hosted personal knowledge base. Clean, fast, yours.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Database & Backend | Convex (real-time, serverless) | 1.34 |
| Auth | Better Auth + `@convex-dev/better-auth` | 1.5 / 0.11 |
| File Storage | Cloudflare R2 via `@convex-dev/r2` | 0.9 |
| Rich Text Editor | Tiptap (ProseMirror) | 2.11 |
| Styling | Tailwind CSS | 4 |
| Drag & Drop | dnd-kit | 6/8 |
| UI Primitives | Radix UI | latest |
| Toasts | Sonner | 2 |
| Themes | next-themes | 0.4 |
| Command Palette | cmdk | 1 |

---

## Features

- **Email + password auth** — sign in with email/password via Better Auth
- **Invite-code gating** — new sign-ups require a secret invite code; first user becomes admin automatically
- **Spaces** — top-level containers for organizing pages
- **Pages** — nested rich-text documents with cover images, icons, breadcrumbs, and public share links
- **File uploads** — cover images upload directly to Cloudflare R2
- **Tasks** — task board with due dates, statuses (`todo` / `in progress` / `done`), and drag-to-reorder
- **Full-text search** — Convex search index across page titles and content
- **Command palette** — `⌘K` / `Ctrl+K` for navigation, search, and quick actions
- **Favorites** — pin pages for quick sidebar access
- **OG images** — dynamic Open Graph images for shared pages (edge-rendered)
- **Admin dashboard** — workspace stats, recent activity, invite key management (admin-only)
- **Theme** — light / dark / system

---

## Architecture Overview

```
Browser ──── Next.js 16 (App Router) ──── Convex (serverless backend)
               │                              │
               │  Better Auth session         │  Real-time queries + mutations
               │  middleware.ts validates      │  betterAuth component (user/session tables)
               │  all /app routes             │  r2 component (file storage)
               │                              │
               ├── /app/*      (authenticated) │
               ├── /auth       (public)        │
               ├── /share/*    (public)        │
               └── /api/       (public/auth)   │
                   ├── auth/[...all]  ← proxies Better Auth requests to Convex site
                   └── og/           ← edge OG image generation
```

**Data flow:**
- The Next.js frontend talks directly to Convex via the `convex/react` client (WebSocket).
- Better Auth manages sessions; `middleware.ts` uses `getToken()` to validate every request.
- `ConvexBetterAuthProvider` wraps the app and keeps auth state in sync.
- File uploads go directly from the browser to Cloudflare R2 via signed URLs; metadata is stored in Convex.
- Admin queries return `null` for non-admin users — enforced server-side.

---

## Project Structure

```
noted/
├── convex/                         # Convex backend — deployed separately
│   ├── convex.config.ts            # Registers betterAuth + r2 components
│   ├── schema.ts                   # All table definitions and indexes
│   ├── auth.ts                     # getCurrentUser, listUsers, invite key queries
│   ├── auth.config.ts              # Convex JWT auth provider config
│   ├── http.ts                     # Registers Better Auth HTTP routes
│   ├── spaces.ts                   # Space CRUD + reorder
│   ├── pages.ts                    # Page CRUD + full-text search + favorites
│   ├── tasks.ts                    # Task CRUD + reorder + date queries
│   ├── files.ts                    # File metadata CRUD (via R2)
│   ├── r2.ts                       # R2 instance + clientApi for uploads
│   ├── admin.ts                    # Stats, recent activity, invite key (admin-only)
│   └── betterAuth/
│       ├── auth.ts                 # Better Auth config (invite-code hook, first-admin)
│       ├── schema.ts               # Auth tables: user, session, account, verification
│       ├── adapter.ts              # Better Auth ↔ Convex adapter
│       └── convex.config.ts        # betterAuth component definition
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (token fetch → ConvexBetterAuthProvider)
│   │   ├── globals.css
│   │   ├── (app)/                  # Route group — requires auth
│   │   │   ├── layout.tsx          # App shell: sidebar + cmd palette
│   │   │   ├── page.tsx            # Home — auto-redirects to first space
│   │   │   ├── [spaceId]/
│   │   │   │   ├── page.tsx        # Space overview + page list
│   │   │   │   └── [...slug]/
│   │   │   │       └── page.tsx    # Page editor (Tiptap + auto-save)
│   │   │   ├── tasks/page.tsx      # Task board
│   │   │   ├── settings/page.tsx   # Theme, stats, users, invite key
│   │   │   └── admin/page.tsx      # Admin dashboard (admin role required)
│   │   ├── (auth)/auth/page.tsx    # Setup / sign-in / join (with invite code)
│   │   ├── share/[token]/          # Public shared page viewer
│   │   └── api/
│   │       ├── auth/[...all]/      # Proxies Better Auth requests → Convex site URL
│   │       └── og/route.tsx        # Edge: OG image generation
│   │
│   ├── components/
│   │   ├── editor/                 # Tiptap editor + all custom extensions
│   │   ├── sidebar/                # Sidebar + space tree + DnD reorder
│   │   ├── page/page-header.tsx    # Icon picker, R2 cover upload, title
│   │   ├── tasks/                  # Task list + individual task items
│   │   ├── cmd/cmd-palette.tsx     # ⌘K command palette
│   │   ├── providers/              # ConvexBetterAuthProvider, ThemeProvider
│   │   └── ui/                     # Radix-based primitives
│   │
│   └── lib/
│       ├── auth-client.ts          # Better Auth React client (convexClient plugin)
│       ├── auth-server.ts          # convexBetterAuthNextJs (handler, getToken, etc.)
│       └── utils.ts                # cn(), formatRelativeTime()
│
├── middleware.ts                   # Session guard — validates Better Auth token
├── next.config.ts                  # Remote image patterns
└── .env.local.example
```

---

## Database Schema (Convex)

> Tables prefixed with `betterAuth/` live inside the betterAuth component namespace.

| Table | Key Fields |
|---|---|
| `user` | `name`, `email`, `emailVerified`, `role` (`admin` \| `member`), `createdAt` |
| `session` | `token`, `userId`, `expiresAt` |
| `spaces` | `title`, `icon`, `order`, `ownerId`, `isPublic`, `shareToken` |
| `pages` | `spaceId`, `parentId`, `title`, `content`, `icon`, `coverImage`, `order`, `isPublic`, `shareToken`, `isFavorite` |
| `tasks` | `title`, `description`, `status`, `dueDate`, `linkedPageId`, `order` |
| `files` | `storageId` (R2 key), `url`, `name`, `size`, `mimeType`, `linkedPageId` |
| `settings` | `key`, `value` — stores `INVITE_KEY` |

**Indexes:** `pages` — `by_space`, `by_parent`, `by_share_token`, `search_title`, `search_content` · `tasks` — `by_due_date`, `by_status` · `settings` — `by_key`

---

## Environment Variables

### Next.js (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | **Yes** | Convex deployment URL (`https://…convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | **Yes** | Convex site URL (`https://…convex.site`) |
| `CONVEX_DEPLOYMENT` | **Yes** | Deployment slug, e.g. `dev:my-project-123` |

### Convex (set via `npx convex env set <key> <value>`)

| Variable | Required | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | **Yes** | Random secret — `openssl rand -base64 32` |
| `SITE_URL` | **Yes** | Your app's public URL, e.g. `https://noted.example.com` |
| `R2_BUCKET` | For file uploads | Cloudflare R2 bucket name |
| `R2_TOKEN` | For file uploads | R2 API token |
| `R2_ACCESS_KEY_ID` | For file uploads | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | For file uploads | R2 secret access key |
| `R2_ENDPOINT` | For file uploads | `https://<account-id>.r2.cloudflarestorage.com` |

---

## Local Development

### Prerequisites

- **Node.js** 18 or later
- A free [Convex account](https://convex.dev) — no credit card needed
- (Optional) A [Cloudflare account](https://cloudflare.com) with an R2 bucket for file uploads

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

### 3. Set Convex environment variables

```bash
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set SITE_URL "http://localhost:3000"
```

For R2 file uploads (optional locally):
```bash
npx convex env set R2_BUCKET your-bucket-name
npx convex env set R2_TOKEN your-token
npx convex env set R2_ACCESS_KEY_ID your-key-id
npx convex env set R2_SECRET_ACCESS_KEY your-secret
npx convex env set R2_ENDPOINT "https://<account-id>.r2.cloudflarestorage.com"
```

### 4. Set Next.js environment variable

Add to `.env.local` (get the value from your Convex dashboard → Settings → URL & Deploy Key):
```
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-deployment>.convex.site
```

### 5. Start Next.js (in a second terminal)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time setup

On first visit, the app detects no users exist and shows the **Setup** screen:

1. Enter your name, email, and a password (min 8 chars).
2. You're automatically signed in as **admin** — no invite code needed for the first user.
3. Go to **Settings** → **Invite key** → **Regenerate** to create a code for inviting others.
4. Share the invite code with users who want to join. They use it on the "Join" tab.

---

## Deploying to Vercel

### Step 1 — Deploy the Convex backend

```bash
npx convex deploy
```

This pushes all functions, schema, and components to your Convex **production** deployment. Copy the production site URL printed at the end.

### Step 2 — Set Convex production environment variables

```bash
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)" --prod
npx convex env set SITE_URL "https://your-app.vercel.app" --prod
# Add R2 vars if using file uploads
```

### Step 3 — Push your code to GitHub

```bash
git push origin main
```

### Step 4 — Create a Vercel project

Option A — Vercel CLI:
```bash
npx vercel          # follow the prompts
```

Option B — Vercel dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)

### Step 5 — Set environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex production URL (ends in `.convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex site URL (ends in `.convex.site`) |
| `CONVEX_DEPLOYMENT` | Convex production deployment slug |

### Step 6 — Deploy

```bash
npx vercel --prod
```

Or merge a PR — Vercel deploys automatically on push to `main`.

---

## Auth Flow

Noted uses **Better Auth** (email + password) integrated with Convex:

```
First user:   email + password → no invite code required → role: admin
Join:         email + password + invite code → validated server-side → role: member
Sign in:      email + password → Better Auth issues session token → middleware validates
Sign out:     authClient.signOut() → session revoked → redirect to /auth
```

| Property | Detail |
|---|---|
| Session storage | Better Auth session table in Convex |
| Token delivery | HTTP-only cookie via `convexBetterAuthNextJs` |
| Middleware | `getToken()` from `@convex-dev/better-auth/utils` validates every request |
| Public routes | `/auth`, `/share/*`, `/api/*` — no token required |
| Admin access | `convex/admin.ts` functions check `user.role === "admin"` server-side |
| Invite key | Stored in `settings` table; regenerated via admin panel (cryptographically random) |

---

## R2 File Storage

Cover images upload directly from the browser to Cloudflare R2:

1. `useUploadFile(api.r2)` hook calls `convex/r2.ts:generateUploadUrl` (mutation)
2. Browser PUTs the file directly to R2 (no server in the middle)
3. Hook calls `syncMetadata` to store file info in Convex
4. `convex/files.ts:saveFile` is called with the R2 key to record metadata
5. `convex/files.ts:getUrl` reads the URL from `r2.getMetadata()` (Convex table lookup, not an HTTP call)

Your R2 bucket needs a CORS policy allowing `GET` and `PUT` from your app's origin:
```json
[{
  "AllowedOrigins": ["https://your-app.vercel.app"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["Content-Type"]
}]
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server (run build first) |
| `npm run lint` | ESLint across `src/` and `convex/` |
| `npx convex dev` | Start Convex dev server + file watcher (required) |
| `npx convex deploy` | Deploy Convex schema and functions to production |

---

## Troubleshooting

**`NEXT_PUBLIC_CONVEX_URL` is not defined**
Run `npx convex dev` first — it writes this to `.env.local` automatically.

**`NEXT_PUBLIC_CONVEX_SITE_URL` is not defined**
Find it in your Convex dashboard → Settings → URL & Deploy Key. It ends in `.convex.site`.

**TypeScript errors in `convex/_generated/`**
Run `npx convex dev` — it regenerates the type files. Never edit `_generated/` manually.

**Convex functions not updating**
Make sure `npx convex dev` is running in a separate terminal. Changes to `convex/` are not picked up by `npm run dev` alone.

**Can't sign up — "Invalid invite code"**
No invite key exists yet. Sign in as admin → **Settings** → **Regenerate invite key**, share with the new user.

**Cover image not displaying after upload**
Ensure R2 env vars are set in Convex (`npx convex env set ...`) and the bucket has a CORS policy for your domain.

**Page content not saving**
Auto-save fires 800 ms after you stop typing. Check the browser console for Convex errors — most common cause is a stale `NEXT_PUBLIC_CONVEX_URL`.
