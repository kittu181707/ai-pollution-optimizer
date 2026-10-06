import { describe, it, expect } from 'vitest';
import { optimizeTrips, getExposureLevel } from './engine';
import type { TripOption } from '../types';

describe('Optimization Engine', () => {
  const options: TripOption[] = [
    {
      id: 'car-original',
      mode: 'car',
      name: 'Car - Original',
      travelTimeMinutes: 20,
      exposureScore: 30, // medium
      exposureLevel: 'MEDIUM',
      estimatedCO2eKg: 1.8
    },
    {
      id: 'metro',
      mode: 'metro_walk',
      name: 'Metro + Walk',
      travelTimeMinutes: 52,
      exposureScore: 15, // low
      exposureLevel: 'LOW',
      estimatedCO2eKg: 0.3
    }
  ];

  it('should recommend Metro under Balanced preference', () => {
    const recommendation = optimizeTrips(options, 'balanced');
    expect(recommendation.id).toBe('metro');
  });

  it('should recommend Car under Fastest preference', () => {
    const recommendation = optimizeTrips(options, 'fastest');
    expect(recommendation.id).toBe('car-original');
  });

  it('should recommend Metro under Low Emission preference', () => {
    const recommendation = optimizeTrips(options, 'low_emission');
    expect(recommendation.id).toBe('metro');
  });

  it('should correctly classify exposure levels', () => {
    expect(getExposureLevel(30)).toBe('LOW');
    expect(getExposureLevel(80)).toBe('MEDIUM');
    expect(getExposureLevel(120)).toBe('HIGH');
    expect(getExposureLevel(160)).toBe('VERY_HIGH');
  });
});
