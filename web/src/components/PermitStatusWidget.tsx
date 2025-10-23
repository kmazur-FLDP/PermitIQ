'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface PermitStatusData {
  status_category: string
  permit_count: number
  percentage: number
}

interface PermitStatusWidgetProps {
  statusData: PermitStatusData[]
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  Active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  Denied: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Withdrawn: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  Other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

const statusIcons: Record<string, string> = {
  Active: '✅',
  Expired: '⏰',
  Pending: '⏳',
  Denied: '❌',
  Withdrawn: '🚫',
  Other: '📋',
}

export function PermitStatusWidget({ statusData }: PermitStatusWidgetProps) {
  const totalPermits = statusData.reduce((sum, item) => sum + item.permit_count, 0)

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Permit Status Breakdown
        </CardTitle>
        <CardDescription>Current status of all permits in system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusData.map((status) => {
            const colors = statusColors[status.status_category] || statusColors.Other
            const icon = statusIcons[status.status_category] || statusIcons.Other
            
            return (
              <Link
                key={status.status_category}
                href={`/map?status=${status.status_category.toLowerCase()}`}
                className="block group"
              >
                <div
                  className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className={`${colors.text} font-semibold text-sm`}>
                          {status.status_category}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Click to view on map
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${colors.text} text-2xl font-bold`}>
                        {status.permit_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {status.percentage}% of total
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${colors.text.replace('text-', 'bg-')} transition-all duration-500`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Total Permits</span>
            <span className="text-2xl font-bold text-slate-900">
              {totalPermits.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
