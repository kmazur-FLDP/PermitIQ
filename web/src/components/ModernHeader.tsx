'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ModernHeaderProps {
  userEmail?: string | null
  userRole?: string | null
  onSignOut?: () => void
}

export function ModernHeader({ userEmail, userRole, onSignOut }: ModernHeaderProps) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Map View', href: '/map', icon: '🗺️' },
    ...(userRole === 'admin' ? [{ name: 'Admin', href: '/admin', icon: '⚙️' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo + Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative w-24 h-16">
                <Image
                  src="/fldp_final_color.png"
                  alt="FLDP Logo"
                  fill
                  sizes="96px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">PermitIQ</div>
                <div className="text-sm text-slate-500 hidden sm:block">SWFWMD ERP Permit Intelligence</div>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right: User Info + Sign Out */}
          {userEmail && (
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-700">{userEmail}</span>
                {userRole && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    userRole === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {userRole}
                  </span>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-200 py-3">
          <nav className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
