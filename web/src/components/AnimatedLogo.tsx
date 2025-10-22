'use client'

import { useEffect, useState } from 'react'

export function AnimatedLogo({ className = '' }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind */}
      <div className="absolute inset-0 blur-xl opacity-30 animate-pulse-slow" 
           style={{ 
             background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.6), rgba(6, 182, 212, 0.6), rgba(20, 184, 166, 0.6))',
             transform: 'scale(1.2)'
           }}>
      </div>
      
      {/* Text with gradient */}
      <div className={`font-bold relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <span className="inline-block animate-pulse-slow mr-0.5" 
              style={{
                background: 'linear-gradient(90deg, rgb(37, 99, 235), rgb(6, 182, 212))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
          Permit
        </span>
        <span className="inline-block animate-bounce-slow"
              style={{
                background: 'linear-gradient(90deg, rgb(6, 182, 212), rgb(20, 184, 166))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
          IQ
        </span>
      </div>
    </div>
  )
}

export function AnimatedLogoLarge() {
  return (
    <div className="relative inline-block">
      <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 animate-gradient">
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">P</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">e</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">r</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">m</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">i</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">t</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default text-cyan-400">I</span>
        <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default text-teal-400">Q</span>
      </h1>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 blur-2xl opacity-20 animate-pulse-slow -z-10"></div>
    </div>
  )
}
