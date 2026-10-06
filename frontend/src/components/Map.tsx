import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { TripOption } from '../types';

// Fix for default Leaflet marker icons not loading in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  origin?: { lat: number; lon: number };
  destination?: { lat: number; lon: number };
  route?: TripOption;
  pollutionData?: any; // To overlay pollution heatmap if possible
}

// Component to recenter map when route changes
function RecenterAutomatically({ geometry, origin, destination }: { geometry?: [number, number][], origin?: any, destination?: any }) {
  const map = useMap();
  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin && destination) {
      const bounds = L.latLngBounds([[origin.lat, origin.lon], [destination.lat, destination.lon]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.setView([origin.lat, origin.lon], 13);
    }
  }, [geometry, origin, destination, map]);
  return null;
}

export const Map: React.FC<MapProps> = ({ origin, destination, route, pollutionData }) => {
  const center = origin ? [origin.lat, origin.lon] as [number, number] : [28.6139, 77.2090] as [number, number]; // Delhi default

  // We can draw a simple circle to represent the pollution 'heat' at the origin/destination for MVP
  const getPollutionColor = (pm25: number) => {
    if (pm25 < 50) return 'green';
    if (pm25 < 100) return 'yellow';
    if (pm25 < 150) return 'orange';
    if (pm25 < 250) return 'red';
    return 'purple';
  };

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterAutomatically geometry={route?.geometry} origin={origin} destination={destination} />

        {origin && (
          <Marker position={[origin.lat, origin.lon]}>
            <Popup>Origin</Popup>
          </Marker>
        )}
        
        {destination && (
          <Marker position={[destination.lat, destination.lon]}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {route?.geometry && (
          <Polyline positions={route.geometry} color="#3b82f6" weight={5} opacity={0.7}>
             <Popup>
               {route.name} <br/> 
               {route.distanceKm} km <br/>
               {route.travelTimeMinutes} min
             </Popup>
          </Polyline>
        )}

        {pollutionData && origin && (
           <Circle 
             center={[origin.lat, origin.lon]} 
             radius={1500}
             pathOptions={{ color: getPollutionColor(pollutionData.pm25), fillColor: getPollutionColor(pollutionData.pm25), fillOpacity: 0.2 }}
           >
             <Popup>PM2.5: {pollutionData.pm25} ({pollutionData.source})</Popup>
           </Circle>
        )}
      </MapContainer>
    </div>
  );
};
