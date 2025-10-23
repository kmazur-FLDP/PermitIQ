'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface ExpiringPermitData {
  time_period: string
  days_range: string
  permit_count: number
  total_acreage: number
}

interface ExpiringPermitsWidgetProps {
  expiringData: ExpiringPermitData[]
}

const periodColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  '30 Days': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', icon: '🚨' },
  '60 Days': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', icon: '⚠️' },
  '90 Days': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', icon: '⏰' },
}

export function ExpiringPermitsWidget({ expiringData }: ExpiringPermitsWidgetProps) {
  const totalExpiring = expiringData.reduce((sum, item) => sum + item.permit_count, 0)
  const totalAcreage = expiringData.reduce((sum, item) => sum + item.total_acreage, 0)

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Expiring Permits Alert
        </CardTitle>
        <CardDescription>
          Track permits approaching expiration for renewal opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Expiring (90 days)</p>
            <p className="text-2xl font-bold text-slate-700">
              {totalExpiring.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Acreage</p>
            <p className="text-2xl font-bold text-slate-700">
              {Math.round(totalAcreage).toLocaleString()} acres
            </p>
          </div>
        </div>

        {/* Time Period Breakdown */}
        <div className="space-y-3">
          {expiringData.map((item) => {
            const colors = periodColors[item.time_period] || {
              bg: 'bg-slate-50',
              text: 'text-slate-700',
              border: 'border-slate-200',
              icon: '📋'
            }
            
            return (
              <Link
                key={item.time_period}
                href={`/map?expiring=${item.time_period.replace(' ', '_')}`}
                className="block group"
              >
                <div
                  className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{colors.icon}</span>
                      <div>
                        <p className={`${colors.text} font-bold text-base`}>
                          Expires in {item.time_period}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.days_range}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${colors.text} text-3xl font-bold`}>
                        {item.permit_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">permits</p>
                    </div>
                  </div>
                  
                  {/* Acreage info */}
                  <div className="mt-3 pt-3 border-t border-white/50 flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Acreage:</span>
                    <span className={`${colors.text} font-semibold`}>
                      {Math.round(item.total_acreage).toLocaleString()} acres
                    </span>
                  </div>
                  
                  {/* Hover hint */}
                  <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    → Click to view on map
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        
        {expiringData.length === 0 && (
          <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-green-200">
            <span className="text-4xl mb-2 block">✅</span>
            <p className="text-green-700 font-semibold">No permits expiring soon</p>
            <p className="text-xs text-slate-500 mt-1">All permits have sufficient time remaining</p>
          </div>
        )}
        
        {/* Action hint */}
        {totalExpiring > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Use these alerts to identify renewal opportunities and plan ahead for permit extensions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
