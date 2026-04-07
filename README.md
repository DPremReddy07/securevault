# 🔐 SecureVault

> **AES-256 encrypted file & password vault** built with Next.js 16, Supabase, and hCaptcha.  
> Files and passwords are encrypted **in the browser** before ever touching the server.

---

## What is SecureVault?

SecureVault is a privacy-first web application where users can:

- 🔑 **Store passwords** — encrypt them client-side with a master key only they know
- 📁 **Upload files** — AES-256 encrypt files in the browser before uploading to Supabase
- 📋 **Track everything** — a live audit log records every upload, download, and delete
- 👑 **Admin oversight** — admin accounts can view all users' file metadata and moderate content

The server (Supabase) **never sees plaintext data** — only ciphertext. Even a database breach exposes nothing readable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database + Auth | Supabase (PostgreSQL + Row Level Security) |
| Encryption | `crypto-js` — AES-256 CBC, client-side |
| CAPTCHA | hCaptcha (bot protection on auth forms) |
| UI | Vanilla CSS design system (dark vault theme) |
| Icons | `lucide-react` |
| Notifications | `react-hot-toast` |
| Font | Inter (Google Fonts) |

---

## Project Structure

```
securevault/
│
├── app/                        # Next.js App Router pages
│   ├── layout.js               # Root layout — Inter font, Toaster, metadata
│   ├── globals.css             # Design system — CSS variables, utility classes, animations
│   ├── page.js                 # / — Login page (hCaptcha + Supabase Auth)
│   ├── register/
│   │   └── page.js             # /register — Sign up page (hCaptcha + password strength)
│   └── dashboard/
│       └── page.js             # /dashboard — Main vault UI (files, audit log, admin view)
│
├── lib/
│   ├── supabase.js             # Supabase client (singleton, auth options)
│   └── useRole.js              # Custom hook — fetches user + role from profiles table
│
├── .env.local                  # Secret keys (never commit this)
├── package.json
└── README.md
```

---

## Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER VISITS /                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    Login Page (/)       │
              │  Email + Password       │
              │  + hCaptcha widget      │
              └────────────┬────────────┘
                           │ Sign In (captchaToken → Supabase)
                           │
              ┌────────────▼────────────┐
              │   Supabase Auth         │
              │   verifies credentials  │
              │   + hCaptcha token      │
              └────────────┬────────────┘
                           │ session created
                           │
              ┌────────────▼────────────┐
              │  useRole() hook runs    │
              │  → auth.getUser()       │
              │  → profiles.select(role)│
              └────────────┬────────────┘
                    ┌──────┴──────┐
                    │             │
           role=viewer      role=admin
                    │             │
        ┌───────────▼─┐     ┌─────▼───────────┐
        │  My Files   │     │  My Files        │
        │  My Audit   │     │  All Users' Files│
        │  Log        │     │  All Audit Logs  │
        └─────────────┘     └─────────────────┘
```

### Upload Flow

```
User selects file
      │
      ▼
FileReader.readAsDataURL()  ← file → base64 data URL in memory
      │
      ▼
CryptoJS.AES.encrypt(data, SECRET_KEY)  ← AES-256 encryption, in browser
      │
      ▼
supabase.from('files').insert({ encrypted_data, name, size, user_id })
      │
      ▼
logAction(user_id, 'UPLOAD', filename)  ← audit_logs insert
      │
      ▼
Realtime channel fires → audit log panel refreshes live
```

### Download Flow

```
User clicks "Decrypt & Download"
      │
      ▼
CryptoJS.AES.decrypt(encrypted_data, SECRET_KEY)  ← in browser
      │
      ▼
decrypted.toString(CryptoJS.enc.Utf8)  ← back to data URL
      │
      ▼
<a href="..." download="filename"> .click()  ← triggers browser download
      │
      ▼
logAction(user_id, 'DOWNLOAD', filename)
```

---

## Supabase Database Schema

```sql
-- User role management
create table profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  role  text not null default 'viewer'   -- 'viewer' | 'admin'
);

