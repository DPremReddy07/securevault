# SecureVault — Comprehensive Project Analysis

---

## 1. Project Overview

### What it does
SecureVault is a **privacy-first web application** that lets users:
- Upload files that are **AES-256 encrypted in the browser** before touching any server
- Store and retrieve those files from a cloud database (Supabase)
- Monitor all activity through a live audit log
- Detect **login anomalies** (new country, impossible travel) using IP geolocation

### Core purpose / problem it solves
Demonstrates that **encrypted-at-rest ≠ encrypted-in-transit ≠ end-to-end encrypted**.
SecureVault stores only ciphertext in the database — even a full database breach reveals nothing readable to an attacker.

### Target users
- Security-conscious individuals who want a private file/credential vault
- Developers learning encryption-at-source patterns
- Teams needing a role-controlled encrypted document store

### Application type
**Security SaaS dashboard** — encrypted file vault + identity threat monitoring + admin oversight panel.

---

## 2. Current Architecture

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.2 |
| Styling | Vanilla CSS + CSS Variables | Custom design system |
| Font | Inter (Google Fonts) | via `next/font` |
| Database + Auth | Supabase (PostgreSQL + RLS) | Latest |
| Encryption | `crypto-js` AES-256 CBC | Latest |
| Bot protection | `@hcaptcha/react-hcaptcha` | Latest |
| Notifications | `react-hot-toast` | Latest |
| Icons | `lucide-react` | Latest |
| Geo/IP | `ipapi.co` REST API | Free tier |
| Realtime | Supabase Realtime (WebSocket) | Built-in |

### Folder Structure

```
securevault/
├── app/
│   ├── layout.js            # Root layout: Inter font, Toaster, SEO metadata
│   ├── globals.css          # Design system: CSS vars, vault-card, vault-input, animations
│   ├── page.js              # / — Login: hCaptcha, Supabase auth, geo + anomaly detection
│   ├── register/
│   │   └── page.js          # /register — Sign up: password strength, hCaptcha
│   └── dashboard/
│       └── page.js          # /dashboard — Files tab, Audit tab, Threats tab
├── lib/
│   ├── supabase.js          # Singleton Supabase client with auth config
│   └── useRole.js           # Custom hook: auth.getUser() + profiles.role lookup
├── .env.local               # SUPABASE_URL, SUPABASE_ANON_KEY, HCAPTCHA_SITE_KEY
├── package.json
└── README.md
```

### Key Services & Modules

| Module | File | Responsibility |
|---|---|---|
| Supabase client | `lib/supabase.js` | Single shared client, session persistence, auto token refresh |
| Role resolver | `lib/useRole.js` | Fetches authed user + joins `profiles` for role |
| Login + threat detection | `app/page.js` | Auth, geo fetch, anomaly logic, login_logs insert |
| Registration | `app/register/page.js` | Sign up + hCaptcha + password validation |
| Core vault | `app/dashboard/page.js` | File CRUD, AES encrypt/decrypt, realtime subscriptions |
| Design system | `app/globals.css` | CSS variables, `.vault-card`, `.vault-input`, `.vault-btn-primary`, animations |

### Data Flow

```
User Action
    │
    ▼
React Component (Client)
    │
    ├── supabase.auth.*          ←→   Supabase Auth (JWT)
    ├── supabase.from("files")   ←→   Supabase PostgreSQL (RLS-guarded)
    ├── supabase.from("audit_logs")
    ├── supabase.from("login_logs")
    ├── ipapi.co/json/           ←→   External IP geolocation API
    └── Realtime channels        ←→   Supabase WebSocket (live INSERT feeds)
```

### External Integrations

| Service | Purpose | Cost | Rate limit |
|---|---|---|---|
| Supabase | Auth + DB + Realtime | Free tier | 500 MB DB, 2 GB bandwidth |
| hCaptcha | Bot protection on auth forms | Free | Unlimited |
| ipapi.co | IP geolocation on login | Free | **1,000 req/day** |

---

## 3. Features Implemented (So Far)

### Authentication / User Management

