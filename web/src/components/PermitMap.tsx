'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { Permit } from '@/types'
import type { Json } from '@/types/database'
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
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
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

const ZoomHandler = dynamic(
  () => import('@/components/ZoomHandler').then((mod) => mod.ZoomHandler),
  { ssr: false }
)

const MarkerClusterGroup = dynamic(
  // @ts-expect-error - react-leaflet-cluster doesn't have proper TypeScript definitions
  () => import('react-leaflet-cluster'),
  { ssr: false }
)

interface PermitMapProps {
  initialPermits?: Permit[]
}

// Helper function to get tile layer configuration based on map type
function getTileLayerConfig(baseMapType: BaseMapType) {
  const configs = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }
  }
  return configs[baseMapType]
}

// Helper function to parse geometry from GeoJSON and convert to Leaflet coordinate format
function parseGeometry(geometryJson: Json | null | undefined): [number, number][] | [number, number][][] | null {
  if (!geometryJson) return null
  
  try {
    const geom = typeof geometryJson === 'string' ? JSON.parse(geometryJson) : geometryJson
    
    if (!geom || !geom.coordinates) return null
    
    // Handle different geometry types
    if (geom.type === 'Polygon') {
      // Polygon coordinates are [[[lng, lat], ...]]
      // Leaflet expects [[lat, lng], ...]
      return geom.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng])
    } else if (geom.type === 'MultiPolygon') {
      // MultiPolygon coordinates are [[[[lng, lat], ...]], ...]
      // Return the first polygon for simplicity
      return geom.coordinates[0][0].map(([lng, lat]: [number, number]) => [lat, lng])
    }
    
    return null
  } catch (e) {
    console.error('Error parsing geometry:', e)
    return null
  }
}

type ViewMode = 'markers' | 'heatmap'
type DateRange = 'all' | '30' | '60' | '90' | '180' | '365'
type DataRange = '5years' | 'all'
type BaseMapType = 'street' | 'satellite' | 'terrain'

