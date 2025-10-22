'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { Permit } from '@/types'
import '@/lib/leaflet-config' // Fix marker icons
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Create a separate component file for MapController
const MapController = dynamic(
  () => import('@/components/MapController'),
  { ssr: false }
)

const HeatmapLayer = dynamic(
  () => import('@/components/HeatmapLayer'),
  { ssr: false }
)

interface PermitMapProps {
  initialPermits?: Permit[]
}

type ViewMode = 'markers' | 'heatmap'
type DateRange = 'all' | '30' | '60' | '90' | '180' | '365'

export function PermitMap({ initialPermits = [] }: PermitMapProps) {
  const [permits, setPermits] = useState<Permit[]>(initialPermits)
  const [filteredPermits, setFilteredPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCounty, setSelectedCounty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('markers')
  const [counties, setCounties] = useState<string[]>([])
  const [permitTypes, setPermitTypes] = useState<string[]>([])

  useEffect(() => {
    const loadPermits = async () => {
      try {
        const supabase = createClient()
        
        // Fetch permits with valid coordinates
        const { data, error } = await supabase
          .from('erp_permits')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(10000)

        if (error) throw error

        const typedData = data as Permit[]
        setPermits(typedData)
        
        // Extract unique counties and permit types for filters
        const uniqueCounties = [...new Set(typedData.map(p => p.county).filter(Boolean))] as string[]
        const uniqueTypes = [...new Set(typedData.map(p => p.permit_type).filter(Boolean))] as string[]
        setCounties(uniqueCounties.sort())
        setPermitTypes(uniqueTypes.sort())
        
      } catch (err) {
        console.error('Error loading permits:', err)
        setError('Failed to load permits')
      } finally {
        setLoading(false)
      }
    }

    if (initialPermits.length === 0) {
      loadPermits()
    } else {
      setLoading(false)
    }
  }, [initialPermits])

  // Apply filters
  useEffect(() => {
    let filtered = permits
    
    // Filter by county
    if (selectedCounty !== 'all') {
      filtered = filtered.filter(p => p.county === selectedCounty)
    }
    
    // Filter by permit type
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.permit_type === selectedType)
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo)
      
      filtered = filtered.filter(p => {
        const permitDate = p.issue_date ? new Date(p.issue_date) : new Date(p.updated_at)
        return permitDate >= cutoffDate
      })
    }
    
    setFilteredPermits(filtered)
  }, [permits, selectedCounty, selectedType, dateRange])

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center animate-slide-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Loading permits...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="glass-effect p-8 rounded-xl text-center animate-slide-in">
          <p className="text-2xl font-bold text-red-600 mb-2">⚠️ Error</p>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  // Center of Florida
  const center: [number, number] = [28.5, -82.0]

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="z-0 rounded-xl"
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController permits={filteredPermits} />
        
        {viewMode === 'heatmap' ? (
          <HeatmapLayer permits={filteredPermits} />
        ) : (
          filteredPermits.map((permit) => {
            if (!permit.latitude || !permit.longitude) return null
            
            return (
              <Marker
                key={permit.permit_number}
                position={[permit.latitude, permit.longitude]}
              >
                <Popup>
                  <div className="min-w-[280px] p-2">
                    <h3 className="font-bold text-base mb-3 text-blue-600 border-b pb-2">
                      {permit.permit_number}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong className="text-slate-700">County:</strong> <span className="text-slate-600">{permit.county}</span></p>
                      <p><strong className="text-slate-700">Applicant:</strong> <span className="text-slate-600">{permit.applicant_name}</span></p>
                      {permit.project_name && (
                        <p><strong className="text-slate-700">Project:</strong> <span className="text-slate-600">{permit.project_name}</span></p>
                      )}
                      {permit.permit_type && (
                        <p><strong className="text-slate-700">Type:</strong> <span className="text-slate-600">{permit.permit_type}</span></p>
                      )}
                      {permit.status && (
                        <p><strong className="text-slate-700">Status:</strong> <span className={`font-semibold ${permit.status.toLowerCase().includes('active') ? 'text-green-600' : 'text-slate-600'}`}>{permit.status}</span></p>
                      )}
                      {permit.total_acreage && (
                        <p><strong className="text-slate-700">Acres:</strong> <span className="text-slate-600">{permit.total_acreage.toLocaleString()}</span></p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })
        )}
      </MapContainer>
      
      {/* Filter Controls - Top Left */}
      <Card className="absolute top-4 left-4 glass-effect border-white/40 p-4 z-1000 min-w-[300px] animate-slide-in shadow-xl">
        <h3 className="font-bold text-lg mb-3 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">
          🗺️ Map Controls
        </h3>
        
        {/* View Mode Toggle */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <label className="text-xs font-semibold text-slate-700 mb-2 block">View Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode('markers')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'markers'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📍 Markers
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🔥 Heat Map
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">County</label>
            <select 
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All Counties ({permits.length})</option>
              {counties.map(county => (
                <option key={county} value={county}>
                  {county} ({permits.filter(p => p.county === county).length})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Permit Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All Types</option>
              {permitTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {(selectedCounty !== 'all' || selectedType !== 'all' || dateRange !== 'all') && (
            <Button 
              onClick={() => {
                setSelectedCounty('all')
                setSelectedType('all')
                setDateRange('all')
              }}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </Card>
      
      {/* Stats overlay - Bottom Left */}
      <Card className="absolute bottom-4 left-4 glass-effect border-white/40 p-4 z-1000 shadow-xl animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">📍</div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Showing Permits</p>
            <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {filteredPermits.length.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Legend - Bottom Right */}
      <Card className="absolute bottom-4 right-4 glass-effect border-white/40 p-4 z-1000 shadow-xl animate-slide-in" style={{ animationDelay: '0.2s' }}>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Legend</h4>
        <div className="space-y-1 text-xs text-slate-600">
          {viewMode === 'markers' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Permit Location</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Click markers for details
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600"></div>
                  <span>Low Density</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500"></div>
                  <span>Medium Density</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500"></div>
                  <span>High Density</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Shows permit concentration
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