**Login (`app/page.js`)**
- `supabase.auth.signInWithPassword()` with `captchaToken` option
- hCaptcha dark-theme widget; submit button disabled until verified
- CAPTCHA auto-resets on failed login
- `Forgot password?` link (points to `/forgot-password` — not yet built)

**Registration (`app/register/page.js`)**
- `supabase.auth.signUp()` with `captchaToken`
- Client-side password strength meter (4 checks: length, uppercase, number, symbol)
- Real-time confirm-password validation (green/red border + message)
- Handles both email-confirm flow and instant-session flow

### Core Business Logic

**File Upload (`dashboard/page.js`)**
- `FileReader.readAsDataURL()` converts file to base64 data URL in memory
- `CryptoJS.AES.encrypt(dataUrl, SECRET_KEY)` encrypts before any network call
- Encrypted string stored in `files.encrypted_data`
- Audit log entry inserted after every upload

**File Download**
- `CryptoJS.AES.decrypt(encrypted_data, SECRET_KEY)` → UTF-8 string
- Reconstructs original data URL → triggers `<a download>` click
- Audit log entry inserted after every download

**File Delete**
- `supabase.from("files").delete().eq("id", id)`
- Audit log entry inserted after every delete
- Immediate optimistic UI update (filters from local state)

### Security / Threat Detection

**IP Geolocation + Anomaly Detection (`app/page.js`)**
- After successful login, calls `https://ipapi.co/json/` for IP, city, country, lat/lng
- Queries last 10 logins from `login_logs` for that user
- **New country detection:** compares `country_code` to last login
- **Impossible travel detection:** Haversine distance > 500 km within 1 hour
- Inserts login row with `threat_flag = 'new_country' | 'impossible_travel' | null`
- Shows red/orange toast immediately on the login page if flagged

### Logging / Monitoring

**Audit Log (`audit_logs` table)**
- Every UPLOAD, DOWNLOAD, DELETE writes a row
- Dashboard Audit tab shows last 50 entries with colour-coded action badges
- Green pulsing "Live" dot shows Realtime is connected

**Login Log (`login_logs` table)**
- Every login (regardless of threat) writes: IP, city, region, country, lat/lng, threat_flag
- Dashboard Threats tab shows only rows where `threat_flag IS NOT NULL`

### Realtime Features

**`realtime:audit_logs` channel**
- `postgres_changes` INSERT subscription on `audit_logs`
- New rows prepended to audit list instantly (sliced to 50)
- Filtered by `user.id` for viewers; all rows for admin

**`realtime:login_logs` channel**
- INSERT subscription; only processes rows with non-null `threat_flag`
- Prepends to threats list + fires a live toast on the dashboard

### Role-Based Access / Admin Features

**`useRole` hook**
- `supabase.auth.getUser()` → user
- `profiles.select('role').eq('id', user.id)` → role (`viewer` | `admin`)
- Defaults to `'viewer'` if no profile row

**Dashboard role gating**
- Files query: viewer → `.eq("user_id", user.id)`, admin → no filter (all files)
- Audit query: same pattern
- Threats query: same pattern
- Nav shows **ADMIN** pill badge for admin users

### UI Features

- Dark vault theme via CSS custom properties (`--bg-base`, `--accent`, `--accent-2`, etc.)
- `pulse-glow` keyframe animation on logo and live dots
- `animate-fadeInUp` card entrance animation
- `animate-spin` loading spinners
- `react-hot-toast` notifications styled to match dark theme
- Inter font via `next/font/google`
- Three-tab interface: My Files / Audit Log / Threat Alerts (with count badge)
- Responsive layout using flexbox + grid

---

## 4. Database Design

### Tables

