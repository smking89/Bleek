# Bleek — a social platform that isn't just a Discord skin

A working full-stack social client built with Next.js 15, React 19 and Tailwind v4. Real-time chat, animated
cosmetics, and the four structural changes from the brief: a unified home feed, hybrid channel layouts, creator-owned
storefronts, and a local guard + visual role constructor. No external services, no API keys.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

State is in-process and reseeds on restart. There is one signed-in demo user (`Nova`).

## Landing page and ASTRO sign-in

`/` is the ASTRO access page; the Bleek client moved to `/app`. Creating an account writes a real ASTRO user, its
wallet (seeded with 250 coins) and a scrypt password hash, then sets an http-only session cookie signed with
`ASTRO_AUTH_SECRET`. Logging in verifies the hash and re-issues that cookie.

- `POST /api/astro/auth/register` — `{ handle, displayName, password }`
- `POST /api/astro/auth/login` — `{ handle, password }`
- `POST /api/astro/auth/logout`
- `GET /api/astro/auth/session`

Passwords are scrypt-hashed and compared with `timingSafeEqual`. Unknown handles and wrong passwords return the same
401 so the endpoint cannot enumerate accounts. Sessions last 30 days and are `httpOnly`, `sameSite=lax`, and `secure`
in production.

## ASTRO ecosystem layer

ASTRO is the account layer shared by Bleek, Koba.games and SnagChat. It ships as three paste-ready pieces:

- `prisma/schema.prisma` — one `User`, one `AccountWallet` (single coin balance for every product) and
  `UserConnection` chips keyed by the `PlatformType` enum (`BEEK`, `KOBA_GAMES`, `SNAGCHAT`). Wallets and connections
  cascade on user delete; lookups go through unique `platform` + `handleNormalized`.
- `src/lib/astro/links.ts` — `generateASTROLink(platform, handle)` plus normalisation, formatting and a non-throwing
  `tryGenerateASTROLink`. Client-safe: it never imports the generated Prisma client.
- `src/components/astro/profile-connections.tsx` — the profile link row: wrapping rounded pills on `#111214` over a
  `#000000` surface, truncated handles, verified marks and the dotted `+ Add` chip in editing mode.

`/astro` renders a real account straight from PostgreSQL, with a connect form that writes through the API and a chip
row you can remove from. On an empty database it offers a one-click demo account.

### Data layer

`prisma/migrations` holds the applied `astro_init` migration. Copy `.env.example` to `.env`, point `DATABASE_URL` at a
PostgreSQL database, then:

```bash
npm run db:generate   # prisma generate (also runs on install)
npm run db:migrate    # create and apply migrations in development
npm run db:deploy     # apply committed migrations in production
npm run db:studio     # inspect rows in Prisma Studio
```

`src/lib/astro/db.ts` exposes one cached `PrismaClient` per process and refuses to start without `DATABASE_URL`.
`src/lib/astro/accounts.ts` holds every operation: create an account with its wallet in one write, read it with chips in
display order, delete it, connect or disconnect a product handle, and move coins through a version-guarded update so two
products cannot overwrite each other's balance. Failures surface as `AstroDataError` with an HTTP status and a code.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/astro/accounts` | Create a user and its wallet (`handle`, `displayName`, `accentColor`, `startingCoins`, …) |
| GET | `/api/astro/accounts/[handle]` | Account, wallet and ordered chips |
| DELETE | `/api/astro/accounts/[handle]` | Delete the account; wallet and chips cascade |
| POST | `/api/astro/accounts/[handle]/connections` | Link `{ platform, handle }` and return the chip |
| DELETE | `/api/astro/accounts/[handle]/connections/[connectionId]` | Unlink a chip and promote a new primary |
| POST | `/api/astro/accounts/[handle]/wallet` | Move the shared balance by `{ delta }` |

## What's different from a straight clone

**1. Unified home feed instead of a sidebar of dead servers**
The Bleek mark at the top of the rail opens `/` — one cross-server timeline. It merges every channel with history, ranks them
by activity in the last 24h, and supports filters for text threads, audio rooms, and trending words across all servers.
A right rail shows the day's activity, who's around, and creator earnings. Clicking a thread jumps straight to it.

**2. Hybrid channel layouts, switchable per channel**
Every text channel is chat, gallery, or canvas, chosen from the header and persisted to the channel:

- **Chat** — the familiar linear stream (replies, reactions, edits, search, typing).
- **Gallery** — a masonry board for art drops and links, each message rendered as a gradient card with reactions.
- **Canvas** — a Notion-style document with a markdown editor (headings, bullets, numbered lists, quotes) and a saved
  preview. `#dev-log` in Pixel Forge ships seeded as a canvas.

**3. Creator-first storefronts inside each server**
Every server has its own shop, opened from the channel sidebar, a channel's bag icon, or the home feed:

