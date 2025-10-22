import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MapHeader } from '@/components/MapHeader'
import { PermitMap } from '@/components/PermitMap'

export default async function MapPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-screen flex flex-col">
      <MapHeader 
        userRole={profile?.role as 'admin' | 'user' | undefined}
        userName={profile?.full_name || user.email || undefined}
      />
      <main className="flex-1 relative">
        <PermitMap />
      </main>
    </div>
  )
}
