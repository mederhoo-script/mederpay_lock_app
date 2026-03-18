import {
  Lock,
  RefreshCw,
  Users,
  BarChart2,
  Layers,
  FileText,
  CheckCircle,
  TrendingUp,
  Smartphone,
  ArrowRight,
} from 'lucide-react'

const WEEKLY_CHART_HEIGHTS = [35, 55, 42, 70, 58, 80, 65, 90]

export default function LandingPage() {
  const features = [
    {
      icon: Lock,
      title: 'IMEI Device Control',
      description: 'Track every financed phone and trigger automatic lock workflows for overdue accounts.',
      color: 'text-[#67E8F9]',
      bg: 'bg-[#0EA5E9]/10',
    },
    {
      icon: RefreshCw,
      title: 'Payment Reconciliation',
      description: 'Match incoming transfers from virtual accounts and gateways without manual spreadsheet work.',
      color: 'text-[#86EFAC]',
      bg: 'bg-[#22C55E]/10',
    },
    {
      icon: Users,
      title: 'Agent Network Ops',
      description: 'Manage sub-agents, sales performance, and commissions from one secure dashboard.',
      color: 'text-[#FDBA74]',
      bg: 'bg-[#F97316]/10',
    },
    {
      icon: BarChart2,
      title: 'Risk Visibility',
      description: 'Monitor delinquency trends and overdue balances before they become business losses.',
      color: 'text-[#F9A8D4]',
      bg: 'bg-[#EC4899]/10',
    },
    {
      icon: Layers,
      title: 'Flexible Fee Tiers',
      description: 'Apply pricing bands and platform fees automatically based on phone value ranges.',
      color: 'text-[#A5B4FC]',
      bg: 'bg-[#6366F1]/10',
    },
    {
      icon: FileText,
      title: 'Audit-Ready Logs',
      description: 'Keep complete payment, unlock, and action histories for trust and compliance.',
      color: 'text-[#FDE68A]',
      bg: 'bg-[#F59E0B]/10',
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Create Your Agent Account',
      desc: 'Register in minutes and get approved by our team to access the full platform.',
    },
    {
      step: '02',
      title: 'Add Phones & Buyers',
      desc: 'Import your inventory, register buyers, and configure your payment gateway.',
    },
    {
      step: '03',
      title: 'Automate Collections',
      desc: 'Payments match automatically. Lock rules trigger on overdue accounts — no manual chasing.',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06121A] text-white">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#0EA5E9]/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#F97316]/12 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#22C55E]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#06121A]/75 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#22D3EE]">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">MederBuy</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/login"
              className="rounded-lg border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/8 hover:text-white"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] px-4 py-2 text-sm font-semibold text-[#032336] transition hover:brightness-110"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="animate-fade-in-up">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/35 bg-[#0EA5E9]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#67E8F9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#67E8F9]" />
            Built for Phone Finance Teams
          </span>
          <h1 className="max-w-xl text-4xl font-black leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Sell More Phones.
            <span className="mt-1 block bg-gradient-to-r from-[#67E8F9] to-[#86EFAC] bg-clip-text text-transparent">
              Collect Without Chaos.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            MederBuy gives Nigerian agents one command center for device control, buyer repayments, and sub-agent operations. Cut defaults, protect inventory, and scale with confidence.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:bg-white/8"
            >
              Explore Features
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: '24/7 Monitoring', color: 'text-[#67E8F9]', bg: 'bg-[#0EA5E9]/8 border-[#0EA5E9]/20' },
              { label: 'Fast Payments', color: 'text-[#86EFAC]', bg: 'bg-[#22C55E]/8 border-[#22C55E]/20' },
              { label: 'Multi-Gateway', color: 'text-[#FDBA74]', bg: 'bg-[#F97316]/8 border-[#F97316]/20' },
            ].map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${b.bg} ${b.color}`}>
                <CheckCircle className="h-3 w-3" />
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative animate-fade-in-up delay-150">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#0EA5E9]/20 to-[#22C55E]/10 blur-2xl" />
          <div className="relative rounded-2xl border border-white/12 bg-gradient-to-br from-[#0D1F2D] to-[#061219] p-5 shadow-[0_32px_80px_rgba(14,165,233,0.2)] sm:p-6">
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-white/8 bg-[#041019]/90 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Today&apos;s Collections
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#86EFAC]">₦3,450,000</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-2.5 py-1">
                <TrendingUp className="h-3 w-3 text-[#86EFAC]" />
                <span className="text-xs font-bold text-[#86EFAC]">+18.2%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Overdue Devices', value: '27', color: 'text-[#FCA5A5]' },
                { label: 'Active Buyers', value: '1,284', color: 'text-[#67E8F9]' },
                { label: 'Sub-Agents', value: '96', color: 'text-[#FDBA74]' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
                  <p className={`text-xl font-black tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-[10px] text-white/40 leading-tight">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-white/60">Weekly Revenue</p>
                <span className="text-[10px] text-white/35">Last 8 weeks</span>
              </div>
              <div className="flex h-14 items-end gap-1">
                {WEEKLY_CHART_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#0EA5E9]/40 to-[#22D3EE]/70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="border-y border-white/8 bg-gradient-to-r from-black/30 via-[#0D1F2D]/50 to-black/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '₦2B+', label: 'Payments Processed' },
              { value: '5,000+', label: 'Active Devices' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '4 Gateways', label: 'Supported' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Platform Capabilities</p>
              <h2 className="mt-2 max-w-xl text-3xl font-black text-white sm:text-4xl">
                Everything You Need to Run BNPL Operations
              </h2>
            </div>
            <a
              href="/register"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/35 hover:bg-white/8 hover:text-white"
            >
              Try It Live <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.06] to-transparent p-6 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
                >
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/8 bg-black/20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Getting Started</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Up and Running in 3 Steps</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-6 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-white/15 to-transparent sm:block" />
                )}
                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[#0EA5E9]/20 to-transparent text-sm font-black text-[#67E8F9]">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0D1F2D]/80 to-[#06121A]/80 p-10 backdrop-blur-sm sm:p-14">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Ready to turn repayments into predictable cash flow?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
              Launch your account in minutes and manage collections, lock rules, and growth dashboards from one platform.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#86EFAC] px-8 py-3.5 text-base font-extrabold text-[#04272B] shadow-[0_4px_24px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Create Agent Account <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-3.5 text-base font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/8"
              >
                Already have an account?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/8 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#22D3EE]">
                <Smartphone className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white/80">MederBuy</span>
            </div>
            <p className="text-sm text-white/40">&copy; 2026 MederBuy. Built for high-performance phone finance teams.</p>
            <div className="flex gap-4 text-sm text-white/40">
              <a href="/login" className="transition hover:text-white/70">Sign In</a>
              <a href="/register" className="transition hover:text-white/70">Register</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