- **Mint** — name, description, slot (decoration/effect/nameplate/theme), visual template, and price. Members with the
  `mint` permission publish directly into their server's storefront.
- **90/10 split** — every sale records a payout row: `creatorShare` (90%) and `platformShare` (10%), visible in the
  storefront's Payouts tab and the home feed's creator panel.
- **Gifting** — buy a cosmetic for another member from the storefront or the platform shop; they own it immediately and
  the creator is still paid. Self-gifting, duplicates, and insufficient balances are rejected server-side.
- The platform-wide shop still exists (26 items) alongside the community catalog.

**4. Guard: local, plain-language moderation**
The crown button opens the server console. Owners toggle the guard, pick low/balanced/strict sensitivity, and describe
what to catch as named rules with terms (`Scam & phishing: free-nitro, steamgift, claim airdrop`). The scanner also
scores shouting and link flooding. Every new message is scanned in-process — nothing leaves the server — and hits go to
a review queue where they can be kept or deleted. A "try it locally" box dry-runs the real scanner without posting.

**5. Visual role constructor**
Drag nodes to reorder the hierarchy; the graph line and order numbers update and persist. Each role has a colour, an
explicit permission set (view, send, react, attach, voice, moderate, manage channels/roles/server, mint), member counts
from the seeded roster, and create/rename/delete. Partial or duplicate orderings are rejected by the API.

## Cosmetics

26 platform items and 7 community mints across four slots: 10 animated decorations, 6 profile effects, 4 nameplates and
6 themes. Every visual is generated in CSS/SVG — masked conic-gradient rings, orbiting nodes, clip-path shapes,
starfields and gradient text — and scales from a 16px reply avatar to a 96px call tile through one component:

```tsx
<Avatar user={user} size={40} showStatus />   // frame + status dot from user.cosmetics
```

`ProfileEffect` layers ambient motion behind banners; `Nameplate` applies shimmering gradient text with per-rarity glow.

## API

| Route | Purpose |
| --- | --- |
| `GET /api/state` | Full snapshot (users, servers, messages, shop, gifts, payouts, typing) |
| `GET /api/events` | SSE stream: messages, edits, deletes, reactions, typing, profiles, servers, payouts, gifts |
| `POST /api/messages`, `PATCH/DELETE /api/messages/:id` | Send, edit, delete (guard applies on send) |
| `POST /api/messages/:id/reactions` | Toggle a reaction |
| `PATCH /api/channels/:id` | Set `layout` or publish the canvas `doc` |
| `PATCH /api/servers/:id/guard`, `POST` | Update config / dry-run a sample |
| `POST /api/servers/:id/flagged/:flagId` | Approve or delete a flagged message |
| `POST /api/servers/:id/storefront` | Mint a community cosmetic |
| `POST /api/servers/:id/roles` | Create, update, delete, or reorder roles |
| `POST /api/shop/purchase`, `POST /api/shop/gift` | Buy for yourself, or gift to a member |
| `PATCH /api/profile` | Profile fields and cosmetic equipping |

## Verified

`npx tsc --noEmit` clean; `npm run build` clean (9 pages, 140 kB first load). Endpoint smoke suite against a running
server covered: seeded roles/guard/storefronts, layout switching and validation, canvas doc saves, guard dry-runs on
scam vs. clean text, strict blocking vs. balanced flagging, flag resolution, role create/rename/reorder/delete with
permission sanitisation and ordering rejection, minting with template validation, storefront purchase with exact
2160/240 split, gifting plus self-gift rejection, and the home route rendering.

## Not implemented

- Voice channels have real join/leave/mute/deafen state and a call stage but no audio transport — that needs a
  WebRTC/LiveKit deployment and token endpoint.
- No Tauri/Rust desktop shell; this is the web client the shell would wrap.
- No encrypted DMs, webhooks, or external integrations from the brief.
- Single in-process store, no auth or database; data reseeds on restart.

## Operations console and developer platform

Two new surfaces sit on the ASTRO data layer: a staff console at `/admin` and a developer portal at `/developers`.
Both are gated by the same signed ASTRO session cookie; the console additionally requires a staff role.

### Staff roles

| Role | Capabilities |
| --- | --- |
| `MODERATOR` | Overview, account directory (read), suspend/restore members, work and resolve cases, audit log |
| `ADMIN` | Everything above plus wallet adjustments, member role changes, developer-app read and revocation |
| `SUPER_ADMIN` | Everything above plus granting/revoking staff roles and platform settings |

`src/lib/admin/roles.ts` holds the capability matrix and is imported by both the guards and the UI, so a hidden button and a
rejected request always agree. `src/lib/admin/access.ts` resolves the signed-in account to a staff context and throws a
403 `AdminError` when a capability is missing; route handlers call `requireStaff(capability)` before touching data.

Invariants enforced in `src/lib/admin/service.ts`:

