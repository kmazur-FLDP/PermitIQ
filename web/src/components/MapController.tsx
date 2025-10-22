'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Permit } from '@/types'

interface MapControllerProps {
  permits: Permit[]
}

export default function MapController({ permits }: MapControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (permits.length > 0 && map) {
      // Create bounds from permit coordinates
      const bounds = permits
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude!, p.longitude!] as [number, number])

      if (bounds.length > 0) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
          animate: true,
          duration: 0.5
        })
      }
    }
  }, [permits, map])

  return null
}