```sql
profiles          -- user role registry
  id              uuid PK → auth.users.id
  role            text  DEFAULT 'viewer'  ('viewer' | 'admin')

files             -- encrypted file storage
  id              uuid PK
  user_id         uuid → auth.users.id ON DELETE CASCADE
  name            text  (original filename, plaintext)
  size            bigint (original file size in bytes)
  encrypted_data  text  (AES-256 ciphertext of base64 data URL)
  created_at      timestamptz DEFAULT now()

audit_logs        -- immutable action trail
  id              uuid PK
  user_id         uuid → auth.users.id ON DELETE CASCADE
  action          text  ('UPLOAD' | 'DOWNLOAD' | 'DELETE')
  detail          text  (filename)
  created_at      timestamptz DEFAULT now()

login_logs        -- login history + geo + threats
  id              uuid PK
  user_id         uuid → auth.users.id ON DELETE CASCADE
  ip              text
  city            text
  region          text
  country         text
  country_code    text  (ISO 3166-1 alpha-2)
  latitude        float
  longitude       float
  threat_flag     text  (null | 'new_country' | 'impossible_travel')
  created_at      timestamptz DEFAULT now()
```

### Relationships

```
auth.users (Supabase managed)
    │
    ├─── profiles      (1:1)  — role per user
    ├─── files         (1:N)  — many files per user
    ├─── audit_logs    (1:N)  — many log entries per user
    └─── login_logs    (1:N)  — many login records per user
```

### Important RLS Policies (required, not auto-applied)

| Table | Policy type | Rule |
|---|---|---|
| `profiles` | SELECT | `auth.uid() = id` |
| `files` | SELECT (viewer) | `auth.uid() = user_id` |
| `files` | SELECT (admin) | role = 'admin' via profiles join |
| `files` | INSERT | `auth.uid() = user_id` |
| `files` | DELETE (own) | `auth.uid() = user_id` |
| `files` | DELETE (admin) | role = 'admin' via profiles join |
| `audit_logs` | INSERT | `auth.uid() = user_id` |
| `audit_logs` | SELECT | own OR admin |
| `login_logs` | INSERT | `auth.uid() = user_id` |
| `login_logs` | SELECT | own OR admin |

### Realtime subscriptions
Both `audit_logs` and `login_logs` need **Replication enabled** in:
`Supabase → Database → Replication → toggle tables ON`

---

## 5. What is Already Completed

### ✅ Stable & Complete
- Login page with hCaptcha + Supabase auth
- Registration page with strength meter + hCaptcha
- AES-256 file encrypt → upload → Supabase
- AES-256 decrypt → download trigger
- Delete with confirmation + optimistic UI
- `useRole` hook (user + role resolution)
- Role-based file/log filtering (viewer vs admin)
- Audit log (write + read + real-time)
- Login anomaly detection (new country + impossible travel)
- Login log (write + read)
- Realtime channel for `audit_logs`
- Realtime channel for `login_logs` (threat live toast)
- Dark theme design system
- Admin ADMIN badge in nav
- Threat Alerts tab with count badge
- SEO metadata in layout
- Responsive layout

### ⚠️ Partially Implemented
- **Forgot password** — link exists at `/forgot-password` but page does not exist
- **Profile auto-creation trigger** — not in code; must be manually set up in Supabase SQL
- **RLS policies** — need to be manually created in Supabase; not enforced by current code
- **Realtime replication** — needs to be enabled in Supabase dashboard manually

### 🧪 Demo / Experimental
- **SECRET_KEY** is hardcoded (`"DEMO_SECRET_KEY_CHANGE_ME"`) — not per-user
- **ipapi.co** rate limit is 1,000/day — fine for demo, will break in production

---

## 6. Gaps / Missing Features

### Security Gaps

| Gap | Severity | Impact |
|---|---|---|
| Shared `SECRET_KEY` for all users | 🔴 Critical | Any user can decrypt any other user's files by running `CryptoJS.AES.decrypt` with the hardcoded key |
| No key derivation (PBKDF2/Argon2) | 🔴 Critical | Encryption key is not derived from user's master password |
| No email confirmation enforcement | 🟡 Medium | Supabase may create session immediately without verified email |
| Forgot password page missing | 🟡 Medium | Users who forget password cannot recover |
| No session timeout | 🟡 Medium | JWT auto-refreshes indefinitely |
| No rate limiting on file upload | 🟡 Medium | Single user can upload unlimited files |
| `confirm()` for delete | 🟢 Low | Browser `confirm()` is ugly; replace with a modal |

### UX Gaps

