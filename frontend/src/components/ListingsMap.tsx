import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ListingSummary } from '@/api/listingsApi'

// Fix default marker icons (Vite asset handling)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// City-centroid fallback for listings that don't yet have server-side coordinates
// (rows created before V3 migration or when geocoding was unavailable)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Paris':            { lat: 48.8566,  lng:  2.3522 },
  'Lyon':             { lat: 45.7640,  lng:  4.8357 },
  'Marseille':        { lat: 43.2965,  lng:  5.3698 },
  'Bordeaux':         { lat: 44.8378,  lng: -0.5792 },
  'Nice':             { lat: 43.7102,  lng:  7.2620 },
  'Toulouse':         { lat: 43.6047,  lng:  1.4442 },
  'Nantes':           { lat: 47.2184,  lng: -1.5536 },
  'Lille':            { lat: 50.6292,  lng:  3.0573 },
  'Strasbourg':       { lat: 48.5734,  lng:  7.7521 },
  'Montpellier':      { lat: 43.6108,  lng:  3.8767 },
  'Rennes':           { lat: 48.1173,  lng: -1.6778 },
  'Grenoble':         { lat: 45.1885,  lng:  5.7245 },
  'Toulon':           { lat: 43.1242,  lng:  5.9280 },
  'Angers':           { lat: 47.4784,  lng: -0.5632 },
  'Dijon':            { lat: 47.3220,  lng:  5.0415 },
  'Nîmes':            { lat: 43.8367,  lng:  4.3601 },
  'Aix-en-Provence':  { lat: 43.5297,  lng:  5.4474 },
  'Cannes':           { lat: 43.5528,  lng:  7.0174 },
  'Saint-Étienne':    { lat: 45.4397,  lng:  4.3872 },
  'Le Havre':         { lat: 49.4938,  lng:  0.1077 },
  'Reims':            { lat: 49.2583,  lng:  4.0317 },
  'Clermont-Ferrand': { lat: 45.7772,  lng:  3.0870 },
  'Brest':            { lat: 48.3905,  lng: -4.4860 },
  'Tours':            { lat: 47.3941,  lng:  0.6848 },
  'Metz':             { lat: 49.1193,  lng:  6.1757 },
  'Nancy':            { lat: 48.6921,  lng:  6.1844 },
  'Orléans':          { lat: 47.9029,  lng:  1.9092 },
  'Perpignan':        { lat: 42.6887,  lng:  2.8948 },
  'Caen':             { lat: 49.1829,  lng: -0.3707 },
  'Rouen':            { lat: 49.4432,  lng:  1.0993 },
  'Limoges':          { lat: 45.8336,  lng:  1.2611 },
  'Poitiers':         { lat: 46.5803,  lng:  0.3404 },
  'Amiens':           { lat: 49.8941,  lng:  2.2958 },
}

function resolveCoords(listing: ListingSummary): { lat: number; lng: number } | null {
  if (listing.lat != null && listing.lng != null) return { lat: listing.lat, lng: listing.lng }
  const key = Object.keys(CITY_COORDS).find(
    (k) => k.toLowerCase() === listing.city.toLowerCase()
  )
  return key ? CITY_COORDS[key] : null
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=120&fit=crop'

function createPriceIcon(price: number, highlighted = false) {
  const bg = highlighted ? '#312e81' : '#4f46e5'
  return L.divIcon({
    html: `
      <div style="
        background:${bg};
        color:white;
        padding:5px 10px;
        border-radius:20px;
        font-size:12px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 3px 10px rgba(0,0,0,0.25);
        border:2px solid white;
        transition:all 0.2s;
        cursor:pointer;
      ">${price.toLocaleString('fr-FR')}€</div>
    `,
    className: '',
    iconSize: [76, 32],
    iconAnchor: [38, 16],
    popupAnchor: [0, -20],
  })
}

// Slight spiral offset so markers from the same city don't stack
function spiralOffset(index: number, total: number): [number, number] {
  if (total <= 1) return [0, 0]
  const angle = (index / total) * 2 * Math.PI
  const radius = 0.004 + index * 0.0015
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

interface MapRecenterProps {
  lat: number
  lng: number
  zoom: number
}

function MapRecenter({ lat, lng, zoom }: MapRecenterProps) {
  const map = useMap()
  const prevRef = useRef({ lat, lng, zoom })
  useEffect(() => {
    const prev = prevRef.current
    if (prev.lat !== lat || prev.lng !== lng || prev.zoom !== zoom) {
      map.flyTo([lat, lng], zoom, { duration: 1 })
      prevRef.current = { lat, lng, zoom }
    }
  }, [lat, lng, zoom, map])
  return null
}

interface ListingsMapProps {
  listings: ListingSummary[]
  filterCity?: string
}

export default function ListingsMap({ listings, filterCity }: ListingsMapProps) {
  // Center: filtered city's first resolvable listing, else France centroid
  const filterGeo = useMemo(() => {
    if (!filterCity) return null
    const match = listings.find((l) => l.city === filterCity && resolveCoords(l) != null)
    return match ? resolveCoords(match) : null
  }, [listings, filterCity])

  const centerLat = filterGeo?.lat ?? 46.6
  const centerLng = filterGeo?.lng ?? 2.4
  const zoom = filterGeo ? 12 : 6

  // Group listings by city to compute spiral offsets when multiple listings share a city
  const cityGroups = useMemo(() => {
    const groups: Record<string, number[]> = {}
    listings.forEach((l, i) => {
      if (resolveCoords(l) == null) return
      if (!groups[l.city]) groups[l.city] = []
      groups[l.city].push(i)
    })
    return groups
  }, [listings])

  const markers = useMemo(() => {
    return listings.flatMap((listing, i) => {
      const geo = resolveCoords(listing)
      if (!geo) return []
      const cityIndices = cityGroups[listing.city] ?? []
      const posInCity = cityIndices.indexOf(i)
      const [dLat, dLng] = spiralOffset(posInCity, cityIndices.length)
      return [{ listing, lat: geo.lat + dLat, lng: geo.lng + dLng }]
    })
  }, [listings, cityGroups])

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapRecenter lat={centerLat} lng={centerLng} zoom={zoom} />
        {markers.map(({ listing, lat, lng }) => (
          <Marker
            key={listing.id}
            position={[lat, lng]}
            icon={createPriceIcon(listing.price)}
          >
            <Popup minWidth={220} maxWidth={260}>
              <div className="font-sans">
                <img
                  src={listing.photoUrl || PLACEHOLDER_IMG}
                  alt={listing.title}
                  className="w-full h-28 object-cover rounded mb-2"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
                  }}
                  style={{ display: 'block', width: '100%', height: '112px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    background: '#4f46e5',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    marginBottom: '4px',
                  }}
                >
                  {listing.propertyType}
                </span>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: '4px 0 2px' }}>
                  {listing.title}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 4px' }}>
                  <span>{listing.city}</span>
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px' }}>
                  {listing.surface} m² · {listing.rooms} ch.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '15px' }}>
                    {listing.price.toLocaleString('fr-FR')}€
                    <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '12px' }}>/mois</span>
                  </span>
                  <a
                    href={`/listings/${listing.id}`}
                    style={{
                      background: '#4f46e5',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Voir
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

