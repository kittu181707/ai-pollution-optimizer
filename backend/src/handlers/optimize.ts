import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

type TransportMode = 'car' | 'bus' | 'metro_walk' | 'walk' | 'cycle';
type Preference = 'fastest' | 'low_emission' | 'low_exposure' | 'balanced';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const request = JSON.parse(event.body);
    const { origin, destination, departureTime, transportMode, preference } = request;

    if (!origin || !destination || !transportMode || !preference) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    // Reuse the deterministic optimization logic here in the backend
    // Since this is a Hackathon MVP, we generate options and pick the best deterministically

    const options = getDemoTripOptions(origin, destination, transportMode);
    const originalTrip = options.find(o => o.id === 'opt-original');
    
    if (!originalTrip) {
      return { statusCode: 500, body: JSON.stringify({ message: "Internal error: Original trip missing" }) };
    }

    const recommendation = optimizeTrips(options, preference);

    const timeDiff = recommendation.travelTimeMinutes - originalTrip.travelTimeMinutes;
    const co2eDiff = originalTrip.estimatedCO2eKg - recommendation.estimatedCO2eKg;
    const exposureDiff = originalTrip.exposureScore > 0 
      ? ((originalTrip.exposureScore - recommendation.exposureScore) / originalTrip.exposureScore) * 100
      : 0;

    const responseBody = {
      originalTrip,
      alternatives: options.filter(o => o.id !== recommendation.id),
      recommendation,
      estimatedSavings: {
        timeDifferenceMinutes: timeDiff,
        co2eAvoidedKg: parseFloat(co2eDiff.toFixed(2)),
        exposureReductionPercent: Math.round(exposureDiff)
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(responseBody),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};

// ============================================
// Internal logic (Duplicate for simplicity in MVP)
// ============================================

export const EMISSION_FACTORS: Record<string, number> = {
  car: 0.2,
  bus: 0.05,
  metro_walk: 0.02,
  walk: 0,
  cycle: 0
};

export const EXPOSURE_FACTORS: Record<string, number> = {
  walk: 1.0,
  cycle: 1.2,
  bus: 0.8,
  car: 0.4,
  metro_walk: 0.2
};

const getExposureLevel = (score: number) => {
  if (score < 50) return "LOW";
  if (score < 100) return "MEDIUM";
  if (score < 150) return "HIGH";
  return "VERY_HIGH";
};

const generateOption = (
  id: string,
  mode: TransportMode,
  name: string,
  distanceKm: number,
  travelTimeMinutes: number,
  basePollution: number = 150
) => {
  const estimatedCO2eKg = distanceKm * EMISSION_FACTORS[mode];
  const exposureScore = basePollution * (travelTimeMinutes / 60) * EXPOSURE_FACTORS[mode];
  return {
    id,
    mode,
    name,
    travelTimeMinutes,
    exposureScore,
    exposureLevel: getExposureLevel(exposureScore),
    estimatedCO2eKg: parseFloat(estimatedCO2eKg.toFixed(2))
  };
};

const getDemoTripOptions = (_origin: string, _destination: string, originalMode: TransportMode) => {
  const distanceKm = 15;
  const options: any[] = [];

  const originalTime = originalMode === 'car' ? 45 : originalMode === 'bus' ? 55 : originalMode === 'metro_walk' ? 50 : 120;
  options.push(generateOption('opt-original', originalMode, `${originalMode.toUpperCase()} - Original`, distanceKm, originalTime));

  if (originalMode !== 'metro_walk') {
    options.push(generateOption('opt-metro', 'metro_walk', 'Metro + Walk', distanceKm * 1.1, 52));
  }
  if (originalMode !== 'bus') {
    options.push(generateOption('opt-bus', 'bus', 'Bus', distanceKm, 55));
  }
  if (originalMode === 'car') {
    options.push(generateOption('opt-car-b', 'car', 'Car - Route B (Less Traffic)', distanceKm * 1.2, 48, 135));
  }

  return options;
};

const optimizeTrips = (options: any[], preference: Preference) => {
  if (options.length === 0) throw new Error("No options provided");
  if (options.length === 1) return options[0];

  const PREFERENCE_WEIGHTS: Record<Preference, { exposure: number, emissions: number, time: number }> = {
    low_exposure: { exposure: 0.7, emissions: 0.2, time: 0.1 },
    low_emission: { exposure: 0.2, emissions: 0.7, time: 0.1 },
    fastest: { exposure: 0.1, emissions: 0.1, time: 0.8 },
    balanced: { exposure: 0.45, emissions: 0.35, time: 0.2 },
  };

  const weights = PREFERENCE_WEIGHTS[preference];
  const maxExposure = Math.max(...options.map(o => o.exposureScore)) || 1;
  const maxEmissions = Math.max(...options.map(o => o.estimatedCO2eKg)) || 1;
  const maxTime = Math.max(...options.map(o => o.travelTimeMinutes)) || 1;

  let bestOption = options[0];
  let bestScore = Infinity;

  for (const option of options) {
    const normExposure = option.exposureScore / maxExposure;
    const normEmissions = option.estimatedCO2eKg / maxEmissions;
    const normTime = option.travelTimeMinutes / maxTime;

    const finalScore = (weights.exposure * normExposure) + (weights.emissions * normEmissions) + (weights.time * normTime);
    if (finalScore < bestScore) {
      bestScore = finalScore;
      bestOption = option;
    }
  }

  return bestOption;
};
