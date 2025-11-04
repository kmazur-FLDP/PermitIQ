'use client'

import { ModernHeader } from '@/components/ModernHeader'

interface DashboardLayoutProps {
  userEmail: string | null
  userRole: string | null
  children: React.ReactNode
}

export function DashboardLayout({ userEmail, userRole, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <ModernHeader
        userEmail={userEmail}
        userRole={userRole}
      />
      <main className="page-transition">
        {children}
      </main>
    </div>
  )
}
