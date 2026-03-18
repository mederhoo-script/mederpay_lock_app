export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">MederBuy</div>
          <div className="flex gap-4">
            <a href="/login" className="px-4 py-2 rounded-md text-foreground hover:bg-secondary">
              Sign In
            </a>
            <a href="/register" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">
              Get Started
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Sell Phones on Finance
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            MederBuy is the complete BNPL (Buy Now Pay Later) phone management platform for agents in Nigeria. 
            Sell more phones, get paid on time, and grow your business.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/register" className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90">
              Start Free Trial
            </a>
            <a href="#features" className="px-6 py-3 rounded-md border border-border hover:bg-secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Features for Phone Agents
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Phone Inventory', description: 'Manage your phone stock with IMEI tracking and automatic locking' },
              { title: 'Payment Tracking', description: 'Track payments from buyers across multiple payment gateways' },
              { title: 'Virtual Accounts', description: 'Generate unique virtual accounts for each buyer for seamless reconciliation' },
              { title: 'Fee Management', description: 'Automated calculation of platform fees based on phone pricing tiers' },
              { title: 'Sub-Agents', description: 'Build your agent network with sub-agent management and commission tracking' },
              { title: 'Reports & Analytics', description: 'Detailed dashboards showing sales, payments, and revenue' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your phone business?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of phone agents managing millions in BNPL sales on MederBuy.
          </p>
          <a href="/register" className="inline-block px-8 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-lg font-medium">
            Sign Up Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 MederBuy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
