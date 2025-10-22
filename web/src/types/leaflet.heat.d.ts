declare module 'leaflet.heat' {
  import * as L from 'leaflet'
  
  namespace heat {
    interface HeatLayerOptions {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: { [key: number]: string }
      isHeatLayer?: boolean
    }
  }

  export function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: heat.HeatLayerOptions
  ): L.Layer
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: any
  ): Layer
}
