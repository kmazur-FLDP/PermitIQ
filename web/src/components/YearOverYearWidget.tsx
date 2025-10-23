'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface YoYData {
  metric: string
  current_year_value: number
  previous_year_value: number
  change_count: number
  change_percentage: number
}

interface YearOverYearWidgetProps {
  yoyData: YoYData[]
  currentYear?: number
  previousYear?: number
}

export function YearOverYearWidget({ yoyData, currentYear = 2025, previousYear = 2024 }: YearOverYearWidgetProps) {
  const formatValue = (metric: string, value: number) => {
    if (metric.includes('Acreage') && !metric.includes('Avg')) {
      return value.toLocaleString() + ' acres'
    } else if (metric.includes('Avg')) {
      return value.toLocaleString() + ' acres'
    }
    return value.toLocaleString()
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-slate-600'
  }

  const getChangeBg = (change: number) => {
    if (change > 0) return 'bg-green-50 border-green-200'
    if (change < 0) return 'bg-red-50 border-red-200'
    return 'bg-slate-50 border-slate-200'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return '📈'
    if (change < 0) return '📉'
    return '➖'
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Year-over-Year Comparison
        </CardTitle>
        <CardDescription>
          {currentYear} vs {previousYear} Performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {yoyData.map((item) => (
            <div key={item.metric} className="border-2 border-slate-200 rounded-lg p-4 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">{item.metric}</h3>
                <div className={`${getChangeBg(item.change_percentage)} border-2 rounded-full px-3 py-1 flex items-center gap-2`}>
                  <span className="text-lg">{getChangeIcon(item.change_percentage)}</span>
                  <span className={`${getChangeColor(item.change_percentage)} font-bold text-sm`}>
                    {item.change_percentage > 0 && '+'}{item.change_percentage}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Previous Year */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">{previousYear}</p>
                  <p className="text-xl font-bold text-slate-700">
                    {formatValue(item.metric, item.previous_year_value)}
                  </p>
                </div>
                
                {/* Current Year */}
                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                  <p className="text-xs text-blue-600 mb-1 font-semibold">{currentYear}</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatValue(item.metric, item.current_year_value)}
                  </p>
                </div>
              </div>
              
              {/* Change indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Change:</span>{' '}
                  <span className={getChangeColor(item.change_count)}>
                    {item.change_count > 0 && '+'}{formatValue(item.metric, item.change_count)}
                  </span>
                  {' '}({item.change_percentage > 0 && '+'}{item.change_percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {yoyData.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No year-over-year data available
          </p>
        )}
      </CardContent>
    </Card>
  )
}
