import type { TransportMode, TripOption } from '../types';
import { EMISSION_FACTORS, EXPOSURE_FACTORS, DEMO_BASE_POLLUTION_PM25 } from '../config/factors';
import { getExposureLevel } from '../utils/engine';

const generateOption = (
  id: string,
  mode: TransportMode,
  name: string,
  distanceKm: number,
  travelTimeMinutes: number,
  basePollution: number = DEMO_BASE_POLLUTION_PM25
): TripOption => {
  // Estimated CO2e = distance * factor
  const estimatedCO2eKg = distanceKm * EMISSION_FACTORS[mode];
  
  // Exposure Score = basePollution * (travelTime / 60) * exposureFactor
  const exposureScore = basePollution * (travelTimeMinutes / 60) * EXPOSURE_FACTORS[mode];
  const exposureLevel = getExposureLevel(exposureScore);

  return {
    id,
    mode,
    name,
    travelTimeMinutes,
    exposureScore,
    exposureLevel,
    estimatedCO2eKg: parseFloat(estimatedCO2eKg.toFixed(2))
  };
};

export const getDemoTripOptions = (_origin: string, _destination: string, originalMode: TransportMode): TripOption[] => {
  // We use rough heuristics to generate realistic alternatives for demo purposes
  // Assuming a ~15km trip for typical Delhi intra-city if not specified, 
  // but we can just hardcode some generic distances for the MVP logic.
  
  const distanceKm = 15;
  const options: TripOption[] = [];

  // Generate Original
  const originalTime = originalMode === 'car' ? 45 : originalMode === 'bus' ? 55 : originalMode === 'metro_walk' ? 50 : 120;
  options.push(generateOption('opt-original', originalMode, `${originalMode.toUpperCase()} - Original`, distanceKm, originalTime));

  // Generate Alternatives
  if (originalMode !== 'metro_walk') {
    options.push(generateOption('opt-metro', 'metro_walk', 'Metro + Walk', distanceKm * 1.1, 52));
  }
  if (originalMode !== 'bus') {
    options.push(generateOption('opt-bus', 'bus', 'Bus', distanceKm, 55));
  }
  if (originalMode === 'car') {
    options.push(generateOption('opt-car-b', 'car', 'Car - Route B (Less Traffic)', distanceKm * 1.2, 48, DEMO_BASE_POLLUTION_PM25 * 0.9));
  }

  return options;
};
