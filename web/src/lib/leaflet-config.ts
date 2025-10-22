// Fix for Leaflet marker icons in Next.js
// Only run on client side
if (typeof window !== 'undefined') {
  import('leaflet').then((L) => {
    // Fix default icon paths
    // @ts-expect-error - Leaflet type definitions issue
    delete L.default.Icon.Default.prototype._getIconUrl

    // @ts-expect-error - Leaflet type definitions issue
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  })
}
