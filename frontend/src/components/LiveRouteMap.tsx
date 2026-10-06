import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Coordinates, TripAnalysis } from '../types';
import './LiveRouteMap.css';

function styleUrl(mapApiKey: string, region: string, mapStyle: string) {
  const params = new URLSearchParams({
    key: mapApiKey,
    'color-scheme': 'Light',
    traffic: 'All',
    'poi-density': 'Sparse',
    'travel-modes': 'Transit',
  });
  return `https://maps.geo.${region}.amazonaws.com/v2/styles/${mapStyle}/descriptor?${params.toString()}`;
}

function lineFeature(points: Coordinates[]) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.lon, point.lat]),
    },
  } as const;
}

function sampleCollection(trip: TripAnalysis) {
  const samples = [
    ...trip.original.environmentSamples.map((sample) => ({ ...sample, kind: 'current' as const })),
    ...trip.recommended.environmentSamples.map((sample) => ({ ...sample, kind: 'recommended' as const })),
  ];

  return {
    type: 'FeatureCollection',
    features: samples.map((sample) => ({
      type: 'Feature',
      properties: { pm25: sample.environment.pm25, kind: sample.kind },
      geometry: { type: 'Point', coordinates: [sample.position.lon, sample.position.lat] },
    })),
  } as const;
}

function endpointCollection(trip: TripAnalysis) {
  const geometry = trip.recommended.geometry.length ? trip.recommended.geometry : trip.original.geometry;
  const start = geometry[0];
  const end = geometry.at(-1);
  return {
    type: 'FeatureCollection',
    features: [
      start && {
        type: 'Feature',
        properties: { kind: 'start' },
        geometry: { type: 'Point', coordinates: [start.lon, start.lat] },
      },
      end && {
        type: 'Feature',
        properties: { kind: 'end' },
        geometry: { type: 'Point', coordinates: [end.lon, end.lat] },
      },
    ].filter(Boolean),
  } as const;
}

function routePoints(trip: TripAnalysis) {
  return [...trip.original.geometry, ...trip.recommended.geometry];
}

function syncTrip(map: maplibregl.Map, trip: TripAnalysis, animate = true) {
  const currentSource = map.getSource('clearroute-current') as maplibregl.GeoJSONSource | undefined;
  const recommendedSource = map.getSource('clearroute-recommended') as maplibregl.GeoJSONSource | undefined;
  const samplesSource = map.getSource('clearroute-samples') as maplibregl.GeoJSONSource | undefined;
  const endpointsSource = map.getSource('clearroute-endpoints') as maplibregl.GeoJSONSource | undefined;

  currentSource?.setData(lineFeature(trip.original.geometry));
  recommendedSource?.setData(lineFeature(trip.recommended.geometry));
  samplesSource?.setData(sampleCollection(trip));
  endpointsSource?.setData(endpointCollection(trip));

  const points = routePoints(trip);
  if (!points.length) return;

  if (points.length === 1) {
    map.easeTo({ center: [points[0].lon, points[0].lat], zoom: 14, duration: animate ? 350 : 0 });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  for (const point of points) bounds.extend([point.lon, point.lat]);
  map.fitBounds(bounds, {
    padding: { top: 54, right: 54, bottom: 54, left: 54 },
    maxZoom: 15,
    duration: animate ? 450 : 0,
  });
}

function installLayers(map: maplibregl.Map, trip: TripAnalysis) {
  map.addSource('clearroute-current', { type: 'geojson', data: lineFeature(trip.original.geometry) });
  map.addSource('clearroute-recommended', { type: 'geojson', data: lineFeature(trip.recommended.geometry) });
  map.addSource('clearroute-samples', { type: 'geojson', data: sampleCollection(trip) });
  map.addSource('clearroute-endpoints', { type: 'geojson', data: endpointCollection(trip) });

  map.addLayer({
    id: 'clearroute-current-line',
    type: 'line',
    source: 'clearroute-current',
    paint: {
      'line-color': '#8f9691',
      'line-width': 4,
      'line-opacity': .78,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });

  map.addLayer({
    id: 'clearroute-recommended-line',
    type: 'line',
    source: 'clearroute-recommended',
    paint: {
      'line-color': '#137a50',
      'line-width': 6,
      'line-opacity': .96,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });

  map.addLayer({
    id: 'clearroute-samples-layer',
    type: 'circle',
    source: 'clearroute-samples',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'kind'], 'recommended'], 5, 8],
      'circle-color': ['step', ['get', 'pm25'], '#137a50', 75, '#d47c24', 150, '#b53a37'],
      'circle-opacity': ['case', ['==', ['get', 'kind'], 'recommended'], .92, .30],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['case', ['==', ['get', 'kind'], 'recommended'], 1.5, 0],
    },
  });

  map.addLayer({
    id: 'clearroute-endpoints-layer',
    type: 'circle',
    source: 'clearroute-endpoints',
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['==', ['get', 'kind'], 'end'], '#137a50', '#202823'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
}

export function LiveRouteMap({ trip, mapApiKey, region, mapStyle, onReady, onFailure }: {
  trip: TripAnalysis;
  mapApiKey: string;
  region: string;
  mapStyle: string;
  onReady: (source: string) => void;
  onFailure: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tripRef = useRef(trip);
  const loadedRef = useRef(false);

  tripRef.current = trip;

  useEffect(() => {
    let active = true;
    if (!containerRef.current || !mapApiKey) {
      onFailure();
      return;
    }

    try {
      const first = routePoints(tripRef.current)[0];
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl(mapApiKey, region, mapStyle),
        center: first ? [first.lon, first.lat] : [77.209, 28.6139],
        zoom: first ? 12 : 10,
        attributionControl: true,
        validateStyle: false,
        cooperativeGestures: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

      map.once('load', () => {
        if (!active) return;
        loadedRef.current = true;
        installLayers(map, tripRef.current);
        syncTrip(map, tripRef.current, false);
        requestAnimationFrame(() => map.resize());
        onReady('Amazon Location Maps V2 · live traffic');
      });

      map.on('error', () => {
        if (!loadedRef.current && active) onFailure();
      });
    } catch {
      if (active) onFailure();
    }

    return () => {
      active = false;
      loadedRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapApiKey, region, mapStyle, onFailure, onReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    syncTrip(map, trip, true);
  }, [trip]);

  return <div className="live-route-map-shell">
    <div ref={containerRef} className="live-route-map" aria-label="Interactive Amazon Location route map"/>
    <span className="live-map-badge">LIVE TRAFFIC</span>
  </div>;
}
