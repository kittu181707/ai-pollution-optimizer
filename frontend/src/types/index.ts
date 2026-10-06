export type TransportMode = 'car' | 'bus' | 'metro_walk' | 'walk' | 'cycle';
export type Preference = 'fastest' | 'low_emission' | 'low_exposure' | 'balanced';
export type ExposureLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface TripRequest {
  origin: string;
  originCoords?: { lat: number; lon: number };
  destination: string;
  destinationCoords?: { lat: number; lon: number };
  departureTime: string;
  transportMode: TransportMode;
  preference: Preference;
}

export interface TripOption {
  id: string;
  mode: TransportMode;
  name: string;
  travelTimeMinutes: number;
  distanceKm?: number;
  exposureLevel: ExposureLevel;
  exposureScore: number; // Raw score
  estimatedCO2eKg: number;
  geometry?: [number, number][]; // Array of [lat, lon]
  isRealRoute?: boolean;
}

export interface OptimizationResponse {
  originalTrip: TripOption;
  alternatives: TripOption[];
  recommendation: TripOption;
  estimatedSavings: {
    timeDifferenceMinutes: number;
    co2eAvoidedKg: number;
    exposureReductionPercent: number;
  };
  explanation?: string;
  isLiveEnvironment?: boolean;
}

export interface EcoStats {
  ecoPoints: number;
  co2eAvoided: number; // kg
  exposureReduced: number; // percent
  tripsOptimized: number;
  streak: number;
}

export interface CommunityImpact {
  participants: number;
  tripsOptimized: number;
  co2eAvoidedTonnes: number;
}
