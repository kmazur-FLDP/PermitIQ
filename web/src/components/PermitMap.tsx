'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { Permit } from '@/types'
import '@/lib/leaflet-config' // Fix marker icons

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

interface PermitMapProps {
  initialPermits?: Permit[]
}

export function PermitMap({ initialPermits = [] }: PermitMapProps) {
  const [permits, setPermits] = useState<Permit[]>(initialPermits)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          .limit(10000) // Limit for performance, adjust as needed

        if (error) throw error

        setPermits(data || [])
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

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permits...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Center of Florida
  const center: [number, number] = [28.5, -82.0]

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {permits.map((permit) => {
          if (!permit.latitude || !permit.longitude) return null
          
          return (
            <Marker
              key={permit.permit_number}
              position={[permit.latitude, permit.longitude]}
            >
              <Popup>
                <div className="min-w-[250px]">
                  <h3 className="font-bold text-sm mb-2">{permit.permit_number}</h3>
                  <div className="space-y-1 text-xs">
                    <p><strong>County:</strong> {permit.county}</p>
                    <p><strong>Applicant:</strong> {permit.applicant_name}</p>
                    {permit.project_name && (
                      <p><strong>Project:</strong> {permit.project_name}</p>
                    )}
                    {permit.status && (
                      <p><strong>Status:</strong> {permit.status}</p>
                    )}
                    {permit.total_acreage && (
                      <p><strong>Acres:</strong> {permit.total_acreage}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-1000">
        <p className="text-sm font-semibold">
          Showing {permits.length.toLocaleString()} permits
        </p>
      </div>
    </div>
  )
}
