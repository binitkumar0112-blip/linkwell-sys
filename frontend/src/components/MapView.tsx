import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import '../lib/leafletFix';

interface Issue {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
  urgency?: string;
  category?: string;
  [key: string]: any;
}

interface MapViewProps {
  issues: Issue[];
}

const STATUS_COLORS: Record<string, string> = {
  reported:    '#EF4444',
  verified:    '#F59E0B',
  assigned:    '#A855F7',
  in_progress: '#F97316',
  resolved:    '#22C55E',
};

const createCustomIcon = (status: string, urgency?: string) => {
  const color = STATUS_COLORS[status] || '#6366F1';
  const isUrgent = urgency === 'critical' || urgency === 'high';
  const size = isUrgent ? 36 : 30;

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="${size}px" height="${Math.round(size * 1.25)}px">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)" />
      </filter>
      <ellipse cx="16" cy="38" rx="5" ry="2" fill="rgba(0,0,0,0.15)" />
      <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 26 12 26S28 21 28 12C28 5.37 22.63 0 16 0z"
        fill="${color}" filter="url(#shadow)" />
      <circle cx="16" cy="12" r="5" fill="white" opacity="0.9" />
    </svg>`;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: svgIcon,
    iconSize: [size, Math.round(size * 1.25)],
    iconAnchor: [size / 2, Math.round(size * 1.25)],
    popupAnchor: [0, -Math.round(size * 1.25)],
  });
};

const URGENCY_PILL: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-emerald-100 text-emerald-700',
};

const STATUS_PILL: Record<string, string> = {
  reported:    'bg-blue-100 text-blue-700',
  assigned:    'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved:    'bg-emerald-100 text-emerald-700',
};

export default function MapView({ issues }: MapViewProps) {
  const validIssues = issues.filter(i => i.latitude && i.longitude && !isNaN(i.latitude) && !isNaN(i.longitude));

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[19.07, 72.87]}
        zoom={11}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {validIssues.map((issue) => (
          <Marker
            key={issue.id || Math.random()}
            position={[issue.latitude, issue.longitude]}
            icon={createCustomIcon(issue.status, issue.urgency)}
          >
            <Popup className="custom-popup" maxWidth={240} minWidth={220}>
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                {/* Status + urgency pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {issue.urgency && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 8px', borderRadius: '9999px',
                      background: issue.urgency === 'critical' ? '#FEE2E2' : issue.urgency === 'high' ? '#FFEDD5' : '#FEF9C3',
                      color: issue.urgency === 'critical' ? '#B91C1C' : issue.urgency === 'high' ? '#C2410C' : '#92400E',
                    }}>
                      {issue.urgency}
                    </span>
                  )}
                  <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '2px 8px', borderRadius: '9999px',
                    background: issue.status === 'resolved' ? '#D1FAE5' : issue.status === 'in_progress' ? '#FEF9C3' : '#EDE9FE',
                    color: issue.status === 'resolved' ? '#065F46' : issue.status === 'in_progress' ? '#92400E' : '#5B21B6',
                  }}>
                    {(issue.status || 'reported').replace('_', ' ')}
                  </span>
                </div>

                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px', lineHeight: 1.3 }}>
                  {issue.title}
                </p>

                {issue.category && (
                  <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px', fontWeight: 500 }}>
                    📍 {issue.category}
                  </p>
                )}

                <a href={`/issue/${issue.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', fontWeight: 700, color: '#4F46E5',
                    background: '#EEF2FF', padding: '6px 12px', borderRadius: '8px',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}>
                  View Details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
