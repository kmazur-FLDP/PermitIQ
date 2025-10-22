import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/auth'
import AdminClientPage from '@/components/AdminClientPage'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/DashboardLayout'

export default async function AdminPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center">
        <div className="glass-effect p-8 rounded-xl shadow-2xl text-center max-w-md animate-slide-in">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-6">You don&apos;t have permission to access this page.</p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userEmail={user.email || null} userRole={profile?.role || null}>
      <AdminClientPage />
    </DashboardLayout>
  )
}