- No file type/size validation (could upload 100 MB, break ipapi quota on same login)
- No empty state illustration beyond text
- No loading skeletons — just spinner
- No drag-and-drop upload zone on dashboard
- No file preview (images, text)
- No search/filter across files
- No pagination — will slow on 50+ files
- No "Dismiss" on threat alerts
- No profile/settings page

### Performance Concerns

- `encrypted_data` stored as a TEXT column — large files (>1 MB) become very large base64 strings, 33% larger than binary
- No file size limit enforced in code
- `fetchFiles()` refetched on every upload/delete (no incremental update for files)
- `ipapi.co` call happens synchronously in the login flow — adds ~300–500 ms to every login

### Scalability Limitations

- Supabase free tier: 500 MB DB, 2 GB bandwidth — 10 × 5 MB files = 50 MB/user encrypted storage
- `ipapi.co` 1,000 req/day — at 50 daily active users, you'll hit the limit
- No CDN for file delivery — all traffic through Supabase
- Single hardcoded `SECRET_KEY` makes key rotation impossible

---

## 7. How the System Works (End-to-End)

### Registration Flow
```
/register → fill form → hCaptcha → supabase.auth.signUp({ captchaToken })
         → Supabase verifies captcha server-side
         → Creates auth.users row
         → [trigger needed] Creates profiles row with role='viewer'
         → Session created (if email confirm OFF) OR email sent
         → Redirect to /dashboard or /
```

### Login + Threat Detection Flow
```
/ → fill email+password → hCaptcha → supabase.auth.signInWithPassword({ captchaToken })
  → JWT session established
  → getGeoInfo() → ipapi.co/json/ → { ip, city, country_code, lat, lng }
  → supabase.from('login_logs').select().eq('user_id').limit(10) → prevLogins
  → Compare country_code to prevLogins[0].country_code → new_country?
  → Compare haversine(last_lat, last_lng, geo_lat, geo_lng) with time diff → impossible_travel?
  → supabase.from('login_logs').insert({ ...geo, threat_flag })
  → If flagged → show red toast
  → router.push('/dashboard')
```

### File Upload Flow
```
Dashboard → Click "Choose File" → file picker
         → FileReader.readAsDataURL(file) → base64 dataURL (in browser memory)
         → CryptoJS.AES.encrypt(dataUrl, SECRET_KEY) → ciphertext string
         → supabase.from('files').insert({ name, size, encrypted_data })
         → supabase.from('audit_logs').insert({ action:'UPLOAD', detail:filename })
         → fetchFiles() refreshes list
         → Realtime audit_logs channel fires on other connected tabs → log prepends live
```

### File Download Flow
```
Click "Decrypt" → CryptoJS.AES.decrypt(encrypted_data, SECRET_KEY)
               → bytes.toString(CryptoJS.enc.Utf8) → original dataURL
               → <a href=dataURL download=filename>.click() → browser downloads file
               → audit_logs.insert({ action:'DOWNLOAD' })
```

### Live Threat Alert Flow (Admin tab)
```
User A logs in from new country → login_logs.insert({ threat_flag:'new_country' })
                                → Supabase Realtime broadcasts INSERT event
                                → Admin's dashboard channel receives payload
                                → threats list prepends new row
                                → Red toast fires on admin's screen instantly
```

---

## 8. Recommended Next Features (Priority Order)

### 🟢 Quick Wins (1–2 days each)

**1. Forgot password page (`/forgot-password`)**
- Why: Link already exists; users will click it and get a 404
- How: `supabase.auth.resetPasswordForEmail(email)` → redirect to `/reset-password?token=...` → `supabase.auth.updateUser({ password })`

**2. File size limit + type validation**
- Why: Prevents DB bloat and abuse
- How: `if (file.size > 10 * 1024 * 1024) { toast.error('Max 10 MB'); return; }`

**3. Confirm delete modal (replace `window.confirm`)**
- Why: `window.confirm` is ugly, blocks thread, and unstyled
- How: A small React modal component with the existing vault design system

**4. Drag-and-drop upload zone**
- Why: Much better UX; the upload card already looks like it should support it
- How: `onDragOver`, `onDrop` on the upload card div

