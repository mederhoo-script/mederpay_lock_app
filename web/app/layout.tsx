import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0A0A] text-white`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
