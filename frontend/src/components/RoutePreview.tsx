import type { Coordinates, TripAnalysis } from '../types';

function normalize(points: Coordinates[]) {
  if (!points.length) return [];
  const xs = points.map((p) => p.lon), ys = points.map((p) => p.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const dx = maxX - minX || 1, dy = maxY - minY || 1;
  return points.map((p) => ({ x: 16 + ((p.lon - minX) / dx) * 268, y: 164 - ((p.lat - minY) / dy) * 136 }));
}

function path(points: Coordinates[]) {
  return normalize(points).map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export function RoutePreview({ trip }: { trip: TripAnalysis }) {
  const original = path(trip.original.geometry);
  const optimized = path(trip.recommended.geometry);
  return <div className="route-preview">
    <svg viewBox="0 0 300 180" role="img" aria-label="Original and optimized route geometry">
      <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeOpacity=".07"/></pattern></defs>
      <rect width="300" height="180" fill="url(#grid)"/>
      {original && <path className="route original" d={original}/>} {optimized && <path className="route optimized" d={optimized}/>} 
      <circle cx="16" cy="164" r="5" className="route-dot"/><circle cx="284" cy="28" r="5" className="route-dot"/>
    </svg>
    <div className="route-legend"><span><i className="line original"/>Original</span><span><i className="line optimized"/>Recommended</span></div>
  </div>;
}
