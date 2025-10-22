import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PermitMap } from '@/components/PermitMap'

export default async function MapPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout userEmail={user.email} userRole={profile?.role || null}>
      <div className="h-[calc(100vh-6rem)] relative">
        <PermitMap />
      </div>
    </DashboardLayout>
  )
}