export function PermitMap({ initialPermits = [] }: PermitMapProps) {
  const [permits, setPermits] = useState<Permit[]>(initialPermits)
  const [filteredPermits, setFilteredPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCounty, setSelectedCounty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [dataRange, setDataRange] = useState<DataRange>('5years')
  const [viewMode, setViewMode] = useState<ViewMode>('markers')
  const [baseMap, setBaseMap] = useState<BaseMapType>('street')
  const [clusterEnabled, setClusterEnabled] = useState<boolean>(true)
  const [counties, setCounties] = useState<string[]>([])
  const [permitTypes, setPermitTypes] = useState<string[]>([])
  const [totalAvailable, setTotalAvailable] = useState<number>(0)
  const [minAcreage, setMinAcreage] = useState<string>('')
  const [maxAcreage, setMaxAcreage] = useState<string>('')
  const [currentZoom, setCurrentZoom] = useState<number>(7)
  
  // Time-lapse animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [timelapseSpeed, setTimelapseSpeed] = useState<number>(1)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [timelapseRange, setTimelapseRange] = useState<{ min: Date; max: Date } | null>(null)

  useEffect(() => {
    const loadPermits = async () => {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        
        // Calculate date cutoff based on dataRange
        const fiveYearsAgo = new Date()
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
        
        let allPermits: Permit[] = []
        let page = 0
        const pageSize = 1000
        let hasMore = true

        console.log(`Loading permits for range: ${dataRange}...`)

        while (hasMore) {
          let query = supabase
            .from('erp_permits')
            .select('*')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
          
          // Apply date filter for 5 years if not "all"
          if (dataRange === '5years') {
            query = query.gte('issue_date', fiveYearsAgo.toISOString())
          }
          
          const { data, error } = await query
            .order('updated_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error

          if (data && data.length > 0) {
            allPermits = [...allPermits, ...data]
            page++
            
            // Show progress for large datasets
            if (dataRange === 'all') {
              console.log(`Loading permits: ${allPermits.length} loaded...`)
            }
            
            // Check if we got less than pageSize (means we're done)
            if (data.length < pageSize) {
              hasMore = false
            }
          } else {
            hasMore = false
          }
        }

        // Get total count of all available permits
        const { count } = await supabase
          .from('erp_permits')
          .select('*', { count: 'exact', head: true })
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        setTotalAvailable(count || 0)
        console.log(`✅ Loaded ${allPermits.length} permits (${count} total available with coordinates)`)

        // Deduplicate permits by ID (in case of pagination issues or duplicate records)
        const uniquePermits = Array.from(
          new Map(allPermits.map(permit => [permit.id, permit])).values()
        )
        
        if (uniquePermits.length !== allPermits.length) {
          console.warn(`⚠️ Removed ${allPermits.length - uniquePermits.length} duplicate permits`)
        }

        const typedData = uniquePermits as Permit[]
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
      setPermits(initialPermits)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRange]) // Only re-run when dataRange changes, not on every render

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
    
    // Filter by acreage range
    if (minAcreage !== '' || maxAcreage !== '') {
      const min = minAcreage !== '' ? parseFloat(minAcreage) : 0
      const max = maxAcreage !== '' ? parseFloat(maxAcreage) : Infinity
      
      filtered = filtered.filter(p => {
        // Check both 'acreage' and 'total_acreage' fields (database schema mismatch)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const acreageValue = (p as any).acreage || p.total_acreage
        
        // Skip permits without acreage data
        if (!acreageValue || acreageValue === null || acreageValue === 0) {
          return false
        }
        return acreageValue >= min && acreageValue <= max
      })
    }
    
    setFilteredPermits(filtered)
  }, [permits, selectedCounty, selectedType, dateRange, minAcreage, maxAcreage])

  // Calculate date range for time-lapse when permits change (but don't enable by default)
  useEffect(() => {
    if (permits.length === 0) {
      setTimelapseRange(null)
      // Don't reset currentDate here - let user control enablement
      return
    }
    
    const permitDates = permits
      .filter(p => p.issue_date)
      .map(p => new Date(p.issue_date!))
      .sort((a, b) => a.getTime() - b.getTime())
    
    if (permitDates.length > 0) {
      const minDate = permitDates[0]
      const maxDate = permitDates[permitDates.length - 1]
      setTimelapseRange({ min: minDate, max: maxDate })
      // Don't set currentDate here - time-lapse disabled by default
    }
  }, [permits])

  // Animation playback logic
  useEffect(() => {
    if (!isPlaying || !timelapseRange || !currentDate) return
    
    const dayIncrement = timelapseSpeed * 30 // Each tick adds days (scaled by speed)
    const interval = setInterval(() => {
      setCurrentDate(prev => {
        if (!prev || !timelapseRange) return prev
        
        const nextDate = new Date(prev)
        nextDate.setDate(nextDate.getDate() + dayIncrement)
        
        // Loop back to start if we reach the end
        if (nextDate > timelapseRange.max) {
          return timelapseRange.min
        }
        
        return nextDate
      })
    }, 100) // Update every 100ms for smooth animation
    
    return () => clearInterval(interval)
  }, [isPlaying, timelapseSpeed, timelapseRange, currentDate])

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
  
  // Apply time-lapse filter if currentDate is set
  const displayedPermits = currentDate 
    ? filteredPermits.filter(p => {
        if (!p.issue_date) return false
        return new Date(p.issue_date) <= currentDate
      })
    : filteredPermits

  return (
    <div className="h-full w-full relative">
      <MapContainer
        // @ts-expect-error - react-leaflet v5 type definitions issue
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="z-0 rounded-xl"
        attributionControl={false}
      >
        <TileLayer
          // @ts-expect-error - react-leaflet v5 type definitions issue
          attribution={getTileLayerConfig(baseMap).attribution}
          url={getTileLayerConfig(baseMap).url}
          key={baseMap}
        />
        
        <ZoomHandler onZoomChange={setCurrentZoom} />
        <MapController permits={displayedPermits} />
        
        {viewMode === 'heatmap' ? (
          <HeatmapLayer permits={displayedPermits} />
        ) : (
          <>
            {/* Render polygons outside cluster group when zoomed in */}
            {currentZoom >= 11 && displayedPermits.map((permit) => {
              if (!permit.latitude || !permit.longitude) return null
              
              const geometry = parseGeometry(permit.geometry)
              if (!geometry) return null
              
              // Prepare popup content
              const popupContent = (
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
                      {permit.permit_status && (
                        <p><strong className="text-slate-700">Status:</strong> <span className={`font-semibold ${permit.permit_status.toLowerCase().includes('active') ? 'text-green-600' : 'text-slate-600'}`}>{permit.permit_status}</span></p>
                      )}
                      {(permit.total_acreage || (permit as any).acreage) && (
                        <p><strong className="text-slate-700">Acres:</strong> <span className="text-slate-600">{((permit as any).acreage || permit.total_acreage)?.toLocaleString()}</span></p>
                      )}
                    </div>
                  </div>
                </Popup>
              )
              
              return (
                <Polygon
                  key={permit.id}
                  positions={geometry as any}
                  pathOptions={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.5,
                    color: '#dc2626',
                    weight: 2,
                    opacity: 0.8
                  }}
                >
                  {popupContent}
                </Polygon>
              )
            })}
            
            {/* Render clustered circle markers when zoomed out (if clustering enabled) */}
            {currentZoom < 11 && clusterEnabled && (
              <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                // @ts-expect-error - react-leaflet-cluster type definitions are incomplete
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount()
                  let size = 'small'
                  let bgColor = 'bg-blue-500'
                  
                  if (count > 100) {
                    size = 'large'
                    bgColor = 'bg-red-500'
                  } else if (count > 50) {
                    size = 'medium'
                    bgColor = 'bg-orange-500'
                  }
                  
                  const sizeClass = size === 'large' ? 'w-14 h-14 text-xl' : 
                                   size === 'medium' ? 'w-12 h-12 text-lg' : 
                                   'w-10 h-10 text-sm'
                  
                  // @ts-expect-error - Leaflet divIcon type
                  return window.L?.divIcon({
                    html: `<div class="flex items-center justify-center ${sizeClass} ${bgColor} text-white font-bold rounded-full shadow-lg border-4 border-white">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: [40, 40]
                  })
                }}
              >
                {displayedPermits.map((permit) => {
                  if (!permit.latitude || !permit.longitude) return null
                  
                  // Prepare popup content
                  const popupContent = (
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
                          {permit.permit_status && (
                            <p><strong className="text-slate-700">Status:</strong> <span className={`font-semibold ${permit.permit_status.toLowerCase().includes('active') ? 'text-green-600' : 'text-slate-600'}`}>{permit.permit_status}</span></p>
                          )}
                          {(permit.total_acreage || (permit as any).acreage) && (
                            <p><strong className="text-slate-700">Acres:</strong> <span className="text-slate-600">{((permit as any).acreage || permit.total_acreage)?.toLocaleString()}</span></p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  )
                  
                  return (
                    <CircleMarker
                      key={permit.id}
                      center={[permit.latitude, permit.longitude]}
                      pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: 0.7,
                        color: '#dc2626',
                        weight: 2,
                        opacity: 0.9
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...({ radius: 6 } as any)}
                    >
                      {popupContent}
                    </CircleMarker>
                  )
                })}
              </MarkerClusterGroup>
            )}
            
            {/* Render individual circle markers when clustering is disabled */}
            {currentZoom < 11 && !clusterEnabled && displayedPermits.map((permit) => {
              if (!permit.latitude || !permit.longitude) return null
              
              // Prepare popup content
              const popupContent = (
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
                      {permit.permit_status && (
                        <p><strong className="text-slate-700">Status:</strong> <span className={`font-semibold ${permit.permit_status.toLowerCase().includes('active') ? 'text-green-600' : 'text-slate-600'}`}>{permit.permit_status}</span></p>
                      )}
                      {(permit.total_acreage || (permit as any).acreage) && (
                        <p><strong className="text-slate-700">Acres:</strong> <span className="text-slate-600">{((permit as any).acreage || permit.total_acreage)?.toLocaleString()}</span></p>
                      )}
                    </div>
                  </div>
                </Popup>
              )
              
              return (
                <CircleMarker
                  key={permit.id}
                  center={[permit.latitude, permit.longitude]}
                  pathOptions={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.7,
                    color: '#dc2626',
                    weight: 2,
                    opacity: 0.9
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  {...({ radius: 6 } as any)}
                >
                  {popupContent}
                </CircleMarker>
              )
            })}
          </>
        )}
      </MapContainer>
      
      {/* Filter Controls - Bottom Left */}
      <Card className="absolute bottom-4 left-4 glass-effect border-white/40 p-4 z-1000 min-w-[300px] animate-slide-in shadow-xl">
        <h3 className="font-bold text-lg mb-3 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">
          🗺️ Map Controls
        </h3>
        
        {/* Data Range Toggle */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Data Range</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDataRange('5years')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dataRange === '5years'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📅 Last 5 Years
            </button>
            <button
              onClick={() => setDataRange('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dataRange === 'all'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🌍 All Time
            </button>
          </div>
          {totalAvailable > 0 && (
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              {permits.length.toLocaleString()} of {totalAvailable.toLocaleString()} permits loaded
            </p>
          )}
        </div>
        
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

        {/* Cluster Mode Toggle - Only show in marker mode */}
        {viewMode === 'markers' && (
          <div className="mb-4 pb-4 border-b border-slate-200">
            <label className="text-xs font-semibold text-slate-700 mb-2 block">
              Cluster Mode
              <span className="ml-1 text-xs font-normal text-slate-500">(when zoomed out)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setClusterEnabled(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  clusterEnabled
                    ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ⚡ Enabled
              </button>
              <button
                onClick={() => setClusterEnabled(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  !clusterEnabled
                    ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                🔍 Disabled
              </button>
            </div>
          </div>
        )}

        {/* Base Map Toggle */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Base Map</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setBaseMap('street')}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                baseMap === 'street'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🗺️ Street
            </button>
            <button
              onClick={() => setBaseMap('satellite')}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                baseMap === 'satellite'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setBaseMap('terrain')}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                baseMap === 'terrain'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ⛰️ Terrain
            </button>
          </div>
        </div>
        
        {/* Time-Lapse Toggle */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Time-Lapse Animation</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (!timelapseRange) {
                  // Initialize timelapse if not already done
                  setCurrentDate(new Date())
                } else {
                  setCurrentDate(timelapseRange.max)
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentDate !== null
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ⏱️ Enabled
            </button>
            <button
              onClick={() => {
                setCurrentDate(null)
                setIsPlaying(false)
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentDate === null
                  ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🚫 Disabled
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
          
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Acreage Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min"
                  value={minAcreage}
                  onChange={(e) => setMinAcreage(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAcreage}
                  onChange={(e) => setMaxAcreage(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            {(() => {
              const permitsWithAcreage = permits.filter(p => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const acreageValue = (p as any).acreage || p.total_acreage
                return acreageValue && acreageValue > 0
              }).length
              
              return permitsWithAcreage === 0 ? (
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  ⚠️ No permits have acreage data in this dataset
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  {permitsWithAcreage.toLocaleString()} permits have acreage data
                </p>
              )
            })()}
          </div>
          
          {(selectedCounty !== 'all' || selectedType !== 'all' || dateRange !== 'all' || minAcreage !== '' || maxAcreage !== '') && (
            <Button 
              onClick={() => {
                setSelectedCounty('all')
                setSelectedType('all')
                setDateRange('all')
                setMinAcreage('')
                setMaxAcreage('')
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
      
      {/* Time-Lapse Controls - Top Center - Only show when time-lapse is enabled */}
      {timelapseRange && currentDate !== null && (
        <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 glass-effect border-white/40 p-4 z-1000 shadow-xl animate-slide-in min-w-[500px]" style={{ animationDelay: '0.15s' }}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">
                ⏱️ Time-Lapse Animation
              </h3>
              <span className="text-xs text-slate-600">
                {currentDate ? currentDate.toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            {/* Timeline Slider */}
            <div className="relative">
              <input
                type="range"
                min={timelapseRange.min.getTime()}
                max={timelapseRange.max.getTime()}
                value={currentDate?.getTime() || timelapseRange.max.getTime()}
                onChange={(e) => {
                  setCurrentDate(new Date(parseInt(e.target.value)))
                  setIsPlaying(false) // Pause when manually adjusting
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{timelapseRange.min.toLocaleDateString()}</span>
                <span>{timelapseRange.max.toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg hover:shadow-xl"
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              
              <button
                onClick={() => setCurrentDate(timelapseRange.min)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                ⏮️ Reset
              </button>
              
              {/* Speed Controls */}
              <div className="flex-1 flex items-center gap-2 ml-4">
                <span className="text-xs text-slate-600 font-medium">Speed:</span>
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setTimelapseSpeed(speed)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      timelapseSpeed === speed
                        ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
              <span>Showing {displayedPermits.length.toLocaleString()} of {filteredPermits.length.toLocaleString()} permits</span>
              <span>{((displayedPermits.length / filteredPermits.length) * 100).toFixed(1)}% of timeline</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Stats overlay - Top Right */}
      <Card className="absolute top-4 right-4 glass-effect border-white/40 p-4 z-1000 shadow-xl animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">📍</div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Showing Permits</p>
            <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {displayedPermits.length.toLocaleString()}
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
                  <div className="w-3 h-3 bg-yellow-400"></div>
                  <span>Low Density</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500"></div>
                  <span>Medium Density</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600"></div>
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
