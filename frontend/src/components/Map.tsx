import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../api';
import { AMAZON_LOCATION_API_KEY, AMAZON_LOCATION_MAP_STYLE, AWS_REGION } from '../config';
import type { Coordinates, RuntimeConfig, TripAnalysis } from '../types';
import './Map.css';

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, string | number>;
    geometry: { type: 'LineString' | 'Point'; coordinates: number[] | number[][] };
  }>;
};

function lineCollection(trips: TripAnalysis[], which: 'original' | 'recommended'): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: trips
      .filter((trip) => trip[which].geometry.length >= 2)
      .map((trip) => ({
        type: 'Feature',
        properties: { tripId: trip.tripId },
        geometry: {
          type: 'LineString',
          coordinates: trip[which].geometry.map((point) => [point.lon, point.lat]),
        },
      })),
  };
}

function sampleCollection(trips: TripAnalysis[]): FeatureCollection {
  const features: FeatureCollection['features'] = [];
  for (const trip of trips) {
    for (const sample of trip.recommended.environmentSamples || []) {
      features.push({
        type: 'Feature',
        properties: { pm25: sample.environment.pm25, tripId: trip.tripId },
        geometry: { type: 'Point', coordinates: [sample.position.lon, sample.position.lat] },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

function endpointCollection(trips: TripAnalysis[]): FeatureCollection {
  const features: FeatureCollection['features'] = [];
  for (const trip of trips) {
    const geometry = trip.recommended.geometry.length ? trip.recommended.geometry : trip.original.geometry;
    const start = geometry[0];
    const end = geometry.at(-1);
    if (start) {
      features.push({
        type: 'Feature',
        properties: { kind: 'start', tripId: trip.tripId },
        geometry: { type: 'Point', coordinates: [start.lon, start.lat] },
      });
    }
    if (end) {
      features.push({
        type: 'Feature',
        properties: { kind: 'end', tripId: trip.tripId },
        geometry: { type: 'Point', coordinates: [end.lon, end.lat] },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

function allPoints(trips: TripAnalysis[]) {
  return trips.flatMap((trip) => [...trip.original.geometry, ...trip.recommended.geometry]);
}

function styleUrl(config: RuntimeConfig) {
  const params = new URLSearchParams({
    key: config.mapApiKey || '',
    'color-scheme': 'Light',
    traffic: 'All',
    'poi-density': 'Sparse',
    'travel-modes': 'Transit',
  });
  return `https://maps.geo.${config.region}.amazonaws.com/v2/styles/${config.mapStyle}/descriptor?${params.toString()}`;
}

function setSource(map: MapLibreMap, id: string, data: FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data as any);
}

function fitToTrips(map: MapLibreMap, trips: TripAnalysis[], animate: boolean) {
  const points = allPoints(trips);
  if (!points.length) return;

  if (points.length === 1) {
    map.easeTo({ center: [points[0].lon, points[0].lat], zoom: 14, duration: animate ? 350 : 0 });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  for (const point of points) bounds.extend([point.lon, point.lat]);
  map.fitBounds(bounds as LngLatBoundsLike, {
    padding: { top: 54, right: 54, bottom: 54, left: 54 },
    maxZoom: 15,
    duration: animate ? 450 : 0,
  });
}

function installLayers(map: MapLibreMap, trips: TripAnalysis[]) {
  map.addSource('current-routes', { type: 'geojson', data: lineCollection(trips, 'original') as any });
  map.addSource('recommended-routes', { type: 'geojson', data: lineCollection(trips, 'recommended') as any });
  map.addSource('pollution-samples', { type: 'geojson', data: sampleCollection(trips) as any });
  map.addSource('route-endpoints', { type: 'geojson', data: endpointCollection(trips) as any });

  map.addLayer({
    id: 'current-routes-line',
    type: 'line',
    source: 'current-routes',
    paint: { 'line-color': '#7f8782', 'line-width': 4, 'line-opacity': .68 },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });

  map.addLayer({
    id: 'recommended-routes-line',
    type: 'line',
    source: 'recommended-routes',
    paint: { 'line-color': '#0f8a57', 'line-width': 6, 'line-opacity': .96 },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });

  map.addLayer({
    id: 'pollution-samples-layer',
    type: 'circle',
    source: 'pollution-samples',
    paint: {
      'circle-radius': 6,
      'circle-color': ['step', ['get', 'pm25'], '#0f8a57', 60, '#d6a620', 120, '#dc7628', 180, '#b83b38'] as any,
      'circle-opacity': .82,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
    },
  });

  map.addLayer({
    id: 'route-endpoints-layer',
    type: 'circle',
    source: 'route-endpoints',
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['==', ['get', 'kind'], 'end'], '#0f8a57', '#202823'] as any,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
}

async function runtimeConfig(): Promise<RuntimeConfig> {
  if (AMAZON_LOCATION_API_KEY) {
    return {
      region: AWS_REGION || 'ap-south-1',
      mapStyle: AMAZON_LOCATION_MAP_STYLE,
      mapApiKey: AMAZON_LOCATION_API_KEY,
      source: 'build-time Amazon Location configuration',
    };
  }
  return api.runtimeConfig();
}

export function Map({ trips, isDemo = false }: { trips: TripAnalysis[]; isDemo?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const tripsRef = useRef(trips);
  const [status, setStatus] = useState<'loading' | 'live' | 'fallback'>('loading');

  tripsRef.current = trips;

  useEffect(() => {
    let active = true;

    if (!containerRef.current || !maplibregl.supported()) {
      setStatus('fallback');
      return;
    }

    void runtimeConfig().then((config) => {
      if (!active || !containerRef.current || !config.mapApiKey) {
        if (active) setStatus('fallback');
        return;
      }

      const first = allPoints(tripsRef.current)[0];
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl(config),
        center: first ? [first.lon, first.lat] : [77.209, 28.6139],
        zoom: first ? 11 : 5,
        attributionControl: true,
        validateStyle: false,
        cooperativeGestures: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

      let loaded = false;
      map.once('load', () => {
        if (!active) return;
        loaded = true;
        installLayers(map, tripsRef.current);
        fitToTrips(map, tripsRef.current, false);
        requestAnimationFrame(() => map.resize());
        setStatus('live');
      });

      map.on('error', () => {
        if (!loaded && active) {
          map.remove();
          mapRef.current = null;
          setStatus('fallback');
        }
      });
    }).catch(() => {
      if (active) setStatus('fallback');
    });

    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'live') return;
    setSource(map, 'current-routes', lineCollection(trips, 'original'));
    setSource(map, 'recommended-routes', lineCollection(trips, 'recommended'));
    setSource(map, 'pollution-samples', sampleCollection(trips));
    setSource(map, 'route-endpoints', endpointCollection(trips));
    fitToTrips(map, trips, true);
  }, [trips, status]);

  return <div className="aws-map-shell">
    <div ref={containerRef} className={`aws-live-map ${status === 'fallback' ? 'hidden' : ''}`} aria-label="Interactive Amazon Location live traffic map"/>
    {status === 'fallback' && <MapFallback trips={trips}/>}
    {status === 'loading' && <div className="map-loading">Loading Amazon Location map…</div>}
    <div className={`map-live-badge ${status === 'fallback' ? 'fallback' : ''}`}>
      {status === 'live' ? (isDemo ? 'AWS LIVE MAP · DEMO ROUTES' : 'AWS LIVE TRAFFIC') : 'ROUTE GEOMETRY FALLBACK'}
    </div>
    <div className="map-route-legend">
      <span><i className="map-line current"/>Current</span>
      <span><i className="map-line recommended"/>Recommended</span>
      <span><i className="map-dot"/>PM2.5 samples</span>
    </div>
  </div>;
}

function MapFallback({ trips }: { trips: TripAnalysis[] }) {
  const points = allPoints(trips);
  const project = useMemo(() => projector(points), [trips]);
  return <svg className="map-fallback" viewBox="0 0 720 520" role="img" aria-label="Verified route geometry fallback">
    <defs>
      <pattern id="fallback-grid" width="38" height="38" patternUnits="userSpaceOnUse">
        <path d="M38 0H0V38" fill="none" stroke="currentColor" strokeOpacity=".07"/>
      </pattern>
    </defs>
    <rect width="720" height="520" fill="url(#fallback-grid)"/>
    {trips.map((trip) => <g key={trip.tripId}>
      <path d={svgPath(trip.original.geometry, project)} className="fallback-route current"/>
      <path d={svgPath(trip.recommended.geometry, project)} className="fallback-route recommended"/>
      {trip.recommended.environmentSamples.map((sample, index) => {
        const point = project(sample.position);
        return <circle key={index} cx={point.x} cy={point.y} r="7" className="fallback-sample"/>;
      })}
    </g>)}
  </svg>;
}

function projector(points: Coordinates[]) {
  if (!points.length) return (_point: Coordinates) => ({ x: 70, y: 450 });
  const lons = points.map((point) => point.lon);
  const lats = points.map((point) => point.lat);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const dx = maxLon - minLon || 1;
  const dy = maxLat - minLat || 1;
  return (point: Coordinates) => ({
    x: 55 + ((point.lon - minLon) / dx) * 610,
    y: 465 - ((point.lat - minLat) / dy) * 410,
  });
}

function svgPath(points: Coordinates[], project: (point: Coordinates) => { x: number; y: number }) {
  return points.map((point, index) => {
    const p = project(point);
    return `${index ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
}
