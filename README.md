# MederBuy Lock — Monorepo

Phone-installment financing platform.  
An agent sells a phone on credit; the Android app enforces repayment by locking the device until the loan is fully repaid.

## Workspaces

```
mederpay_lock_app/
├── app/              # Android Gradle project root
│   ├── android/      # :android module (Kotlin · Jetpack Compose · Hilt · Room · Retrofit)
│   ├── gradle/       # Gradle wrapper
│   ├── gradlew / gradlew.bat
│   ├── settings.gradle.kts
│   └── gradle.properties.example
├── web/              # Web platform – Next.js 16 (frontend dashboard + REST API + Supabase)
├── supabase/         # Database schema and migrations
└── README.md
```

### `app/android/`

The Android application installed on the buyer's device.  
It polls the MederBuy web API to determine whether to show or release the lock screen.

| Tool | Version |
|------|---------|
| Kotlin | 1.9.22 |
| AGP | 8.2.2 |
| Jetpack Compose BOM | 2024.02 |
| Min SDK | 26 (Android 8) |
| Target SDK | 34 |

**Build locally:**

```bash
# Copy template and fill in values
cp app/gradle.properties.example app/gradle.properties

# Debug APK  (run from the app/ directory)
cd app
./gradlew :android:assembleDebug

# Release APK (requires signing config in gradle.properties)
./gradlew :android:assembleRelease
```

**Build via CI (recommended for production):**

Push to `main` or go to **Actions → Build Release APK → Run workflow** in GitHub.  
See the [GitHub Secrets](#required-github-secrets-for-ci) table below for required values.

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
The database schema is in `supabase/schema.sql`.

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

### Android (`app/gradle.properties`)

The Android build injects secrets into `BuildConfig` at compile time.  
`ANDROID_DEVICE_API_SECRET` must be the **same value** as in `web/.env.local`.

```bash
cp app/gradle.properties.example app/gradle.properties
# Open app/gradle.properties and fill in all values
```

`app/gradle.properties` is git-ignored — never commit the real file.

---

## Required GitHub Secrets for CI

Add these in **Settings → Secrets and variables → Actions → New repository secret**  
before triggering the [Build Release APK](.github/workflows/build-release-apk.yml) workflow.

| Secret | Required | Description |
|--------|----------|-------------|
| `ANDROID_DEVICE_API_SECRET` | ✅ | Shared secret — must match `ANDROID_DEVICE_API_SECRET` in `web/.env.local` |
| `ANDROID_API_BASE_URL` | ✅ | REST API base URL, e.g. `https://mederbuy.vercel.app/api/` (trailing slash required) |
| `ANDROID_KEYSTORE_BASE64` | ✅ | Base64-encoded `.jks` / `.keystore` file: `base64 -w 0 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | ✅ | Password used when the keystore was created |
| `ANDROID_KEY_ALIAS` | ✅ | Key alias inside the keystore (e.g. `mederbuylock`) |
| `ANDROID_KEY_PASSWORD` | ✅ | Password for the key entry |

> **One-time keystore generation** (run once, keep the file safe):
> ```bash
> keytool -genkeypair -v -keystore release.keystore \
>   -alias mederbuylock -keyalg RSA -keysize 2048 -validity 9125 \
>   -storepass YOUR_STRONG_PASSWORD -keypass YOUR_STRONG_PASSWORD \
>   -dname "CN=MederBuyLock, O=MederBuy, C=KG"
>
> # Encode for the GitHub Secret:
> base64 -w 0 release.keystore
> ```
>
> ⚠️ **Keep the keystore and its passwords safe.** If you lose them you cannot
> update the app on devices where it is already installed.

The signed APK is uploaded as a **workflow artifact** and available for download
from the Actions run page for 30 days.

## Contributing

1. Work inside the relevant workspace (`app/android/` or `web/`).
2. Keep Android Gradle files inside `app/` — this is the Gradle project root.
3. Keep web environment variables in `web/.env.local`; never commit secrets.
