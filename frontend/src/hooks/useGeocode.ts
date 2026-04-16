import { useQuery } from '@tanstack/react-query'

export interface GeoResult {
  lat: number
  lng: number
}

async function geocodeCity(city: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr`
  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'fr',
      'User-Agent': 'Loxia-App/1.0',
    },
  })
  if (!resp.ok) return null
  const data = await resp.json()
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

export function useGeocode(city: string | undefined) {
  return useQuery({
    queryKey: ['geocode', city],
    queryFn: () => geocodeCity(city!),
    enabled: !!city && city.trim().length > 1,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
}
