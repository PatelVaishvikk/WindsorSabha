# Sabha Management · HSAPSS Canada

Community member directory, weekly sabhas, reusable dish templates, and grocery inventory. Built with the Next.js App Router, TypeScript, Tailwind CSS, and MongoDB/Mongoose.

The application reads and writes MongoDB exclusively. No demo mode or automatic sample seeding exists. Seven real accounts were explicitly provisioned at the owner’s request: Vaishvik Patel (main administrator), Akash Patel, Rushil Patel, Harit Trivedi, Dhwanit Tamboli, Saral Mistry, and Anant Patel. No sample inventory or sabhas are inserted. Test fixtures exist only under `tests/fixtures`.

## Accounts and visibility

Sign in with a full name (case-insensitive; extra spaces are ignored) or its dotted username, e.g. `vaishvik.patel`. Passwords are salted with scrypt and stored in the separate MongoDB Account collection. They are never sent to the browser. The account password supplied by the owner is applied by an explicit provisioning operation; environment variables are not a live password fallback.

- Vaishvik Patel is the protected main administrator, with full read/write access and a **Member access** page at `/access`.
- Every other named account starts with **stock-only, read-only access**. Members land on `/inventory`; the overview, member directory, sabhas, recipes, transaction notes, and editing controls are hidden by default.
- The administrator can grant member-directory visibility and/or sabha visibility separately for each account. Sabha visibility includes recipes and attendee/cook names but does not reveal private member profiles unless the directory is also enabled.
- Permissions are checked by page loaders and API routes. Unauthorized data is excluded before React serialization. Grants, revocations, and disabled status are loaded from MongoDB on each request, even for existing sessions.
- Only the main admin can change visibility or disable member accounts. This endpoint cannot change roles or disable the protected admin.
- Members sharing the same password can sign in as one another if they know the other name. Per-account grants distinguish accounts, not people who share credentials. Use unique passwords before relying on grants to isolate members from one another.

Real member profiles were created with the supplied names; unknown study, employment, and immigration details are marked **Not provided**. The joined date records when they were added to this workspace. No contact information or dates of birth were invented.

## Configure the workspace

Requires Node.js 20.9+ and a MongoDB Atlas cluster or replica set. Standalone MongoDB does not support the transactions needed for stock accounting.

```sh
npm ci
cp .env.example .env.local
```

Set these values in `.env.local` for local development, or your hosting provider's secret manager for production:

| Variable              | Purpose                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `MONGODB_URI`         | MongoDB connection string with access to the application database                     |
| `APP_URL`             | Public origin, without a path; HTTPS is required in production                        |
| `SESSION_SECRET`      | Random secret, at least 32 characters; generate with `openssl rand -base64 48`        |
| `ADMIN_PASSWORD`      | Unique administrator access password, at least 16 characters                          |
| `KARYAKARTA_PASSWORD` | Optional, distinct password of at least 16 characters; blank disables this role       |
| `VIEWER_PASSWORD`     | Optional, distinct password of at least 16 characters; blank disables this role       |
| `TRUST_PROXY_IP`      | Default `false`. Enable only behind a trusted proxy that overwrites `X-Forwarded-For` |

Do not commit `.env.local` or share credentials in source code. Missing or invalid configuration opens `/setup`; it does not expose records or create an administrator session. Production setup screens reveal no environment values or diagnostic details.

