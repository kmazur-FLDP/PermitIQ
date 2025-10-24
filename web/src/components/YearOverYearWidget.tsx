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
    <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
          Year-over-Year Comparison
        </CardTitle>
        <CardDescription className="text-slate-600 mt-1">
          {currentYear} vs {previousYear} Performance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-5">
          {yoyData.map((item) => (
            <div key={item.metric} className="border-2 border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-base tracking-wide">{item.metric}</h3>
                <div className={`${getChangeBg(item.change_percentage)} border-2 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm`}>
                  <span className="text-xl">{getChangeIcon(item.change_percentage)}</span>
                  <span className={`${getChangeColor(item.change_percentage)} font-bold text-base tracking-tight`}>
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
