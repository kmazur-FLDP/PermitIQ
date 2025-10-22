'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModernHeader } from '@/components/ModernHeader'

interface DashboardLayoutProps {
  userEmail: string | null
  userRole: string | null
  children: React.ReactNode
}

export function DashboardLayout({ userEmail, userRole, children }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <ModernHeader
        userEmail={userEmail}
        userRole={userRole}
        onSignOut={handleSignOut}
      />
      <main className="page-transition">
        {children}
      </main>
    </div>
  )
}
