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

interface HeatmapLayerProps {
  permits: Permit[]
}

interface CustomLayer {
  options?: { isHeatLayer?: boolean }
}

export default function HeatmapLayer({ permits }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || typeof window === 'undefined') return

    // Dynamically import leaflet.heat
    import('leaflet.heat').then(() => {
      const L = window.L
      
      // Create heat map data points [lat, lng, intensity]
      const heatData = permits
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude!, p.longitude!, 0.5] as [number, number, number])

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
  }, [map, permits])

  return null
}
