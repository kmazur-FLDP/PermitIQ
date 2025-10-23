'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  permit_number: string
  applicant_name: string
  project_name: string | null
  county: string
  permit_type: string
  acreage: number
  issue_date: string
  permit_status: string
}

interface AcreageLeaderboardProps {
  leaderboardData: LeaderboardEntry[]
  counties: string[]
  permitTypes: string[]
}

export function AcreageLeaderboard({ leaderboardData, counties, permitTypes }: AcreageLeaderboardProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Filter data based on selections
  const filteredData = leaderboardData.filter((entry) => {
    const countyMatch = selectedCounty === 'all' || entry.county === selectedCounty
    const typeMatch = selectedType === 'all' || entry.permit_type === selectedType
    return countyMatch && typeMatch
  })

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-300'
    if (rank === 2) return 'bg-gray-50 border-gray-300'
    if (rank === 3) return 'bg-orange-50 border-orange-300'
    return 'bg-white border-slate-200'
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Acreage Leaderboard
        </CardTitle>
        <CardDescription>
          Top 10 largest permits by acreage this year (2025)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* County Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Filter by County
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Counties</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Permit Type Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Filter by Permit Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {permitTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedCounty !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSelectedCounty('all')
                setSelectedType('all')
              }}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {filteredData.map((entry) => (
            <Link
              key={entry.permit_number}
              href={`/map?permit=${entry.permit_number}`}
              className="block group"
            >
              <div
                className={`${getMedalColor(entry.rank)} border-2 rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  {/* Left side - Rank and Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-center min-w-[60px]">
                      <div className="text-3xl font-bold mb-1">
                        {getMedalIcon(entry.rank)}
                      </div>
                      <div className="text-xs text-slate-500">Rank</div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-blue-600 group-hover:text-blue-700 mb-1">
                        {entry.permit_number}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 mb-1">
                        {entry.applicant_name}
                      </div>
                      {entry.project_name && (
                        <div className="text-xs text-slate-600 mb-2">
                          📍 {entry.project_name}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {entry.county}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          {entry.permit_type}
                        </span>
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          entry.permit_status?.toLowerCase().includes('active') 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {entry.permit_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Acreage */}
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-slate-800">
                      {entry.acreage.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">ACRES</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(entry.issue_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-slate-200">
            <span className="text-4xl mb-2 block">🔍</span>
            <p className="text-slate-600 font-semibold">No permits found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Total acreage summary */}
        {filteredData.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-900">
                Total Top {filteredData.length} Permits:
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {filteredData.reduce((sum, entry) => sum + entry.acreage, 0).toLocaleString()} acres
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
