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
  Shield,
  Zap,
  Star,
} from 'lucide-react'

const WEEKLY_CHART_HEIGHTS = [35, 55, 42, 70, 58, 80, 65, 90]

export default function LandingPage() {
  const features = [
    {
      icon: Lock,
      title: 'IMEI Device Control',
      description: 'Track every financed phone and trigger automatic lock workflows for overdue accounts.',
      accent: '#F59E0B',
      border: 'border-[#F59E0B]/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    },
    {
      icon: RefreshCw,
      title: 'Payment Reconciliation',
      description: 'Match incoming transfers from virtual accounts and gateways without manual spreadsheet work.',
      accent: '#3B82F6',
      border: 'border-[#3B82F6]/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
    },
    {
      icon: Users,
      title: 'Agent Network Ops',
      description: 'Manage sub-agents, sales performance, and commissions from one secure dashboard.',
      accent: '#F59E0B',
      border: 'border-[#F59E0B]/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    },
    {
      icon: BarChart2,
      title: 'Risk Visibility',
      description: 'Monitor delinquency trends and overdue balances before they become business losses.',
      accent: '#3B82F6',
      border: 'border-[#3B82F6]/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
    },
    {
      icon: Layers,
      title: 'Flexible Fee Tiers',
      description: 'Apply pricing bands and platform fees automatically based on phone value ranges.',
      accent: '#F59E0B',
      border: 'border-[#F59E0B]/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    },
    {
      icon: FileText,
      title: 'Audit-Ready Logs',
      description: 'Keep complete payment, unlock, and action histories for trust and compliance.',
      accent: '#3B82F6',
      border: 'border-[#3B82F6]/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Create Your Agent Account',
      desc: 'Register in minutes and get approved by our team to access the full platform.',
      icon: Shield,
    },
    {
      step: '02',
      title: 'Add Phones & Buyers',
      desc: 'Import your inventory, register buyers, and configure your payment gateway.',
      icon: Smartphone,
    },
    {
      step: '03',
      title: 'Automate Collections',
      desc: 'Payments match automatically. Lock rules trigger on overdue accounts — no manual chasing.',
      icon: Zap,
    },
  ]

  const testimonials = [
    {
      name: 'Adebayo Okafor',
      role: 'Senior Agent, Lagos',
      initials: 'AO',
      quote: 'MederBuy cut my overdue accounts by 60% in the first month. The automatic lock feature is an absolute game-changer for my business.',
    },
    {
      name: 'Ngozi Eze',
      role: 'Phone Finance Agent, Enugu',
      initials: 'NE',
      quote: 'Before MederBuy I spent 3 hours a day chasing payments manually. Now I get notified when money hits and devices lock automatically.',
    },
    {
      name: 'Emeka Nwosu',
      role: 'Sub-Agent Network Manager, Abuja',
      initials: 'EN',
      quote: "Managing 12 sub-agents and 800+ buyers used to be chaotic. With MederBuy's dashboard I have full visibility and my team performs better.",
    },
    {
      name: 'Fatima Bello',
      role: 'Phones & Accessories Dealer, Kano',
      initials: 'FB',
      quote: 'The payment reconciliation is seamless. Bank transfers match to buyers automatically, and I can see exactly who owes what in real time.',
    },
    {
      name: 'Chukwudi Ibe',
      role: 'Agent, Port Harcourt',
      initials: 'CI',
      quote: 'I was skeptical at first but after one week the results spoke for themselves. Collections are up, disputes are down.',
    },
    {
      name: 'Blessing Akinlabi',
      role: 'Fleet Agent, Ibadan',
      initials: 'BA',
      quote: 'Setup took under 30 minutes. The Monnify integration worked first try and the platform has been reliable every single day since we launched.',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060B18] text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-60 left-1/4 h-[36rem] w-[36rem] rounded-full bg-[#2563EB]/15 blur-[120px]" />
        <div className="absolute -top-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-[#D97706]/10 blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 h-80 w-80 rounded-full bg-[#1D4ED8]/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#B45309]/8 blur-3xl" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#060B18]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] shadow-[0_2px_12px_rgba(37,99,235,0.5)]">
              <Smartphone className="h-4 w-4 text-white" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#F59E0B] text-[6px] font-black text-black">★</span>
            </div>
            <span className="text-lg font-black tracking-tight">
              <span className="text-white">Meder</span>
              <span className="text-[#F59E0B]">Buy</span>
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white sm:block"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] px-5 py-2.5 text-sm font-bold text-black shadow-[0_2px_16px_rgba(217,119,6,0.4)] transition hover:brightness-110 hover:-translate-y-px"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-20 sm:px-6 md:pt-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">

        {/* Left: Text content */}
        <div className="animate-fade-in-up order-2 lg:order-1">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#F59E0B]/30 bg-[#D97706]/8 px-4 py-1.5">
            <span className="flex h-2 w-2 rounded-full bg-[#F59E0B]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FCD34D]">Built for Phone Finance Teams</span>
          </div>

          <h1 className="max-w-xl text-4xl font-black leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Sell More Phones.
            <span className="mt-1.5 block bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#F59E0B] bg-clip-text text-transparent">
              Collect Without Chaos.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
            MederBuy gives Nigerian agents one command center for device control, buyer repayments,
            and sub-agent operations. Cut defaults, protect inventory, and scale with confidence.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(37,99,235,0.45)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F59E0B]/25 bg-[#D97706]/8 px-7 py-3.5 text-sm font-semibold text-[#FCD34D] transition hover:border-[#F59E0B]/50 hover:bg-[#D97706]/15"
            >
              Explore Features
            </a>
          </div>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { label: '24/7 Monitoring', color: 'text-[#93C5FD]', bg: 'bg-[#1D4ED8]/10 border-[#2563EB]/25' },
              { label: 'Fast Payments', color: 'text-[#FCD34D]', bg: 'bg-[#D97706]/10 border-[#F59E0B]/25' },
              { label: 'Multi-Gateway', color: 'text-[#93C5FD]', bg: 'bg-[#1D4ED8]/10 border-[#2563EB]/25' },
            ].map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${b.bg} ${b.color}`}>
                <CheckCircle className="h-3 w-3" />
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Dashboard mockup */}
        <div className="animate-fade-in-up order-1 delay-150 lg:order-2">
          {/* Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#2563EB]/15 via-transparent to-[#D97706]/10 blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1432] to-[#060B18] p-5 shadow-[0_32px_80px_rgba(37,99,235,0.18)] sm:p-6">
            {/* Header bar */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-white/8 bg-[#030917]/90 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Today&apos;s Collections</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#FCD34D]">₦3,450,000</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#D97706]/15 px-3 py-1 border border-[#F59E0B]/20">
                <TrendingUp className="h-3 w-3 text-[#FCD34D]" />
                <span className="text-xs font-bold text-[#FCD34D]">+18.2%</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Overdue Devices', value: '27', color: 'text-red-400' },
                { label: 'Active Buyers', value: '1,284', color: 'text-[#93C5FD]' },
                { label: 'Sub-Agents', value: '96', color: 'text-[#FCD34D]' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
                  <p className={`text-xl font-black tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-[10px] leading-tight text-white/40">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-white/60">Weekly Revenue</p>
                <span className="text-[10px] text-white/30">Last 8 weeks</span>
              </div>
              <div className="flex h-14 items-end gap-1">
                {WEEKLY_CHART_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${h}%`,
                      background: i >= 6
                        ? 'linear-gradient(to top, #D97706, #F59E0B)'
                        : 'linear-gradient(to top, #1D4ED8, #3B82F6)',
                      opacity: i >= 6 ? 1 : 0.6 + i * 0.05,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Gold accent bar */}
            <div className="mt-4 h-0.5 w-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#F59E0B] to-[#2563EB] opacity-40" />
          </div>
        </div>
      </section>

      {/* ── Platform Stats ─────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-gradient-to-r from-[#060B18] via-[#0D1432]/70 to-[#060B18] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '₦2B+', label: 'Payments Processed', gold: true },
              { value: '5,000+', label: 'Active Devices', gold: false },
              { value: '99.9%', label: 'Uptime SLA', gold: true },
              { value: '4 Gateways', label: 'Supported', gold: false },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-3xl font-black sm:text-4xl ${stat.gold ? 'text-[#F59E0B]' : 'text-[#93C5FD]'}`}>
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full border border-[#F59E0B]/25 bg-[#D97706]/8 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FCD34D]">
              Platform Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Everything You Need to Run{' '}
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#93C5FD] bg-clip-text text-transparent">
                BNPL Operations
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55">
              One platform built specifically for Nigerian phone finance agents — from device lock to payment reconciliation.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0D1432]/80 to-[#060B18]/50 p-6 transition duration-300 hover:-translate-y-1.5 ${feature.border} ${feature.glow} hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]`}
                >
                  {/* Icon */}
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      background: `${feature.accent}12`,
                      borderColor: `${feature.accent}25`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: feature.accent }} />
                  </div>
                  <h3 className="text-base font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full transition-all duration-500 group-hover:w-full"
                    style={{ background: `linear-gradient(to right, ${feature.accent}, transparent)` }}
                  />
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full border border-[#2563EB]/25 bg-[#1D4ED8]/8 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#93C5FD]">
              Getting Started
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Up and Running in{' '}
              <span className="bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">3 Steps</span>
            </h2>
          </div>

          <div className="relative grid gap-12 sm:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-1/2 top-12 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />

            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className="relative z-10 mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-br from-[#D97706]/15 to-[#2563EB]/10 shadow-[0_0_30px_rgba(217,119,6,0.1)]">
                      <Icon className="h-6 w-6 text-[#FCD34D]" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-[10px] font-black text-black">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full border border-[#F59E0B]/25 bg-[#D97706]/8 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FCD34D]">
              What Agents Say
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Trusted by Top Agents
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/55">
              Real feedback from agents running active phone financing operations across Nigeria.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, idx) => (
              <article
                key={t.name}
                className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0D1432]/70 to-[#060B18]/40 p-6 transition duration-200 hover:border-white/15 hover:bg-[#0D1432]/60"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="flex-1 text-sm italic leading-relaxed text-white/70">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-white/[0.07] pt-4">
                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{
                      background: idx % 2 === 0
                        ? 'linear-gradient(135deg, #1D4ED8, #3B82F6)'
                        : 'linear-gradient(135deg, #D97706, #F59E0B)',
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/45">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#F59E0B]/20 bg-gradient-to-br from-[#0D1A40] via-[#0D1432] to-[#1A0D05] p-10 sm:p-16">
            {/* Glow effects */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#2563EB]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-[#D97706]/12 blur-3xl" />
            {/* Gold divider top */}
            <div className="absolute left-1/2 top-0 h-0.5 w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />

            <div className="relative text-center">
              <span className="mb-4 inline-block rounded-full border border-[#F59E0B]/30 bg-[#D97706]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FCD34D]">
                Start Today
              </span>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                Ready to turn repayments into{' '}
                <span className="bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">
                  predictable cash flow?
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
                Launch your account in minutes and manage collections, lock rules, and growth dashboards from one platform.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/register"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] px-8 py-4 text-base font-extrabold text-black shadow-[0_6px_28px_rgba(217,119,6,0.45)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Create Agent Account <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#3B82F6]/30 bg-[#1D4ED8]/10 px-8 py-4 text-base font-semibold text-[#93C5FD] transition hover:border-[#3B82F6]/60 hover:bg-[#1D4ED8]/20"
                >
                  Already have an account?
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#030917]/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]">
                <Smartphone className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold">
                <span className="text-white/80">Meder</span>
                <span className="text-[#F59E0B]">Buy</span>
              </span>
            </div>
            <p className="text-sm text-white/35">&copy; 2026 MederBuy. Built for high-performance phone finance teams.</p>
            <div className="flex gap-5 text-sm text-white/40">
              <a href="/login" className="transition hover:text-[#93C5FD]">Sign In</a>
              <a href="/register" className="transition hover:text-[#FCD34D]">Register</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