**5. Dismiss / acknowledge threat alerts**
- Why: Alerts accumulate with no way to clear them
- How: Add `dismissed: boolean` column, or just keep dismissed IDs in local state

### 🟡 Medium Complexity (3–7 days each)

**6. Per-user encryption key derivation (PBKDF2)**
- Why: The single shared key is the biggest security hole
- How: On login + vault unlock, use `CryptoJS.PBKDF2(masterPassword, userSalt, { keySize:8, iterations:100000 })` → derive AES key per user stored only in memory

**7. File search + filter**
- Why: 20+ files becomes unusable without search
- How: Client-side filter on `files.name.toLowerCase().includes(query)`

**8. File pagination / infinite scroll**
- Why: Performance degrades with 50+ large encrypted_data rows
- How: `.range(offset, offset+19)` with a "Load more" button

**9. Login history page**
- Why: Users should be able to see all their logins, not just threats
- How: `/dashboard` → new "Login History" tab reading `login_logs` without threat filter

**10. Admin user management panel**
- Why: Currently you can only promote users via raw SQL
- How: Admin-only tab; query `auth.users` via Supabase service role API + update `profiles.role`

### 🔴 Advanced Features (1–3 weeks each)

**11. Supabase Storage integration (replace base64 TEXT columns)**
- Why: Binary storage is 33% smaller, faster, and allows streaming
- How: Encrypt file → `supabase.storage.from('vault').upload(path, encryptedBlob)` → store only the storage path in `files` table

**12. Two-factor authentication (TOTP)**
- Why: Critical for any real security product
- How: Supabase supports TOTP natively — enable in Auth settings; wrap login flow to check `data.session.user.factors`

**13. Password vault entries (credentials store)**
- Why: The original project concept included storing passwords, not just files
- How: New `vault_entries` table (site, username, encrypted_password); master-key-locked reveal UI

**14. Activity analytics dashboard (charts)**
- Why: Gives admins meaningful insight
- How: Recharts or Chart.js; query `audit_logs` grouped by `action` and `date_trunc('day')`

**15. Email alerts on detected threats**
- Why: Users are only notified if they're on the dashboard when the threat fires
- How: Supabase Edge Function triggered on `login_logs` INSERT with non-null `threat_flag` → `resend.com` or `sendgrid` email to the user

---

## 9. Refactoring Suggestions

### Code Improvements

| Issue | Current | Fix |
|---|---|---|
| Hardcoded `SECRET_KEY` | `"DEMO_SECRET_KEY_CHANGE_ME"` | Derive from master password via PBKDF2 |
| `fmtDate` uses `toLocaleString()` | Causes SSR hydration mismatch | Use `new Intl.DateTimeFormat('en-GB', {...}).format(date)` with `suppressHydrationWarning` or format client-only |
| `window.confirm()` for delete | Blocks thread + ugly | Replace with modal component |
| `logAction` fire-and-forget | No error handling | `await logAction(...)` fails silently; wrap in try/catch |
| No error boundaries | Unhandled render errors crash page | Add `error.js` in `app/` and `app/dashboard/` |
| `useRole` has no re-auth listener | Session changes not reflected | Add `supabase.auth.onAuthStateChange` inside the hook |

### Architecture Improvements

- **Extract a `useFiles` hook** — move fetchFiles, handleUpload, handleDownload, handleDelete out of the page component into `lib/useFiles.js`
- **Extract `useLogs` hook** — move audit + threat state and realtime subscriptions into `lib/useLogs.js`
- **Create a `Modal` component** — reusable confirm dialog used by delete, used by future prompts
- **Create an `app/api/` route** for server-side geo lookup — removes the 1,000/day client-side constraint and hides the IP from browser network tab

### Folder Restructuring (recommended)

```
app/
  (auth)/            # route group — no shared layout
    page.js          # /  login
    register/page.js # /register
    forgot-password/ # /forgot-password
  (vault)/           # route group — requires auth, shared dashboard layout
    dashboard/page.js
    settings/page.js
lib/
  supabase.js
  useRole.js
  useFiles.js        # NEW — file CRUD hook
  useLogs.js         # NEW — audit + threat hooks
  crypto.js          # NEW — encrypt/decrypt helpers + PBKDF2 key derivation
components/
  Modal.js           # NEW — reusable confirm modal
  FileRow.js         # NEW — single file row card
  LogEntry.js        # NEW — single audit log row
  ThreatCard.js      # NEW — single threat alert card
```

