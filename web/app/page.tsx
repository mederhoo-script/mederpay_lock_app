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
  Menu,
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Lock,
      title: 'IMEI Device Control',
      description: 'Lock financed phones instantly for overdue accounts and unlock them the moment a payment clears — no manual steps.',
      color: '#F59E0B',
    },
    {
      icon: RefreshCw,
      title: 'Payment Reconciliation',
      description: 'Incoming transfers from any gateway automatically match to the right buyer. No spreadsheets, no guesswork.',
      color: '#3B82F6',
    },
    {
      icon: Users,
      title: 'Agent Network Ops',
      description: 'Manage sub-agents, track performance, and calculate commissions — all in one secure, role-based dashboard.',
      color: '#F59E0B',
    },
    {
      icon: BarChart2,
      title: 'Risk Visibility',
      description: 'Monitor delinquency trends and overdue balances in real time before they become business losses.',
      color: '#3B82F6',
    },
    {
      icon: Layers,
      title: 'Flexible Fee Tiers',
      description: 'Set pricing bands and platform fees by phone value range. Changes apply automatically across all transactions.',
      color: '#F59E0B',
    },
    {
      icon: FileText,
      title: 'Audit-Ready Logs',
      description: 'Every payment, lock event, and admin action is permanently logged for trust, compliance, and dispute resolution.',
      color: '#3B82F6',
    },
  ]

  const steps = [
    {
      icon: Shield,
      title: 'Create Your Agent Account',
      desc: 'Register in minutes. Our team reviews and approves you so you can access the full platform.',
    },
    {
      icon: Smartphone,
      title: 'Add Phones & Buyers',
      desc: 'Import your inventory, register buyers, and connect your preferred payment gateway.',
    },
    {
      icon: Zap,
      title: 'Automate Collections',
      desc: 'Payments reconcile automatically. Lock rules trigger on overdue accounts — zero manual chasing.',
    },
  ]

  const testimonials = [
    {
      name: 'Adebayo Okafor',
      role: 'Senior Agent, Lagos',
      initials: 'AO',
      quote: 'MederBuy cut my overdue accounts by 60% in the first month. The automatic lock feature is an absolute game-changer.',
      gold: true,
    },
    {
      name: 'Ngozi Eze',
      role: 'Phone Finance Agent, Enugu',
      initials: 'NE',
      quote: 'I spent 3 hours a day chasing payments manually. Now I get notified when money hits and devices lock automatically.',
      gold: false,
    },
    {
      name: 'Emeka Nwosu',
      role: 'Sub-Agent Manager, Abuja',
      initials: 'EN',
      quote: 'Managing 12 sub-agents and 800+ buyers used to be chaotic. Now I have full visibility and my team performs better.',
      gold: true,
    },
    {
      name: 'Fatima Bello',
      role: 'Phones & Accessories Dealer, Kano',
      initials: 'FB',
      quote: 'Bank transfers match to buyers automatically. I can see exactly who owes what in real time.',
      gold: false,
    },
    {
      name: 'Chukwudi Ibe',
      role: 'Agent, Port Harcourt',
      initials: 'CI',
      quote: 'After one week the results spoke for themselves. Collections are up, disputes are down.',
      gold: true,
    },
    {
      name: 'Blessing Akinlabi',
      role: 'Fleet Agent, Ibadan',
      initials: 'BA',
      quote: 'Setup took under 30 minutes. Monnify integration worked first try and the platform has been reliable every day since.',
      gold: false,
    },
  ]

  return (
    <div style={{ background: '#060B18', color: '#fff', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ═══════════════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(6,11,24,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <nav style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#1D4ED8,#2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(37,99,235,0.5)',
              flexShrink: 0,
            }}>
              <Smartphone size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>
              <span style={{ color: '#fff' }}>Meder</span>
              <span style={{ color: '#F59E0B' }}>Buy</span>
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/login" style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              transition: 'color .15s',
            }}>
              Sign In
            </a>
            <a href="/register" style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#000',
              textDecoration: 'none',
              background: 'linear-gradient(135deg,#D97706,#F59E0B)',
              padding: '9px 20px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 14px rgba(217,119,6,0.4)',
            }}>
              Get Started <ArrowRight size={14} />
            </a>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #0A1628 0%, #060B18 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 80,
        paddingBottom: 80,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Badge */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 9999,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FCD34D',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              Built for Nigerian Phone Finance Teams
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            textAlign: 'center',
            fontSize: 'clamp(36px, 6vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            margin: '0 auto 24px',
            maxWidth: 820,
          }}>
            Sell Phones on Credit.{' '}
            <span style={{
              background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Collect Without Chaos.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            textAlign: 'center',
            fontSize: 18,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 600,
            margin: '0 auto 40px',
          }}>
            MederBuy gives agents one command centre for IMEI device lock, buyer repayments,
            and sub-agent operations. Cut defaults, protect inventory, and scale.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'center',
            marginBottom: 60,
          }}>
            <a href="/register" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg,#2563EB,#3B82F6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 32px',
              borderRadius: 12,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
            }}>
              Start Free Trial <ArrowRight size={16} />
            </a>
            <a href="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: '#FCD34D',
              fontWeight: 600,
              fontSize: 15,
              padding: '14px 32px',
              borderRadius: 12,
              textDecoration: 'none',
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              Sign In to Dashboard
            </a>
          </div>

          {/* Dashboard preview card */}
          <div style={{
            maxWidth: 840,
            margin: '0 auto',
            background: 'linear-gradient(145deg,#0D1A40,#0A0F20)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Dashboard header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(3,9,23,0.9)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 16,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                  Today&apos;s Collections
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FCD34D', fontVariantNumeric: 'tabular-nums' }}>
                  ₦3,450,000
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(217,119,6,0.15)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 9999,
                padding: '5px 12px',
              }}>
                <TrendingUp size={13} color="#FCD34D" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D' }}>+18.2%</span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Overdue Devices', value: '27', color: '#F87171' },
                { label: 'Active Buyers', value: '1,284', color: '#93C5FD' },
                { label: 'Sub-Agents', value: '96', color: '#FCD34D' },
              ].map((item) => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '14px 8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Weekly Revenue</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
                {[35, 55, 42, 70, 58, 80, 65, 90].map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '3px 3px 0 0',
                    background: i >= 6
                      ? 'linear-gradient(to top,#D97706,#F59E0B)'
                      : `linear-gradient(to top,#1D4ED8,#3B82F6)`,
                    opacity: i >= 6 ? 1 : 0.5 + i * 0.07,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#0A1225',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 40,
          textAlign: 'center',
        }}>
          {[
            { value: '₦2B+', label: 'Payments Processed', gold: true },
            { value: '5,000+', label: 'Active Devices Managed', gold: false },
            { value: '99.9%', label: 'Uptime SLA', gold: true },
            { value: '4', label: 'Payment Gateways', gold: false },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, color: stat.gold ? '#F59E0B' : '#93C5FD' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '96px 24px', background: '#060B18' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Section label */}
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 16px',
              borderRadius: 9999,
              background: 'rgba(245,158,11,0.09)',
              border: '1px solid rgba(245,158,11,0.25)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FCD34D',
            }}>
              Platform Capabilities
            </span>
          </div>

          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px,4vw,42px)',
            fontWeight: 900,
            lineHeight: 1.18,
            marginBottom: 16,
          }}>
            Everything You Need to Run{' '}
            <span style={{
              background: 'linear-gradient(135deg,#3B82F6,#93C5FD)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              BNPL Operations
            </span>
          </h2>

          <p style={{ textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto 56px' }}>
            One platform built specifically for Nigerian phone finance agents — from device lock to payment reconciliation.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 20,
          }}>
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} style={{
                  background: 'linear-gradient(145deg,rgba(13,26,64,0.85),rgba(6,11,24,0.6))',
                  border: `1px solid ${feature.color}22`,
                  borderRadius: 18,
                  padding: '28px 24px',
                  transition: 'transform .2s, box-shadow .2s',
                }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: `${feature.color}14`,
                    border: `1px solid ${feature.color}28`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 18,
                  }}>
                    <Icon size={20} color={feature.color} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)' }}>{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#070D1E', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 16px',
              borderRadius: 9999,
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#93C5FD',
            }}>
              Getting Started
            </span>
          </div>

          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px,4vw,42px)',
            fontWeight: 900,
            lineHeight: 1.18,
            marginBottom: 56,
          }}>
            Up and Running in{' '}
            <span style={{
              background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              3 Steps
            </span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
          }}>
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} style={{ textAlign: 'center', padding: '0 16px' }}>
                  {/* Step icon + number */}
                  <div style={{ display: 'inline-block', position: 'relative', marginBottom: 22 }}>
                    <div style={{
                      width: 70,
                      height: 70,
                      borderRadius: 18,
                      background: 'linear-gradient(135deg,rgba(217,119,6,0.15),rgba(37,99,235,0.1))',
                      border: '1px solid rgba(245,158,11,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={26} color="#FCD34D" />
                    </div>
                    <span style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#D97706,#F59E0B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#000',
                    }}>
                      {i + 1}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#060B18' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 16px',
              borderRadius: 9999,
              background: 'rgba(245,158,11,0.09)',
              border: '1px solid rgba(245,158,11,0.25)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FCD34D',
            }}>
              What Agents Say
            </span>
          </div>

          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px,4vw,42px)',
            fontWeight: 900,
            marginBottom: 12,
          }}>
            Trusted by Top Agents Across Nigeria
          </h2>

          <p style={{ textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 52px' }}>
            Real feedback from agents running active phone financing operations.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {testimonials.map((t) => (
              <div key={t.name} style={{
                background: 'linear-gradient(145deg,rgba(13,26,64,0.7),rgba(6,11,24,0.4))',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                {/* Quote */}
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', flexGrow: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: t.gold
                      ? 'linear-gradient(135deg,#D97706,#F59E0B)'
                      : 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    color: t.gold ? '#000' : '#fff',
                    flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: '#070D1E', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg,#0D1A40,#0A1225)',
            border: '1px solid rgba(245,158,11,0.18)',
            borderRadius: 24,
            padding: 'clamp(40px,6vw,72px) clamp(28px,6vw,64px)',
            textAlign: 'center',
            borderTop: '3px solid #F59E0B',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 16px',
              borderRadius: 9999,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.28)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FCD34D',
              marginBottom: 20,
            }}>
              Start Today — It&apos;s Free
            </span>

            <h2 style={{
              fontSize: 'clamp(26px,4vw,42px)',
              fontWeight: 900,
              lineHeight: 1.18,
              marginBottom: 16,
            }}>
              Turn Repayments Into{' '}
              <span style={{
                background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Predictable Cash Flow
              </span>
            </h2>

            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto 36px' }}>
              Launch your account in minutes and manage collections, lock rules, and growth dashboards from one platform.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <a href="/register" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg,#D97706,#F59E0B)',
                color: '#000',
                fontWeight: 800,
                fontSize: 15,
                padding: '14px 32px',
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(217,119,6,0.45)',
              }}>
                Create Agent Account <ArrowRight size={16} />
              </a>
              <a href="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(37,99,235,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#93C5FD',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 32px',
                borderRadius: 12,
                textDecoration: 'none',
              }}>
                Already have an account?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer style={{
        background: '#030917',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#1D4ED8,#2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Smartphone size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>Meder</span>
              <span style={{ color: '#F59E0B' }}>Buy</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            &copy; 2026 MederBuy. Built for high-performance phone finance teams.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Sign In</a>
            <a href="/register" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Register</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
