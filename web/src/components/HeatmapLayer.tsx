'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Permit } from '@/types'

// Extend Window interface for leaflet.heat
declare global {
  interface Window {
    L: typeof import('leaflet') & {
      heatLayer: (
        latlngs: Array<[number, number, number?]>,
        options?: {
          radius?: number
          blur?: number
          maxZoom?: number
          max?: number
          gradient?: { [key: number]: string }
          isHeatLayer?: boolean
        }
      ) => {
        addTo: (map: ReturnType<typeof useMap>) => void
        options?: { isHeatLayer?: boolean }
      }
    }
  }
}

type DateRange = 'all' | '180' | '365' | '730' | '1095'

interface HeatmapLayerProps {
  permits: Permit[]
  dateRange?: DateRange
}

interface CustomLayer {
  options?: { isHeatLayer?: boolean }
}

export default function HeatmapLayer({ permits, dateRange = 'all' }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || typeof window === 'undefined') return

    // Dynamically import leaflet.heat
    import('leaflet.heat').then(() => {
      const L = window.L
      
      // Calculate dynamic intensity based on dataset size and date range
      // Shorter date ranges = fewer permits = need higher intensity to be visible
      const getIntensityMultiplier = (range: DateRange, permitCount: number): number => {
        // Base intensity increases for smaller datasets
        if (range === '180') return permitCount < 500 ? 4.0 : permitCount < 2000 ? 3.0 : 1.8  // 6 months
        if (range === '365') return permitCount < 1000 ? 3.0 : permitCount < 3000 ? 2.0 : 1.5 // 1 year
        if (range === '730') return permitCount < 2000 ? 2.5 : permitCount < 5000 ? 1.8 : 1.3 // 2 years
        if (range === '1095') return permitCount < 3000 ? 2.0 : permitCount < 7000 ? 1.5 : 1.2 // 3 years
        return 1.0 // 'all' time - use default
      }
      
      const intensityMultiplier = getIntensityMultiplier(dateRange, permits.length)
      
      // Create heat map data points [lat, lng, intensity]
      const heatData = permits
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude!, p.longitude!, 0.5 * intensityMultiplier] as [number, number, number])

      // Remove existing heat layer if any
      map.eachLayer((layer: CustomLayer) => {
        if (layer.options && layer.options.isHeatLayer) {
          map.removeLayer(layer as never)
        }
      })

      // Create and add heat layer
      if (heatData.length > 0) {
        const heatLayer = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 13,
          max: 1.0,
          gradient: {
            0.0: '#FFFF00',  // Yellow (low density)
            0.5: '#FF8C00',  // Orange (medium density)
            1.0: '#FF0000'   // Red (high density)
          },
          isHeatLayer: true  // Custom flag to identify our heat layer
        })
        
        heatLayer.addTo(map)
      }
    })

    // Cleanup on unmount
    return () => {
      map.eachLayer((layer: CustomLayer) => {
        if (layer.options && layer.options.isHeatLayer) {
          map.removeLayer(layer as never)
        }
      })
    }
  }, [map, permits, dateRange])

  return null
}
