// Emission factors in kg CO2e per km
export const EMISSION_FACTORS = {
  car: 0.2, // average petrol/diesel car
  bus: 0.05, // per passenger average
  metro_walk: 0.02, // very low per passenger
  walk: 0,
  cycle: 0
};

// Exposure factors (multiplier for pollution level based on mode)
// These are MODEL ASSUMPTIONS, not scientific measurements.
export const EXPOSURE_FACTORS = {
  walk: 1.0,      // fully exposed
  cycle: 1.2,     // higher breathing rate
  bus: 0.8,       // somewhat enclosed, stops open doors
  car: 0.4,       // enclosed, AC filters
  metro_walk: 0.2 // mostly underground/enclosed, AC
};

// Base AQI / PM2.5 assumption for demo calculation
export const DEMO_BASE_POLLUTION_PM25 = 150; 
