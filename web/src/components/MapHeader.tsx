'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface MapHeaderProps {
  userRole?: 'admin' | 'user'
  userName?: string
}

export function MapHeader({ userRole, userName }: MapHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/map" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold">PermitIQ</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {userName}
              </span>
            )}
            
            {userRole === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
