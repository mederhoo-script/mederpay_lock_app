import {
  Lock,
  RefreshCw,
  Users,
  BarChart2,
  Layers,
  FileText,
  Smartphone,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  TrendingUp,
  Star,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Lock,
    title: 'IMEI Device Control',
    description:
      'Lock financed phones instantly for overdue accounts and unlock them the moment a payment clears — no manual steps.',
    gold: true,
  },
  {
    icon: RefreshCw,
    title: 'Payment Reconciliation',
    description:
      'Incoming transfers from any gateway automatically match to the right buyer. No spreadsheets, no guesswork.',
    gold: false,
  },
  {
    icon: Users,
    title: 'Agent Network Ops',
    description:
      'Manage sub-agents, track performance, and calculate commissions — all in one secure, role-based dashboard.',
    gold: true,
  },
  {
    icon: BarChart2,
    title: 'Risk Visibility',
    description:
      'Monitor delinquency trends and overdue balances in real time before they become business losses.',
    gold: false,
  },
  {
    icon: Layers,
    title: 'Flexible Fee Tiers',
    description:
      'Set pricing bands and platform fees by phone value range. Changes apply automatically across all transactions.',
    gold: true,
  },
  {
    icon: FileText,
    title: 'Audit-Ready Logs',
    description:
      'Every payment, lock event, and admin action is permanently logged for trust, compliance, and dispute resolution.',
    gold: false,
  },
]

const steps = [
  {
    icon: Shield,
    step: '01',
    title: 'Create Your Agent Account',
    desc: 'Register in minutes. Our team reviews and approves you so you can access the full platform.',
  },
  {
    icon: Smartphone,
    step: '02',
    title: 'Add Phones & Buyers',
    desc: 'Import your inventory, register buyers, and connect your preferred payment gateway.',
  },
  {
    icon: Zap,
    step: '03',
    title: 'Automate Collections',
    desc: 'Payments reconcile automatically. Lock rules trigger on overdue accounts — zero manual chasing.',
  },
]

