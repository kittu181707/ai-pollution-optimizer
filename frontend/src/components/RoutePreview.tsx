import type { Coordinates, TripAnalysis } from '../types';

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

export function RoutePreview({ trip }: { trip: TripAnalysis }) {
  const all = [...trip.original.geometry, ...trip.recommended.geometry];
  const project = projector(all);
  const original = path(trip.original.geometry, project);
  const optimized = path(trip.recommended.geometry, project);
  const startSource = trip.original.geometry[0] || trip.recommended.geometry[0];
  const endSource = trip.original.geometry.at(-1) || trip.recommended.geometry.at(-1);
  const start = startSource ? project(startSource) : { x: 20, y: 160 };
  const end = endSource ? project(endSource) : { x: 280, y: 30 };

  return <div className="route-preview">
    <svg viewBox="0 0 300 180" role="img" aria-label="Original and recommended route geometry">
      <defs>
        <pattern id={`grid-${trip.tripId}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeOpacity=".055"/>
        </pattern>
      </defs>
      <rect width="300" height="180" fill={`url(#grid-${trip.tripId})`}/>
      {original && <path className="route original" d={original}/>}
      {optimized && <path className="route optimized" d={optimized}/>}
      <circle cx={start.x} cy={start.y} r="5" className="route-dot"/>
      <circle cx={end.x} cy={end.y} r="5" className="route-dot end"/>
    </svg>
    <div className="route-legend">
      <span><i className="line original"/>Current</span>
      <span><i className="line optimized"/>Recommended</span>
    </div>
  </div>;
}
