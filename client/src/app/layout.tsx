import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SysPulse - Real-Time Log Dashboard',
  description: 'Backend monitoring system with real-time log tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}