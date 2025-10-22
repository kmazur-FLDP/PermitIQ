// Fix for Leaflet marker icons in Next.js
// Only run on client side
if (typeof window !== 'undefined') {
  import('leaflet').then((L) => {
    // Fix default icon paths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.default.Icon.Default.prototype as any)._getIconUrl

    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  })
}
