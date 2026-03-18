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

## Contributing

1. Work inside the relevant workspace (`android/` or `web/`).
2. Keep Android Gradle files at the repo root — this is the standard Gradle multi-project layout.
3. Keep web environment variables in `web/.env.local`; never commit secrets.
