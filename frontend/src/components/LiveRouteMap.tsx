import { useEffect, useRef } from 'react';
import { AMAZON_LOCATION_API_KEY, AWS_REGION, AMAZON_LOCATION_MAP_STYLE } from '../config';
import type { Coordinates, TripAnalysis } from '../types';
import './LiveRouteMap.css';

const MAPLIBRE_VERSION = '6.12.0';
const SCRIPT_ID = 'clearroute-maplibre-js';
const STYLE_ID = 'clearroute-maplibre-css';

let loader: Promise<any> | null = null;

function loadMapLibre() {
  const existing = (window as any).maplibregl;
  if (existing) return Promise.resolve(existing);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    const finish = () => {
      const maplibre = (window as any).maplibregl;
      if (maplibre) resolve(maplibre);
      else reject(new Error('MapLibre failed to initialize'));
    };

    if ((window as any).maplibregl) finish();
    else {
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('MapLibre failed to load')), { once: true });
    }
  }).catch((error) => {
    loader = null;
    throw error;
  });

  return loader;
}

function styleUrl() {
  const params = new URLSearchParams({
    key: AMAZON_LOCATION_API_KEY,
    'color-scheme': 'Light',
    traffic: 'All',
    'poi-density': 'Sparse',
    'travel-modes': 'Transit',
  });
  return `https://maps.geo.${AWS_REGION}.amazonaws.com/v2/styles/${AMAZON_LOCATION_MAP_STYLE}/descriptor?${params.toString()}`;
}

function lineFeature(points: Coordinates[]) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.lon, point.lat]),
    },
  };
}

function sampleCollection(trip: TripAnalysis) {
  const samples = [
    ...trip.original.environmentSamples.map((sample) => ({ ...sample, kind: 'current' })),
    ...trip.recommended.environmentSamples.map((sample) => ({ ...sample, kind: 'recommended' })),
  ];

  return {
    type: 'FeatureCollection',
    features: samples.map((sample) => ({
      type: 'Feature',
      properties: { pm25: sample.environment.pm25, kind: sample.kind },
      geometry: { type: 'Point', coordinates: [sample.position.lon, sample.position.lat] },
    })),
  };
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
  };
}

function routePoints(trip: TripAnalysis) {
  return [...trip.original.geometry, ...trip.recommended.geometry];
}

function syncTrip(map: any, maplibre: any, trip: TripAnalysis, animate = true) {
  const currentSource = map.getSource('clearroute-current');
  const recommendedSource = map.getSource('clearroute-recommended');
  const samplesSource = map.getSource('clearroute-samples');
  const endpointsSource = map.getSource('clearroute-endpoints');

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

  const bounds = new maplibre.LngLatBounds();
  for (const point of points) bounds.extend([point.lon, point.lat]);
  map.fitBounds(bounds, {
    padding: { top: 54, right: 54, bottom: 54, left: 54 },
    maxZoom: 15,
    duration: animate ? 450 : 0,
  });
}

function installLayers(map: any, trip: TripAnalysis) {
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

export function LiveRouteMap({ trip, onReady, onFailure }: {
  trip: TripAnalysis;
  onReady: (source: string) => void;
  onFailure: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const tripRef = useRef(trip);
  const loadedRef = useRef(false);

  tripRef.current = trip;

  useEffect(() => {
    let active = true;
    if (!containerRef.current || !AMAZON_LOCATION_API_KEY) {
      onFailure();
      return;
    }

    void loadMapLibre().then((maplibre) => {
      if (!active || !containerRef.current) return;
      maplibreRef.current = maplibre;

      const first = routePoints(tripRef.current)[0];
      const map = new maplibre.Map({
        container: containerRef.current,
        style: styleUrl(),
        center: first ? [first.lon, first.lat] : [77.209, 28.6139],
        zoom: first ? 12 : 10,
        attributionControl: true,
        validateStyle: false,
        cooperativeGestures: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

      map.once('load', () => {
        if (!active) return;
        loadedRef.current = true;
        installLayers(map, tripRef.current);
        syncTrip(map, maplibre, tripRef.current, false);
        requestAnimationFrame(() => map.resize());
        onReady('Amazon Location Maps V2 · live traffic');
      });

      map.on('error', () => {
        if (!loadedRef.current && active) onFailure();
      });
    }).catch(() => {
      if (active) onFailure();
    });

    return () => {
      active = false;
      loadedRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onFailure, onReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !maplibre || !loadedRef.current) return;
    syncTrip(map, maplibre, trip, true);
  }, [trip]);

  return <div className="live-route-map-shell">
    <div ref={containerRef} className="live-route-map" aria-label="Interactive Amazon Location route map"/>
    <span className="live-map-badge">LIVE TRAFFIC</span>
  </div>;
}
