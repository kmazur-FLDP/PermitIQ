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
    <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo + Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-4 group hover:opacity-90 transition-opacity">
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
                <div className="text-2xl font-bold text-slate-900 tracking-tight">PermitIQ</div>
                <div className="text-sm text-slate-600 hidden sm:block font-medium">SWFWMD ERP Permit Intelligence</div>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
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
                <span className="text-sm font-semibold text-slate-800">{userEmail}</span>
                {userRole && (
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm ${
                    userRole === 'admin'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {userRole}
                  </span>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 border-2 border-slate-300 hover:border-slate-700"
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
