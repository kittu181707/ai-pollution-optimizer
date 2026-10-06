import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { TripAnalysis, Coordinates } from '../types';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapBounds({ trips }: { trips: TripAnalysis[] }) {
  const map = useMap();
  useEffect(() => {
    if (trips.length === 0) return;
    const bounds = L.latLngBounds([]);
    trips.forEach(trip => {
      trip.original.geometry.forEach(pt => bounds.extend([pt.lat, pt.lon]));
      trip.recommended.geometry.forEach(pt => bounds.extend([pt.lat, pt.lon]));
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trips, map]);
  return null;
}

export function Map({ trips }: { trips: TripAnalysis[] }) {
  const center: [number, number] = trips.length && trips[0].original.geometry.length > 0
    ? [trips[0].original.geometry[0].lat, trips[0].original.geometry[0].lon]
    : [28.6139, 77.2090]; // Default Delhi

  const getPollutionColor = (pm25: number) => {
    if (pm25 > 150) return '#b53a37'; // Hazardous / Red
    if (pm25 > 60) return '#d47c24';  // Poor / Orange
    if (pm25 > 30) return '#d4b724';  // Moderate / Yellow
    return '#157f55';                 // Good / Green
  };

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 1 }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <MapBounds trips={trips} />
      
      {trips.map((trip) => {
        const env = trip.recommended.environment;
        const startPt = trip.recommended.geometry[0];
        const color = getPollutionColor(env.pm25);

        return (
          <React.Fragment key={trip.tripId}>
            {/* Original Route (Gray, dashed-like if possible, or just lighter) */}
            <Polyline 
              positions={trip.original.geometry.map(p => [p.lat, p.lon])} 
              pathOptions={{ color: '#a49f9b', weight: 4, opacity: 0.6 }} 
            />
            
            {/* Recommended Route (Green) */}
            <Polyline 
              positions={trip.recommended.geometry.map(p => [p.lat, p.lon])} 
              pathOptions={{ color: '#157f55', weight: 5, opacity: 0.9 }} 
            />

            {/* Pollution Heat Spot at Origin */}
            {startPt && (
              <Circle
                center={[startPt.lat, startPt.lon]}
                radius={800} // 800 meters
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.25,
                  stroke: false
                }}
              >
                <Popup>
                  <strong>{trip.origin}</strong><br/>
                  PM2.5: {env.pm25} µg/m³<br/>
                  PM10: {env.pm10} µg/m³<br/>
                  AQI: {env.aqi}<br/>
                  <small>Estimated environmental conditions</small>
                </Popup>
              </Circle>
            )}

            {/* Destination Marker */}
            {trip.recommended.geometry.length > 0 && (
              <Marker position={[trip.recommended.geometry[trip.recommended.geometry.length - 1].lat, trip.recommended.geometry[trip.recommended.geometry.length - 1].lon]}>
                <Popup>{trip.destination}</Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
