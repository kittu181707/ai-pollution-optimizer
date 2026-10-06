import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

type TransportMode = 'car' | 'bus' | 'metro_walk' | 'walk' | 'cycle';
type Preference = 'fastest' | 'low_emission' | 'low_exposure' | 'balanced';

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

// Polyline decoder for OSRM
function decodePolyline(str: string, precision: number = 5) {
  let index = 0,
      lat = 0,
      lng = 0,
      coordinates = [],
      shift = 0,
      result = 0,
      byte = null,
      latitude_change,
      longitude_change,
      factor = Math.pow(10, precision);

  while (index < str.length) {
      byte = null;
      shift = 0;
      result = 0;
      do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
      } while (byte >= 0x20);
      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      shift = result = 0;
      do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
      } while (byte >= 0x20);
      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += latitude_change;
      lng += longitude_change;
      coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const request = JSON.parse(event.body);
    const { originCoords, destinationCoords, originalMode, preference } = request;

    if (!originCoords || !destinationCoords || !originalMode || !preference) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields (originCoords, destinationCoords, originalMode, preference)" }) };
    }

    const DEMO_MODE = process.env.DEMO_MODE === 'true';

    // 1. Fetch real pollution data (Midpoint or origin for now, ideally along the route)
    // To keep API calls low for MVP, we'll fetch pollution at origin and destination and average it.
    let basePm25 = 150; 
    let isLiveEnvironment = false;
    
    if (!DEMO_MODE) {
      try {
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${originCoords.lat}&longitude=${originCoords.lon}&current=pm10,pm2_5`;
        const aqRes = await axios.get(aqUrl);
        basePm25 = aqRes.data.current?.pm2_5 || 150;
        isLiveEnvironment = true;
      } catch (e) {
        console.error("AQ fetch failed, using fallback PM2.5");
      }
    }

    // 2. Fetch Routes from OSRM
    // OSRM expects: {longitude},{latitude};{longitude},{latitude}
    const coordString = `${originCoords.lon},${originCoords.lat};${destinationCoords.lon},${destinationCoords.lat}`;
    
    const fetchOsrm = async (profile: string) => {
      if (DEMO_MODE) throw new Error("Forcing demo mode");
      const url = `http://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full`;
      const res = await axios.get(url);
      if (res.data.routes && res.data.routes.length > 0) {
        const route = res.data.routes[0];
        return {
          distanceKm: route.distance / 1000,
          travelTimeMinutes: Math.round(route.duration / 60),
          geometry: decodePolyline(route.geometry),
          isRealRoute: true
        };
      }
      throw new Error("No route");
    };

    // Helper for fallback/demo routes
    const getFallbackRoute = (multiplier: number, speedKmh: number) => {
      // Rough distance between lat/lons (haversine)
      const R = 6371; // Radius of the earth in km
      const dLat = (destinationCoords.lat - originCoords.lat) * (Math.PI/180);
      const dLon = (destinationCoords.lon - originCoords.lon) * (Math.PI/180); 
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(originCoords.lat * (Math.PI/180)) * Math.cos(destinationCoords.lat * (Math.PI/180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      let d = R * c; // Distance in km
      if (d < 1) d = 5; // minimum fallback

      const dist = d * multiplier;
      return {
        distanceKm: dist,
        travelTimeMinutes: Math.round((dist / speedKmh) * 60),
        geometry: [[originCoords.lat, originCoords.lon], [destinationCoords.lat, destinationCoords.lon]],
        isRealRoute: false
      };
    };

    // Modes to fetch: car(driving), walk(walking), cycle(cycling)
    let carRoute, walkRoute, cycleRoute;
    
    try {
      carRoute = await fetchOsrm('driving');
    } catch { carRoute = getFallbackRoute(1.2, 30); }
    
    try {
      walkRoute = await fetchOsrm('walking');
    } catch { walkRoute = getFallbackRoute(1.1, 5); }

    try {
      cycleRoute = await fetchOsrm('cycling');
    } catch { cycleRoute = getFallbackRoute(1.1, 15); }

    // Transit is always estimated for MVP since OSRM doesn't support it
    const busRoute = {
      distanceKm: carRoute.distanceKm,
      travelTimeMinutes: Math.round(carRoute.travelTimeMinutes * 1.3),
      geometry: carRoute.geometry,
      isRealRoute: false
    };

    const metroRoute = {
      distanceKm: carRoute.distanceKm * 1.1,
      travelTimeMinutes: Math.round(carRoute.travelTimeMinutes * 1.1), // Metro is usually comparable or slightly slower due to walk
      geometry: [[originCoords.lat, originCoords.lon], [destinationCoords.lat, destinationCoords.lon]],
      isRealRoute: false
    };

    // Construct Options
    const rawOptions = [
      { id: 'opt-car', mode: 'car' as TransportMode, name: 'Car', route: carRoute },
      { id: 'opt-walk', mode: 'walk' as TransportMode, name: 'Walk', route: walkRoute },
      { id: 'opt-cycle', mode: 'cycle' as TransportMode, name: 'Cycle', route: cycleRoute },
      { id: 'opt-bus', mode: 'bus' as TransportMode, name: 'Bus (Estimated)', route: busRoute },
      { id: 'opt-metro', mode: 'metro_walk' as TransportMode, name: 'Metro + Walk (Estimated)', route: metroRoute }
    ];

    const options = rawOptions.map(opt => {
      const estimatedCO2eKg = opt.route.distanceKm * EMISSION_FACTORS[opt.mode];
      const exposureScore = basePm25 * (opt.route.travelTimeMinutes / 60) * EXPOSURE_FACTORS[opt.mode];
      
      return {
        id: opt.id,
        mode: opt.mode,
        name: opt.name,
        travelTimeMinutes: opt.route.travelTimeMinutes,
        distanceKm: parseFloat(opt.route.distanceKm.toFixed(2)),
        exposureScore: parseFloat(exposureScore.toFixed(1)),
        exposureLevel: getExposureLevel(exposureScore),
        estimatedCO2eKg: parseFloat(estimatedCO2eKg.toFixed(2)),
        geometry: opt.route.geometry,
        isRealRoute: opt.route.isRealRoute,
        averagePM25: basePm25 // Passed for UI
      };
    });

    const originalTrip = options.find(o => o.mode === originalMode) || options[0];

    // Optimization Logic
    const PREFERENCE_WEIGHTS: Record<Preference, { exposure: number, emissions: number, time: number }> = {
      low_exposure: { exposure: 0.7, emissions: 0.2, time: 0.1 },
      low_emission: { exposure: 0.2, emissions: 0.7, time: 0.1 },
      fastest: { exposure: 0.1, emissions: 0.1, time: 0.8 },
      balanced: { exposure: 0.45, emissions: 0.35, time: 0.2 },
    };

    const weights = PREFERENCE_WEIGHTS[preference as Preference];
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

    const timeDiff = bestOption.travelTimeMinutes - originalTrip.travelTimeMinutes;
    const co2eDiff = originalTrip.estimatedCO2eKg - bestOption.estimatedCO2eKg;
    const exposureDiff = originalTrip.exposureScore > 0 
      ? ((originalTrip.exposureScore - bestOption.exposureScore) / originalTrip.exposureScore) * 100
      : 0;

    let explanation = `${bestOption.name} is recommended because `;
    if (co2eDiff > 0 && exposureDiff > 0) {
      explanation += `it reduces your estimated exposure by ${Math.round(exposureDiff)}% and avoids ${co2eDiff.toFixed(2)} kg of CO2e.`;
    } else if (timeDiff < 0) {
      explanation += `it is ${Math.abs(timeDiff)} minutes faster while balancing other factors.`;
    } else {
      explanation += `it matches your ${preference.replace('_', ' ')} preference best.`;
    }

    const responseBody = {
      originalTrip,
      alternatives: options.filter(o => o.id !== bestOption.id),
      recommendation: bestOption,
      estimatedSavings: {
        timeDifferenceMinutes: timeDiff,
        co2eAvoidedKg: parseFloat(co2eDiff.toFixed(2)),
        exposureReductionPercent: Math.round(exposureDiff)
      },
      explanation,
      isLiveEnvironment
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(responseBody),
    };
  } catch (err: any) {
    console.error('Optimize API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Internal server error", error: err?.message })
    };
  }
};