const testimonials = [
  {
    name: 'Adebayo Okafor',
    role: 'Senior Agent, Lagos',
    initials: 'AO',
    quote:
      'MederBuy cut my overdue accounts by 60% in the first month. The automatic lock feature is an absolute game-changer.',
    gold: true,
  },
  {
    name: 'Ngozi Eze',
    role: 'Phone Finance Agent, Enugu',
    initials: 'NE',
    quote:
      'I spent 3 hours a day chasing payments manually. Now I get notified when money hits and devices lock automatically.',
    gold: false,
  },
  {
    name: 'Emeka Nwosu',
    role: 'Sub-Agent Manager, Abuja',
    initials: 'EN',
    quote:
      'Managing 12 sub-agents and 800+ buyers used to be chaotic. Now I have full visibility and my team performs better.',
    gold: true,
  },
  {
    name: 'Fatima Bello',
    role: 'Phones & Accessories Dealer, Kano',
    initials: 'FB',
    quote:
      'Bank transfers match to buyers automatically. I can see exactly who owes what in real time.',
    gold: false,
  },
  {
    name: 'Chukwudi Ibe',
    role: 'Agent, Port Harcourt',
    initials: 'CI',
    quote:
      'After one week the results spoke for themselves. Collections are up, disputes are down.',
    gold: true,
  },
  {
    name: 'Blessing Akinlabi',
    role: 'Fleet Agent, Ibadan',
    initials: 'BA',
    quote:
      'Setup took under 30 minutes. Monnify integration worked first try and the platform has been reliable every day since.',
    gold: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060B18] text-white font-sans antialiased">

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060B18]/90 backdrop-blur-xl border-b border-white/[0.07]">
        <nav className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-700 to-[#2563EB] flex items-center justify-center shadow-[0_2px_12px_rgba(37,99,235,0.5)] shrink-0">
              <Smartphone size={17} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-white">Meder</span>
              <span className="text-amber-400">Buy</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-gradient-to-r from-[#D97706] to-[#F59E0B] px-5 py-2.5 rounded-xl shadow-[0_2px_14px_rgba(217,119,6,0.4)] hover:opacity-90 transition-opacity"
            >
              Get Started <ArrowRight size={14} />
            </a>
          </div>
        </nav>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-[148px] pb-24 bg-gradient-to-b from-[#0A1628] to-[#060B18] border-b border-white/[0.06] overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold tracking-[0.16em] uppercase text-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              BNPL Phone Financing OS
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up mx-auto mb-6 max-w-3xl text-4xl sm:text-5xl lg:text-[68px] font-black leading-[1.06] tracking-[-1.5px] text-white">
            Finance Phones.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]">
              Lock Overdue.
            </span>
            {' '}Collect Reliably.
          </h1>

          {/* Subtext */}
          <p className="animate-fade-in-up mx-auto mb-10 max-w-xl text-base sm:text-lg leading-relaxed text-white/60">
            MederBuy gives phone agents complete control — sell on finance, auto-lock on overdue,
            reconcile payments, manage agents and sub-agents from one dashboard.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-4 mb-14">
            <a
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D] text-black font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(217,119,6,0.45)] hover:shadow-[0_4px_28px_rgba(217,119,6,0.6)] hover:scale-[1.02] transition-all"
            >
              Start Free — Create Agent Account <ArrowRight size={16} />
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white/80 border border-white/20 px-7 py-3.5 rounded-xl hover:bg-white/[0.06] hover:border-white/30 transition-all"
            >
              Sign In
            </a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3">
            {[
              { emoji: '⚡', label: '500+ Agents' },
              { emoji: '📈', label: '₦2.1B Managed' },
              { emoji: '🛡️', label: 'Bank-Grade Security' },
            ].map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm font-semibold text-white/75"
              >
                <span>{b.emoji}</span>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#060B18]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-xs font-bold tracking-widest uppercase text-blue-400 mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
              Everything Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
                Finance Business
              </span>{' '}
              Needs
            </h2>
            <p className="max-w-lg mx-auto text-base text-white/50">
              One platform to sell, collect, lock, and scale — no duct-tape integrations.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group relative bg-[#0D1432] rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${f.gold ? 'bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D]' : 'bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6]'}`} />

                  {/* Icon */}
                  <div className={`mb-4 w-11 h-11 rounded-xl flex items-center justify-center ${f.gold ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-600/10 text-blue-400'}`}>
                    <Icon size={20} />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{f.description}</p>

                  {/* Subtle glow on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none ${f.gold ? 'shadow-[inset_0_0_40px_rgba(245,158,11,0.04)]' : 'shadow-[inset_0_0_40px_rgba(37,99,235,0.04)]'}`} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-[#060B18] to-[#080E1E] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold tracking-widest uppercase text-amber-400 mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
              Up and Running in{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]">
                30 Minutes
              </span>
            </h2>
            <p className="max-w-lg mx-auto text-base text-white/50">
              No IT team. No months of setup. Just a fast, guided onboarding.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className="relative bg-[#0D1432] rounded-2xl p-7 border border-white/[0.07] hover:border-amber-500/20 transition-all duration-300 text-center group"
                >
                  {/* Step number */}
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-amber-500/70 bg-[#060B18] px-2">
                    {s.step}
                  </span>

                  {/* Icon ring */}
                  <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#060B18]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-xs font-bold tracking-widest uppercase text-blue-400 mb-4">
              Agent Stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
              Trusted by{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
                Agents Nationwide
              </span>
            </h2>
            <p className="max-w-lg mx-auto text-base text-white/50">
              Real results from phone finance teams across Nigeria.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group bg-[#0D1432] rounded-2xl border border-white/[0.07] hover:border-white/[0.14] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Gold accent bar */}
                <div className={`h-1 ${t.gold ? 'bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D]' : 'bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6]'}`} />

                <div className="p-6">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm leading-relaxed text-white/70 mb-5">&ldquo;{t.quote}&rdquo;</p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${t.gold ? 'bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-black' : 'bg-gradient-to-br from-blue-700 to-blue-500 text-white'}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                      <p className="text-xs text-white/45 mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0D1432] to-[#060B18] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="relative inline-block mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold tracking-widest uppercase text-amber-400">
              Get Started Today
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-5">
            Stop Chasing Payments.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]">
              Start Automating.
            </span>
          </h2>
          <p className="max-w-md mx-auto text-base text-white/55 mb-10">
            Join 500+ agents already using MederBuy to protect their inventory and collect reliably.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D] text-black font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(217,119,6,0.45)] hover:shadow-[0_4px_28px_rgba(217,119,6,0.6)] hover:scale-[1.02] transition-all"
            >
              Create Your Free Account <ArrowRight size={16} />
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white/80 border border-white/20 px-8 py-4 rounded-xl hover:bg-white/[0.06] hover:border-white/30 transition-all"
            >
              Sign In
            </a>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap justify-center gap-5 mt-10">
            {[
              { icon: CheckCircle, text: 'No credit card required' },
              { icon: Shield, text: 'Bank-grade security' },
              { icon: TrendingUp, text: 'Live in 30 minutes' },
            ].map((c) => {
              const Icon = c.icon
              return (
                <div key={c.text} className="flex items-center gap-2 text-sm text-white/50">
                  <Icon size={14} className="text-amber-400" />
                  {c.text}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#060B18] border-t border-white/[0.06] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-blue-700 to-[#2563EB] flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.4)]">
                <Smartphone size={15} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">
                <span className="text-white">Meder</span>
                <span className="text-amber-400">Buy</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/45">
              <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white/80 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white/80 transition-colors">Contact</a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} MederBuy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
