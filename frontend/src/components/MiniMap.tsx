import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeocode } from '@/hooks/useGeocode'

// Fix default marker icons
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

function createCityIcon() {
  return L.divIcon({
    html: `
      <div style="
        width:28px;height:28px;
        background:#4f46e5;
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(79,70,229,0.4);
      "></div>
    `,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

interface MiniMapProps {
  city: string
}

export default function MiniMap({ city }: MiniMapProps) {
  const { data: geo, isLoading } = useGeocode(city)

  if (isLoading) {
    return (
      <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
        <span className="text-sm text-gray-400">Chargement de la carte…</span>
      </div>
    )
  }

  if (!geo) {
    return (
      <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
        <span className="text-sm text-gray-400">Carte non disponible pour {city}</span>
      </div>
    )
  }

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[geo.lat, geo.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        className="z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[geo.lat, geo.lng]} icon={createCityIcon()} />
      </MapContainer>
    </div>
  )
}