- nobody can change their own staff role, or suspend themselves;
- staff cannot act on a role at or above their own rank;
- the last super admin cannot be demoted;
- a role can only be granted if it is assignable by the actor (`assignableRoles`);
- closing a case requires a resolution of 3–500 characters;
- every privileged mutation writes one row to `staff_audit` with actor, role, target, summary, metadata and IP.

### Bootstrap

The first staff role comes from the terminal, never from a privileged endpoint:

```bash
npm run staff:grant -- <handle> SUPER_ADMIN
npm run staff:grant -- <handle> ADMIN
npm run staff:grant -- <handle> none      # remove a role
```

The script refuses to remove the last super admin, loads `.env` when `DATABASE_URL` is absent, and writes an audit row
attributed to `system:cli`.

### Console routes

| Route | Purpose |
| --- | --- |
| `/admin` | KPI grid, range-aware signup/case and API-traffic charts, priority queue, staff on duty, recent activity |
| `/admin/users` | Searchable directory; drawer with role change, wallet adjustment, suspend/restore and profile links |
| `/admin/moderation` | Case queue with status/priority filters, claim/assign, notes, resolution and reopen |
| `/admin/developers` | Every issued app with owner, scopes, request and error counts, revoke/restore |
| `/admin/staff` | Role cards, capability counts, roster and grant/remove |
| `/admin/audit` | Filterable append-only event log with expandable metadata |

`GET` pages render server-side from PostgreSQL; mutations go through `/api/admin/*` and call `router.refresh()`, so the
numbers on screen always come back from the database rather than from optimistic client state.

### Developer portal

`/developers` explains the platform, `/developers/docs` is the API reference, and `/developers/console` is session-gated.

- Creating an app returns `clientId` plus a `astro_sk_…` secret **once**; only a SHA-256 hash, the display prefix and the
  last four characters are stored.
- Rotating replaces the hash, so the previous key fails on its next call. Revoking and restoring are separate from
  rotation, and deleting an app removes its usage rows by cascade.
- Scopes are per key: `profile:read`, `connections:read`, `wallet:read`, `wallet:write`.
- Each key is capped at 10,000 requests per UTC day, counted from `api_usage_daily` rather than memory.

| Method | Route | Scope |
| --- | --- | --- |
| GET | `/api/v1/me` | `profile:read` |
| GET | `/api/v1/connections` | `connections:read` |
| GET | `/api/v1/wallet` | `wallet:read` |
| POST | `/api/v1/wallet/adjust` | `wallet:write` |

Every call is wrapped by `withDeveloperApi`: it resolves the bearer key, enforces the scope and quota, runs the handler,
then records a request row, increments the daily aggregate and bumps the app counters. A key that is missing, malformed,
unknown, revoked or owned by a suspended account fails as 401 `INVALID_KEY` (or 403 `ACCOUNT_SUSPENDED`).

### Schema

Migration `20261029070000_staff_dev_platform` adds `StaffRole`, `AccountStatus`, `AppEnvironment`, `DeveloperAppStatus`,
`CaseStatus` and `CasePriority`, the staff/suspension columns on `users`, and the `developer_apps`, `api_usage_daily`,
`api_requests`, `moderation_cases`, `case_notes` and `staff_audit` tables with cascading keys and lookup indexes.

## Bleek access and handle verification

`/app` is no longer open. The page resolves the session server-side and redirects anonymous visitors to
`/?next=/app#access`; the sign-in card honours `next` only for same-origin paths, so it can never bounce off-site.
Suspended accounts are sent to `/?suspended=1#access`, where the card explains the suspension and offers a sign-out
instead of a login form. Neither the chat shell nor its data request renders for an anonymous visitor.

The chat identity is the ASTRO account, not the seeded demo user. `/app` passes `{ handle, displayName, verified }` into
the client and `src/lib/identity.ts` stamps it onto the local snapshot on every read, so the member list, message
headers, hover cards, the user dock and `/astro` all show the real `@handle`.

### Verification

`User.handleVerifiedAt` is set by staff from the member drawer in `/admin/users`. The new `users.verify` capability
belongs to admins and super admins; moderators can read the state but not change it. The cyan check renders beside the
handle in the user dock, member list, message headers, profile card, mobile profile page and the ASTRO page, while an
unverified signed-in account sees an Unverified tag on its own profile.

`GET /api/v1/me` exposes the state read-only as `account.verified`. Every grant or removal writes
`user.handle_verified` / `user.handle_unverified` to the staff audit log with actor, target and IP.

Migration `20261029080000_handle_verification` adds the timestamp and its index.

### Staff access inside Bleek

The signed-in account's staff role travels into the chat with the rest of the identity. Staff see a cyan shield chip
(`MOD` / `ADM` / `SUP`) in the user dock that links straight to `/admin`; their hover card and mobile profile show the
role beside the handle. Ordinary members see neither the chip nor the link, and `/admin` still re-checks the role on
every request.
