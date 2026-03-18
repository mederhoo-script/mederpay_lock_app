export default function LandingPage() {
  const features = [
    {
      title: 'IMEI Device Control',
      description: 'Track every financed phone and trigger automatic lock workflows for overdue accounts.',
    },
    {
      title: 'Payment Reconciliation',
      description: 'Match incoming transfers from virtual accounts and gateways without manual spreadsheet work.',
    },
    {
      title: 'Agent Network Ops',
      description: 'Manage sub-agents, sales performance, and commissions from one secure dashboard.',
    },
    {
      title: 'Risk Visibility',
      description: 'Monitor delinquency trends and overdue balances before they become business losses.',
    },
    {
      title: 'Flexible Fee Tiers',
      description: 'Apply pricing bands and platform fees automatically based on phone value ranges.',
    },
    {
      title: 'Audit-Ready Logs',
      description: 'Keep complete payment, unlock, and action histories for trust and compliance.',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06121A] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#0EA5E9]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#F97316]/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#22C55E]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(to_bottom,_rgba(6,18,26,0.8),_#06121A)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#06121A]/70 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-xl font-black tracking-wide sm:text-2xl">MederBuy</div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/10">
              Sign In
            </a>
            <a href="/register" className="rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] px-5 py-2 text-sm font-semibold text-[#032336] transition hover:brightness-110">
              Get Started
            </a>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-16 sm:px-6 md:pt-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-[#22D3EE]/40 bg-[#0EA5E9]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#67E8F9]">
            Built for Phone Finance Teams
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Sell More Phones.
            <span className="block text-[#67E8F9]">Collect Payments Without Chaos.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            MederBuy gives Nigerian agents one command center for device control, buyer repayments, and sub-agent operations. Cut defaults, protect inventory, and scale with confidence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="/register" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] px-7 py-3 text-sm font-bold text-[#2B1102] transition hover:-translate-y-0.5 hover:brightness-110">
              Start Free Trial
            </a>
            <a href="#features" className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white/90 transition hover:border-white/50 hover:bg-white/10">
              Explore Features
            </a>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-lg font-extrabold text-[#67E8F9]">24/7</p>
              <p className="mt-1 text-xs text-white/65">Device Monitoring</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-lg font-extrabold text-[#86EFAC]">Fast</p>
              <p className="mt-1 text-xs text-white/65">Payment Matching</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-lg font-extrabold text-[#FDBA74]">Multi</p>
              <p className="mt-1 text-xs text-white/65">Gateway Support</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl border border-[#67E8F9]/20 bg-[#67E8F9]/10 blur-md" />
          <div className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.25)] sm:p-6">
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#041019]/80 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/55">Today&apos;s Collections</p>
                <p className="mt-1 text-2xl font-black text-[#86EFAC]">₦3,450,000</p>
              </div>
              <span className="rounded-full bg-[#22C55E]/20 px-3 py-1 text-xs font-semibold text-[#86EFAC]">+18.2%</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Overdue Devices</p>
                <p className="mt-1 text-2xl font-black text-[#FCA5A5]">27</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Active Buyers</p>
                <p className="mt-1 text-2xl font-black text-[#67E8F9]">1,284</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Sub-Agents Reporting</p>
                <p className="mt-1 text-2xl font-black text-[#FDBA74]">96</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-black/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Platform Capabilities</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Everything You Need to Run BNPL Operations</h2>
            </div>
            <a href="/register" className="inline-flex w-fit items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/85 transition hover:border-white/50 hover:bg-white/10">
              Try It Live
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-6 transition hover:-translate-y-1 hover:border-[#22D3EE]/60 hover:shadow-[0_14px_40px_rgba(34,211,238,0.16)]"
              >
                <h3 className="text-lg font-bold text-white group-hover:text-[#67E8F9]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{feature.description}</p>
              </article>
            ))}
          </h2>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to turn repayments into predictable cash flow?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Launch your account in minutes and manage collections, lock rules, and growth dashboards from one platform.
          </p>
          <a href="/register" className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#22D3EE] to-[#86EFAC] px-8 py-3 text-base font-extrabold text-[#04272B] transition hover:-translate-y-0.5 hover:brightness-110">
            Create Agent Account
          </a>
        </div>
      </section>

      <footer className="mt-auto border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-white/60">&copy; 2026 MederBuy. Built for high-performance phone finance teams.</p>
        </div>
      </footer>
    </main>
  )
}
