'use client'

import { useMapEvents } from 'react-leaflet'

interface ZoomHandlerProps {
  onZoomChange: (zoom: number) => void
}

export function ZoomHandler({ onZoomChange }: ZoomHandlerProps) {
  const map = useMapEvents({
    // @ts-expect-error - react-leaflet v5 type definitions incomplete for zoom events
    zoomend: () => {
      onZoomChange(map.getZoom())
    },
  })
  return null
}