```sh
npm run db:indexes
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000 and sign in. All environments require authentication. `APP_URL` must match the origin you open, including the port.

For a fresh database, explicitly run `npm run accounts:provision` with the two provisioning passwords configured. It creates/updates the seven requested accounts and matching Windsor member profiles. This command resets these accounts’ passwords, resets member visibility to stock-only, and invalidates their old sessions; do not run it as a deployment startup hook. It does not touch grocery balances or sabhas. `npm run db:indexes` creates the Account username index as well.

Existing installations need only the database, application origin, session secret, and proxy setting for normal operation. The admin can add inventory and plan sabhas after signing in.

## Access and operational security

Only Vaishvik’s Admin account can edit records. Members are always read-only, including after additional sections are made visible. Every API handler enforces authorization. Sessions contain the account ID and version; role/permissions are fetched from MongoDB rather than trusted from a client token. Sessions expire after eight hours and use HTTP-only, SameSite=Strict cookies, with Secure cookies in production. Reprovisioning increments session versions; rotating SESSION_SECRET invalidates all sessions.

Login throttling is stored in MongoDB, so it works across application instances. By default it allows 60 attempts per 15-minute fixed window for the entire service and ignores spoofable IP headers. With a trusted proxy enabled, the limit is 10 attempts per IP per window. TTL indexes remove expired counters. The shared fallback can temporarily block all sign-ins during heavy failed-login traffic; configure trusted proxy handling or an edge rate limiter for a public service.

Mutations validate the browser's Origin against `APP_URL` and accept bounded JSON bodies. API responses are marked private/no-store. The app sets frame restrictions, content-type protections, referrer policy, restrictive device permissions, and production HSTS. It does not log submitted passwords or MongoDB connection strings.

## Data integrity

Collections: Account, Mandal, Member, Sabha, InventoryItem, StockTransaction, Dish, plus infrastructure-only login rate counters.

- Sabha saves, ingredient deductions, and stock ledger entries commit in one MongoDB transaction. Insufficient stock rolls back all writes; conflicting concurrent stock updates retry safely.
- Repeated ingredient rows are combined. Units must match the inventory item.
- Editing actual ingredient usage reverses previous deductions with adjustment entries and applies the new amounts. Deleting a sabha restores stock. Attendance-only edits do not change the ledger.
- Future sabhas permit a menu and cooks; attendance and consumption are recorded on the day or afterward, using Toronto calendar dates.
- Recipe quantities are suggestions scaled by servings. Editing the menu does not silently overwrite actual ingredient quantities.
- Opening stock creates a transaction. Restocks are positive; usage is negative; adjustments are signed. Stock history cannot be edited or deleted through the API.
- Direct stock balance edits are prohibited. Units cannot change after transactions exist. Referenced members or members with sign-in accounts should be marked inactive instead of deleted; referenced inventory cannot be deleted.

## Pages and API

- `/dashboard`: upcoming sabha, member counts by mandal, attendance trend, low-stock alerts, latest five sabhas.
- `/members`, `/members/new`, `/members/[id]`: searchable/filterable directory, full profile CRUD, conditional study and employment fields.
- `/sabhas`, `/sabhas/new`, `/sabhas/[id]`: searchable/filterable history, attendance check-in, meal planning, ingredient usage, kitchen volunteers.
- `/dishes`: recipe template CRUD and search.
- `/inventory`, `/inventory/new`, `/inventory/[id]`, `/inventory/restock`: inventory, low-stock filters, purchases, adjustments, transaction history.
- `/access`: main-admin controls for per-member visibility and account status.
- `/login`, `/setup`: named-account sign-in and missing-configuration state.

`GET /api/{collection}` lists records; `GET /api/{collection}/{id}` reads one. `POST` creates; `PUT /api/{collection}/{id}` updates a full editable record; `DELETE` removes eligible records. Collections: `members`, `sabhas`, `inventory`, `transactions`, `dishes`, `mandals`. Transactions support read/create only.

List filters include `q`, `mandal`, `immigrationStatus`, `jobStatus`, `isActive`, `category`, `itemId`, and `type`. Authenticated callers must send a same-origin `Origin` header on writes. Invalid input, forbidden actions, conflicts, and oversize payloads receive appropriate error responses.

`GET /api/health` returns only `ready` or `unavailable`, with HTTP 200 or 503. It checks configuration, database connectivity, and transaction-capable topology without exposing credentials or member information.

## Production deployment

**Framework upgrade pending:** the original requirement pins Next.js 14.2.35. A current npm audit reports critical Next.js advisories and a high-severity transitive PostCSS advisory. Do not treat this version as ready for public deployment. Upgrade to a patched supported major release and rerun the audit and verification before launch. See the [Next.js security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) and [support policy](https://nextjs.org/support-policy).

After resolving the framework version and setting production secrets:

```sh
npm ci
npm run typecheck
npm test
npm run check:production
npm run db:indexes
npm audit --omit=dev
npm run build
npm start
```

`check:production` verifies production configuration and the MongoDB transaction topology. `db:indexes` creates declared indexes, including login-counter TTL expiry; it never seeds or deletes data. Use a migration/deployment database account with index permissions, then a least-privilege runtime account for the application collections. Index creation can fail if existing records violate unique constraints; resolve those conflicts before launch.

Use an HTTPS Node.js host, configure health checks against `/api/health`, and enable MongoDB backups with a tested restore process. `npm run build` and `npm start` use the standard Next.js Node.js server. This is a server application, not a static export.

The current small-community repository reads the workspace dataset before applying targeted transactional writes; it is not intended for very large organizations without indexed server-side pagination and more targeted repository queries. No live deployment or production database is provisioned by this repository.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Tests cover named authentication, salted password verification, live permission checks, server-rendered data redaction, protected admin accounts, configuration, request origins/body limits, stock accounting, and MongoDB rollback/concurrency. Integration tests create an isolated temporary replica set and never use the application's configured database. The first run downloads a MongoDB binary and needs network access. Unit-only checks: `npm test -- tests/stock.test.ts tests/auth.test.ts tests/config.test.ts tests/access-boundaries.test.ts`.
