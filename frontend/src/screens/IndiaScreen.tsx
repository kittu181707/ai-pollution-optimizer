import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { api } from '../api';

export function IndiaScreen() {
  const center: [number, number] = [20.5937, 78.9629]; // India center

  const [stations, setStations] = useState<Array<{ name: string; lat: number; lon: number; aqi: number; pm25: number; pm10: number; source: string; updated: string }>>([]);

  useEffect(() => {
    api.getIndia().then((res) => setStations(res.stations)).catch(console.error);
  }, []);

  const getColor = (aqi: number) => {
    if (aqi > 150) return '#b53a37';
    if (aqi > 100) return '#d47c24';
    if (aqi > 50) return '#d4b724';
    return '#157f55';
  };

  return (
    <div className="screen wide india-screen">
      <div className="screen-title">
        <p className="eyebrow">NATIONAL OVERVIEW</p>
        <h1>India Environmental Intelligence</h1>
        <p>Actual available environmental observations across India.</p>
      </div>

      <div className="india-map-container" style={{ height: '600px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--line)' }}>
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', background: '#121212' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          {stations.map((s, i) => (
            <Circle
              key={i}
              center={[s.lat, s.lon]}
              radius={80000}
              pathOptions={{
                color: getColor(s.aqi),
                fillColor: getColor(s.aqi),
                fillOpacity: 0.3,
                weight: 1
              }}
            >
              <Popup>
                <div style={{color: '#000'}}>
                  <strong>{s.name}</strong><br/>
                  AQI: {s.aqi}<br/>
                  PM2.5: {s.pm25} µg/m³<br/>
                  PM10: {s.pm10} µg/m³<br/>
                  <small>Source: {s.source} • {s.updated}</small>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
