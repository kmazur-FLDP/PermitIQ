'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatedLogo } from './AnimatedLogo'

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Left: FLDP Logo + PermitIQ */}
          <div className="flex items-center space-x-4 md:space-x-5">
            <Link href="/" className="flex items-center group">
              <div className="relative w-20 h-20 md:w-24 md:h-24 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/fldp_final_color.png"
                  alt="FLDP Logo"
                  fill
                  sizes="(max-width: 768px) 80px, 96px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <AnimatedLogo className="text-xl md:text-2xl lg:text-3xl" />
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
                    px-4 py-2 rounded-lg font-medium transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg scale-105'
                      : 'text-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
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
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <nav className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                      : 'text-slate-600 bg-white/50'
                    }
                  `}
                >
                  <span className="mr-1">{item.icon}</span>
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
