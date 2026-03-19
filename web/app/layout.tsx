import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'MederBuy — Phone Financing Management',
  description: 'Sell phones on finance. Get paid on time. MederBuy is the complete BNPL phone management platform for agents in Nigeria.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="mederbuy-theme"
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
