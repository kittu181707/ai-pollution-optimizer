import { Bike, BusFront, CarFront, Footprints, TrainFront } from 'lucide-react';
import type { TransportMode } from '../types';

export function ModeIcon({ mode, size = 18 }: { mode: TransportMode; size?: number }) {
  if (mode === 'bike') return <Bike size={size}/>;
  if (mode === 'bus') return <BusFront size={size}/>;
  if (mode === 'metro') return <TrainFront size={size}/>;
  if (mode === 'walk') return <Footprints size={size}/>;
  return <CarFront size={size}/>;
}