---

## 10. Developer Roadmap

### Phase 1 — Stabilization (Week 1–2)
**Goal:** Make the demo production-safe and fully functional

- [ ] Build `/forgot-password` + `/reset-password` pages
- [ ] Replace `window.confirm` with vault-styled modal
- [ ] Add `error.js` error boundaries to all routes
- [ ] Add file size + type validation (10 MB max, block executables)
- [ ] Fix hydration mismatch on date formatting
- [ ] Set up all Supabase RLS policies (from README SQL)
- [ ] Set up `profiles` auto-creation trigger
- [ ] Enable Realtime on `audit_logs` and `login_logs`
- [ ] Create `/api/geo` server route to proxy ipapi.co (removes 1,000/day browser limit)

### Phase 2 — Feature Expansion (Week 3–6)
**Goal:** Make it genuinely useful

- [ ] PBKDF2 key derivation — per-user encryption keys from master password
- [ ] Migrate file storage to Supabase Storage (binary instead of TEXT base64)
- [ ] Add drag-and-drop upload zone
- [ ] Add file search + filter
- [ ] Add "Login History" tab (all logins, not just threats)
- [ ] Admin user management panel (view users, promote/demote roles)
- [ ] Password vault entries (site + username + encrypted password cards)
- [ ] Dismiss/acknowledge threat alerts
- [ ] Add pagination to file list

### Phase 3 — Scaling & Optimization (Week 7–12)
**Goal:** Production-grade reliability and visibility

- [ ] Two-factor authentication (TOTP via Supabase)
- [ ] Email threat alerts (Supabase Edge Function → Resend)
- [ ] Activity analytics dashboard (Recharts charts by day/action)
- [ ] File sharing between users (shared ephemeral decryption links)
- [ ] Audit log export (CSV download)
- [ ] Session management page (view + revoke active sessions)
- [ ] Key rotation mechanism (re-encrypt all files with new key)
- [ ] Deploy to Vercel + configure hCaptcha domain whitelist
- [ ] Set up monitoring (Sentry error tracking + Supabase DB alerts)

---

## 11. Bonus

### Suggested Integrations

| Integration | Why | How |
|---|---|---|
| **Resend** (email) | Send threat alert emails | Supabase Edge Function → `resend.com` SDK → email on `threat_flag` INSERT |
| **Sentry** | Error tracking in production | `npm install @sentry/nextjs` → add `sentry.client.config.js` |
| **Posthog** | Product analytics (page views, feature usage) | `posthog-js` SDK → track upload/download events |
| **Upstash Redis** | Rate limiting per IP/user | Use with Supabase Edge Functions to rate-limit login attempts |
| **Cloudflare Turnstile** | Alternative to hCaptcha | Drop-in; free, privacy-friendly, better UX on mobile |
| **Vercel AI SDK + GPT-4o** | "Ask your vault" natural language query over file names/metadata | AI assistant tab that can answer "what did I upload last week?" |
| **Mapbox GL JS** | Visualise login locations on a live world map | Plot `login_logs.latitude/longitude` as markers; highlight flagged ones |

### Monetization Ideas

| Model | Description | Implementation effort |
|---|---|---|
| **Freemium storage** | Free: 100 MB encrypted storage. Pro $5/mo: 5 GB | Supabase Storage + Stripe |
| **Team vaults** | Share encrypted files within a team/org | Add `organizations` table + org-scoped RLS |
| **Audit log export** | CSV/PDF export of audit logs — paid feature | Simple `encodeURIComponent(JSON)` to CSV download |
| **Threat alert emails** | Receive email on anomalous logins — Pro feature | Edge Function + Resend; free users see toast only |
| **Custom domains** | Host your own branded vault | Vercel custom domain per org |
| **API access** | Upload/download encrypted files via REST API | Next.js API routes + Supabase service role key |