-- Encrypted files
create table files (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade,
  name           text not null,
  size           bigint not null,
  encrypted_data text not null,          -- AES-256 ciphertext
  created_at     timestamptz default now()
);

-- Immutable audit trail
create table audit_logs (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  action     text not null,              -- 'UPLOAD' | 'DOWNLOAD' | 'DELETE'
  detail     text,                       -- filename
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

| Table | Policy | Rule |
|---|---|---|
| `profiles` | Users read own | `auth.uid() = id` |
| `files` | Viewer sees own | `auth.uid() = user_id` |
| `files` | Admin sees all | `profiles.role = 'admin'` |
| `files` | Users insert own | `auth.uid() = user_id` |
| `files` | Admin deletes any | `profiles.role = 'admin'` |
| `audit_logs` | Users see own | `auth.uid() = user_id` |
| `audit_logs` | Admin sees all | `profiles.role = 'admin'` |
| `audit_logs` | Users insert | `auth.uid() = user_id` |

---

## Environment Variables

```bash
# .env.local — never commit this file

# Supabase Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# hCaptcha → Settings → Site Key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# → fill in your Supabase and hCaptcha keys

# 3. Run Supabase SQL (see schema above)
# → Supabase Dashboard → SQL Editor

# 4. Enable hCaptcha in Supabase
# → Auth → Sign In / Sign Up → Bot and Abuse Protection → hCaptcha
# → paste your hCaptcha secret key

# 5. Enable Realtime for audit_logs
# → Supabase → Database → Replication → audit_logs ✓

# 6. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Roles & Permissions

| Action | Viewer | Admin |
|---|---|---|
| Register / Login | ✅ | ✅ |
| Upload file | ✅ | ✅ |
| Download own file | ✅ | ✅ |
| Delete own file | ✅ | ✅ |
| View own audit log | ✅ | ✅ |
| View **all** users' files | ❌ | ✅ |
| Delete **any** user's file | ❌ | ✅ |
| View **all** audit logs | ❌ | ✅ |

### Promoting a user to admin

```sql
UPDATE profiles SET role = 'admin'
WHERE id = 'paste-user-uuid-here';
```

Find the UUID in **Supabase → Authentication → Users**.

---

## Security Notes

| Property | Detail |
|---|---|
| Encryption | AES-256 CBC via `crypto-js` |
| Where encrypted | In the browser — server never sees plaintext |
| Encryption key | Demo: hardcoded `SECRET_KEY` · Production: per-user derived key |
| Auth protection | hCaptcha token required on every login/register |
| Token passed to | `supabase.auth.signInWithPassword({ options: { captchaToken } })` |
| Database access | Row Level Security enforced on all tables |
| Session | JWT stored in browser, auto-refreshed by Supabase client |

> ⚠️ **Demo note:** The `SECRET_KEY` in `dashboard/page.js` is hardcoded for demonstration. In production, derive a key from the user's master password using PBKDF2 so even admins cannot decrypt other users' files.

---

## Roadmap

### ✅ Done
- [x] Dark-themed vault UI with design system
- [x] Supabase Auth + hCaptcha on login & register
- [x] Password strength meter on register
- [x] `useRole` hook — viewer / admin RBAC
- [x] AES-256 client-side file encryption
- [x] File upload, download, delete
- [x] Live audit log (Supabase Realtime)
- [x] Admin panel — view all users' files

### 🔲 Next Steps
- [ ] Per-user encryption keys (PBKDF2 key derivation from master password)
- [ ] Password vault entries (store login credentials, not just files)
- [ ] File size limit + MIME type validation
- [ ] Email confirmation flow
- [ ] Forgot password / reset password page
- [ ] Admin user management panel (promote/demote roles)
- [ ] Pagination for large file lists
- [ ] Two-factor authentication (TOTP)
- [ ] Deploy to Vercel + production hCaptcha domain whitelist

---

## Pages Reference

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.js` | Login with email, password, hCaptcha |
| `/register` | `app/register/page.js` | Sign up with password strength + hCaptcha |
| `/dashboard` | `app/dashboard/page.js` | Vault UI — files, upload, audit log |

---

*Built with Next.js 16 · Supabase · hCaptcha · crypto-js*
