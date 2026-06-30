'use client'
import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import Link from 'next/link'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SEVERITY_DOT } from '@/lib/utils'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types'
import type { Complaint } from '@/types'

// Maps each severity to a real hex (CircleMarker needs a literal color string,
// not a Tailwind class) - kept in sync with tailwind.config.js severity scale.
const SEVERITY_HEX: Record<Complaint['severity'], string> = {
  critical: '#EF4444',
  high: '#FB923C',
  medium: '#F59E0B',
  low: '#10B981',
}

const PUNE_CENTER: [number, number] = [18.5204, 73.8567]

export function ComplaintMap({
  complaints,
  height = '480px',
  onSelect,
}: {
  complaints: Complaint[]
  height?: string
  onSelect?: (id: string) => void
}) {
  const [mapKey] = useState(() => Math.random().toString())
  const mapId = `complaint-map-${mapKey}`

  useEffect(() => {
    return () => {
      const container = L.DomUtil.get(mapId)
      if (container) {
        (container as any)._leaflet_id = null
      }
    }
  }, [mapId])

  const center = useMemo<[number, number]>(() => {
    if (complaints.length === 0) return PUNE_CENTER
    const avgLat = complaints.reduce((s, c) => s + c.location.lat, 0) / complaints.length
    const avgLng = complaints.reduce((s, c) => s + c.location.lng, 0) / complaints.length
    return [avgLat, avgLng]
  }, [complaints])

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-border relative z-0">
      <MapContainer id={mapId} key={mapKey} center={center} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {complaints.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.location.lat, c.location.lng]}
            radius={c.severity === 'critical' ? 11 : c.severity === 'high' ? 9 : 7}
            pathOptions={{
              color: SEVERITY_HEX[c.severity],
              fillColor: SEVERITY_HEX[c.severity],
              fillOpacity: 0.75,
              weight: 2,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(c.id) } : undefined}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold text-navy">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {CATEGORY_LABELS[c.category]} · {STATUS_LABELS[c.status]}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{c.location.address}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                  <span className={`inline-block h-2 w-2 rounded-full ${SEVERITY_DOT[c.severity]}`} />
                  {c.upvotes} upvotes
                </div>
                <Link
                  href={`/citizen/complaints/${c.id}`}
                  className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
