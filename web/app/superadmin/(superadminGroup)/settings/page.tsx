import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings | MederBuy Admin' }

export default async function SuperadminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const monnifyBase = process.env.MONNIFY_BASE_URL ?? 'https://api.monnify.com'
  const monnifyConfigured =
    !!(process.env.MONNIFY_API_KEY && process.env.MONNIFY_SECRET_KEY && process.env.MONNIFY_CONTRACT_CODE)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-white/50 mt-1">
          Global platform configuration
        </p>
      </div>

      {/* Owner Monnify config */}
      <section className="gold-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Owner Monnify (Platform Fee Collection)</h2>
        <p className="text-sm text-white/50">
          These credentials are used to generate virtual accounts for agents to pay their weekly platform fees.
          They are read from environment variables and cannot be edited in the UI.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">API Key</p>
            <p className="text-sm text-white/60 font-mono">
              {monnifyConfigured ? '••••••••••••••••' : 'Not configured'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Secret Key</p>
            <p className="text-sm text-white/60 font-mono">
              {monnifyConfigured ? '••••••••••••••••' : 'Not configured'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Contract Code</p>
            <p className="text-sm text-white/60 font-mono">
              {monnifyConfigured ? '••••••••••••••••' : 'Not configured'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Base URL</p>
            <p className="text-sm text-white/70 font-mono">{monnifyBase}</p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            monnifyConfigured
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${monnifyConfigured ? 'bg-green-400' : 'bg-red-400'}`}
          />
          {monnifyConfigured ? 'Configured' : 'Missing environment variables'}
        </div>
      </section>

      {/* Platform info */}
      <section className="gold-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Platform Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Platform Name</p>
            <p className="text-white">MederBuy</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">App URL</p>
            <p className="text-white/70">{process.env.NEXT_PUBLIC_APP_URL ?? 'Not set'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Superadmin Email</p>
            <p className="text-white/70">{process.env.SUPERADMIN_EMAIL ?? 'Not set'}</p>
          </div>
        </div>
      </section>

      {/* Webhook URLs */}
      <section className="gold-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Webhook Endpoints</h2>
        <p className="text-sm text-white/50">
          Register these URLs in your payment gateway dashboards to receive payment notifications.
        </p>
        {[
          { gateway: 'Monnify', path: '/api/webhooks/monnify' },
          { gateway: 'Paystack', path: '/api/webhooks/paystack' },
          { gateway: 'Flutterwave', path: '/api/webhooks/flutterwave' },
        ].map((item) => {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-domain.com'
          return (
            <div key={item.gateway} className="rounded-lg border border-white/10 p-3 flex items-center justify-between gap-4">
              <span className="text-sm text-white/60 w-28">{item.gateway}</span>
              <code className="flex-1 text-xs text-white/50 font-mono bg-black/30 px-3 py-1.5 rounded">
                {appUrl}{item.path}
              </code>
            </div>
          )
        })}
      </section>
    </div>
  )
}
