export type TransportMode = 'car' | 'bus' | 'metro_walk' | 'walk' | 'cycle';
export type Preference = 'fastest' | 'low_emission' | 'low_exposure' | 'balanced';
export type ExposureLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface TripRequest {
  origin: string;
  destination: string;
  departureTime: string;
  transportMode: TransportMode;
  preference: Preference;
}

export interface TripOption {
  id: string;
  mode: TransportMode;
  name: string;
  travelTimeMinutes: number;
  exposureLevel: ExposureLevel;
  exposureScore: number; // Raw score
  estimatedCO2eKg: number;
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
