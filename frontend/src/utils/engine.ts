import type { TripOption, Preference } from '../types';

interface Weights {
  exposure: number;
  emissions: number;
  time: number;
}

const PREFERENCE_WEIGHTS: Record<Preference, Weights> = {
  low_exposure: { exposure: 0.7, emissions: 0.2, time: 0.1 },
  low_emission: { exposure: 0.2, emissions: 0.7, time: 0.1 },
  fastest: { exposure: 0.1, emissions: 0.1, time: 0.8 },
  balanced: { exposure: 0.45, emissions: 0.35, time: 0.2 },
};

/**
 * Optimizes a list of trip options based on the user's preference.
 * The recommendation is generated deterministically.
 */
export function optimizeTrips(options: TripOption[], preference: Preference): TripOption {
  if (options.length === 0) throw new Error("No options provided");
  if (options.length === 1) return options[0];

  const weights = PREFERENCE_WEIGHTS[preference];

  // Find max values for normalization
  const maxExposure = Math.max(...options.map(o => o.exposureScore)) || 1;
  const maxEmissions = Math.max(...options.map(o => o.estimatedCO2eKg)) || 1;
  const maxTime = Math.max(...options.map(o => o.travelTimeMinutes)) || 1;

  let bestOption = options[0];
  let bestScore = Infinity; // Lower score is better

  for (const option of options) {
    const normExposure = option.exposureScore / maxExposure;
    const normEmissions = option.estimatedCO2eKg / maxEmissions;
    const normTime = option.travelTimeMinutes / maxTime;

    const finalScore = 
      (weights.exposure * normExposure) +
      (weights.emissions * normEmissions) +
      (weights.time * normTime);

    // Assuming we attach a hidden 'finalScore' for debugging, not required for the type though
    if (finalScore < bestScore) {
      bestScore = finalScore;
      bestOption = option;
    }
  }

  return bestOption;
}

export function getExposureLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
  if (score < 50) return "LOW";
  if (score < 100) return "MEDIUM";
  if (score < 150) return "HIGH";
  return "VERY_HIGH";
}
