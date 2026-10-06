import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Coordinates, RouteEnvironmentSample, TripAnalysis } from '../types';
import './RoutePreview.css';

type Point = { x: number; y: number };

function projector(allPoints: Coordinates[]) {
  if (!allPoints.length) return (_point: Coordinates): Point => ({ x: 20, y: 100 });
  const xs = allPoints.map((point) => point.lon);
  const ys = allPoints.map((point) => point.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  return (point: Coordinates) => ({
    x: 20 + ((point.lon - minX) / dx) * 260,
    y: 160 - ((point.lat - minY) / dy) * 130,
  });
}

function path(points: Coordinates[], project: (point: Coordinates) => Point) {
  return points.map((point, index) => {
    const projected = project(point);
    return `${index ? 'L' : 'M'} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
  }).join(' ');
}

function color(sample: RouteEnvironmentSample) {
  const pm25 = sample.environment.pm25;
  if (pm25 >= 150) return '#b53a37';
  if (pm25 >= 75) return '#d47c24';
  return '#137a50';
}

export function RoutePreview({ planId, trip }: { planId: string; trip: TripAnalysis }) {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapSource, setMapSource] = useState('Route geometry preview');

  useEffect(() => {
    let active = true;
    setMapImage(null);
    void api.routeMap(planId, trip).then((result) => {
      if (!active) return;
      setMapImage(result.imageDataUrl);
      setMapSource(result.source);
    }).catch(() => {
      if (active) setMapSource('Route geometry preview');
    });
    return () => { active = false; };
  }, [planId, trip.tripId, trip.original.candidateId, trip.recommended.candidateId]);

  const fallback = useMemo(() => {
    const all = [...trip.original.geometry, ...trip.recommended.geometry];
    const project = projector(all);
    const original = path(trip.original.geometry, project);
    const optimized = path(trip.recommended.geometry, project);
    const startSource = trip.original.geometry[0] || trip.recommended.geometry[0];
    const endSource = trip.original.geometry.at(-1) || trip.recommended.geometry.at(-1);
    const start = startSource ? project(startSource) : { x: 20, y: 160 };
    const end = endSource ? project(endSource) : { x: 280, y: 30 };
    return { project, original, optimized, start, end };
  }, [trip]);

  const reduction = trip.original.pollutionExposure > 0
    ? Math.max(0, Math.round((1 - trip.recommended.pollutionExposure / trip.original.pollutionExposure) * 100))
    : 0;

  return <div className="route-preview">
    <div className="route-map-stage">
      {mapImage ? <img src={mapImage} alt="Amazon Location map comparing current and recommended routes with exposure sample hotspots"/> :
        <svg viewBox="0 0 300 180" role="img" aria-label="Current and recommended route geometry with pollution sample hotspots">
          <defs>
            <pattern id={`grid-${trip.tripId}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeOpacity=".055"/>
            </pattern>
          </defs>
          <rect width="300" height="180" fill={`url(#grid-${trip.tripId})`}/>
          {fallback.original && <path className="route original" d={fallback.original}/>}
          {fallback.optimized && <path className="route optimized" d={fallback.optimized}/>}
          {trip.original.environmentSamples.map((sample, index) => {
            const point = fallback.project(sample.position);
            return <circle key={`o-${index}`} cx={point.x} cy={point.y} r="9" fill={color(sample)} opacity=".24"/>;
          })}
          {trip.recommended.environmentSamples.map((sample, index) => {
            const point = fallback.project(sample.position);
            return <circle key={`r-${index}`} cx={point.x} cy={point.y} r="4" fill={color(sample)}/>;
          })}
          <circle cx={fallback.start.x} cy={fallback.start.y} r="5" className="route-dot"/>
          <circle cx={fallback.end.x} cy={fallback.end.y} r="5" className="route-dot end"/>
        </svg>}
    </div>

    <div className="route-compare-grid">
      <div>
        <span>Current</span>
        <strong>{trip.original.pollutionExposure.toFixed(0)}</strong>
        <small>{trip.original.travelMinutes} min · PM2.5 {trip.original.environment.pm25.toFixed(0)}</small>
      </div>
      <div className="recommended">
        <span>Recommended</span>
        <strong>{trip.recommended.pollutionExposure.toFixed(0)}</strong>
        <small>{trip.recommended.travelMinutes} min · {reduction}% lower</small>
      </div>
    </div>

    <div className="route-legend">
      <span><i className="line original"/>Current</span>
      <span><i className="line optimized"/>Recommended</span>
      <span className="map-source">{mapSource}</span>
    </div>
  </div>;
}
