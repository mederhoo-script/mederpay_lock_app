# MederBuy Lock — Monorepo

Phone-installment financing platform.  
An agent sells a phone on credit; the Android app enforces repayment by locking the device until the loan is fully repaid.

## Workspaces

```
mederpay_lock_app/
├── android/   # Android lock-screen app (Kotlin · Jetpack Compose · Hilt · Room · Retrofit)
├── web/       # Web platform – Next.js 16 (frontend dashboard + REST API + Supabase)
├── gradle/    # Gradle wrapper shared by the Android build
└── README.md
```

### `android/`

The Android application installed on the buyer's device.  
It polls the MederBuy web API to determine whether to show or release the lock screen.

| Tool | Version |
|------|---------|
| Kotlin | 1.9.22 |
| AGP | 8.2.2 |
| Jetpack Compose BOM | 2024.02 |
| Min SDK | 26 (Android 8) |
| Target SDK | 34 |

**Build:**

```bash
# Debug APK
./gradlew :android:assembleDebug

# Release APK (requires signing config)
./gradlew :android:assembleRelease
```

### `web/`

The Next.js 16 web platform.  
Provides the agent/sub-agent/superadmin dashboards and the REST API consumed by the Android app and payment-gateway webhooks.

| Tool | Purpose |
|------|---------|
| Next.js 16 | Full-stack React framework (App Router) |
| Supabase | Postgres database + Auth + Row-Level Security |
| Tailwind CSS | Styling |
| Monnify / Paystack / Flutterwave | Payment gateway integrations |
| Vercel | Deployment + CRON jobs |

**Install & run:**

```bash
cd web
npm install
npm run dev        # http://localhost:3000

npm run build      # production build
npm run start      # serve production build
```

Environment variables live in `web/.env.local` (not committed).  
The database schema is in `web/supabase/migrations/`.

## Environment Setup

All secrets and configuration are kept out of version control.  
Template files with realistic example values are provided for every workspace.

### Web (`web/.env.local`)

```bash
cp web/.env.example web/.env.local
# then open web/.env.local and replace the placeholder values
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL — `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service-role JWT key — **server-only, never expose** |
| `MONNIFY_API_KEY` | ✅ | Monnify merchant API key (format: `MK_TEST_…` / `MK_PROD_…`) |
| `MONNIFY_SECRET_KEY` | ✅ | Monnify secret key for auth & webhook signature verification |
| `MONNIFY_CONTRACT_CODE` | ✅ | Monnify contract code for virtual account creation |
| `MONNIFY_BASE_URL` | ❌ | Monnify base URL — use `https://sandbox.monnify.com` for testing, `https://api.monnify.com` for production (defaults to production URL if omitted) |
| `NEXT_PUBLIC_APP_URL` | ❌ | Full public URL of this deployment, e.g. `https://mederbuy.vercel.app` |
| `SUPERADMIN_EMAIL` | ❌ | Email shown on the superadmin settings page |
| `CRON_SECRET` | ✅ | Bearer token for Vercel Cron jobs — generate with `openssl rand -hex 32` |
| `ANDROID_DEVICE_API_SECRET` | ✅ | Shared secret with the Android app — generate with `openssl rand -hex 32` |

> **Tip:** Get your Supabase keys from  
> `https://supabase.com/dashboard/project/<ref>/settings/api`

### Android (`gradle.properties`)

The Android build injects `ANDROID_DEVICE_API_SECRET` into `BuildConfig` at compile time.  
It must be the **same value** as in `web/.env.local`.

```bash
cp gradle.properties.example gradle.properties
# then set ANDROID_DEVICE_API_SECRET to the same value as in web/.env.local
```

`gradle.properties` is git-ignored — never commit the real file.

## Contributing

1. Work inside the relevant workspace (`android/` or `web/`).
2. Keep Android Gradle files at the repo root — this is the standard Gradle multi-project layout.
3. Keep web environment variables in `web/.env.local`; never commit secrets.
