import { useState } from 'react';
import type { TripRequest, TransportMode, Preference, OptimizationResponse } from '../types';
import { getDemoTripOptions } from '../services/MockRouteProvider';
import { optimizeTrips } from '../utils/engine';
import { Leaf, Clock, Wind, Activity, CheckCircle, ArrowRight } from 'lucide-react';

export default function OptimizerPage() {
  const [request, setRequest] = useState<TripRequest>({
    origin: 'Anand Vihar, Delhi',
    destination: 'Connaught Place, Delhi',
    departureTime: '08:00',
    transportMode: 'car',
    preference: 'balanced'
  });

  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setResult(null);
    setAccepted(false);
    
    // Simulate API delay
    setTimeout(() => {
      const options = getDemoTripOptions(request.origin, request.destination, request.transportMode);
      const originalTrip = options.find(o => o.id === 'opt-original')!;
      const recommendation = optimizeTrips(options, request.preference);
      
      const timeDiff = recommendation.travelTimeMinutes - originalTrip.travelTimeMinutes;
      const co2eDiff = originalTrip.estimatedCO2eKg - recommendation.estimatedCO2eKg;
      const exposureDiff = originalTrip.exposureScore > 0 
        ? ((originalTrip.exposureScore - recommendation.exposureScore) / originalTrip.exposureScore) * 100
        : 0;

      setResult({
        originalTrip,
        alternatives: options.filter(o => o.id !== recommendation.id),
        recommendation,
        estimatedSavings: {
          timeDifferenceMinutes: timeDiff,
          co2eAvoidedKg: parseFloat(co2eDiff.toFixed(2)),
          exposureReductionPercent: Math.round(exposureDiff)
        }
      });
      setAnalyzing(false);
    }, 1000);
  };

  const handleAccept = () => {
    setAccepted(true);
    // In a real app, send to backend to update user stats
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Input Form */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Plan Your Trip</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input 
                type="text" 
                value={request.origin}
                onChange={e => setRequest({...request, origin: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input 
                type="text" 
                value={request.destination}
                onChange={e => setRequest({...request, destination: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input 
                  type="time" 
                  value={request.departureTime}
                  onChange={e => setRequest({...request, departureTime: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select 
                  value={request.transportMode}
                  onChange={e => setRequest({...request, transportMode: e.target.value as TransportMode})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="car">Car</option>
                  <option value="bus">Bus</option>
                  <option value="metro_walk">Metro + Walk</option>
                  <option value="walk">Walk</option>
                  <option value="cycle">Cycle</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optimization Preference</label>
              <select 
                value={request.preference}
                onChange={e => setRequest({...request, preference: e.target.value as Preference})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="balanced">Balanced</option>
                <option value="low_exposure">Lowest Pollution Exposure</option>
                <option value="low_emission">Lowest CO2e Emission</option>
                <option value="fastest">Fastest</option>
              </select>
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-emerald-600 transition-colors disabled:opacity-70"
            >
              {analyzing ? 'Analyzing Environment...' : 'Analyze Trip'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">Uses demo environmental conditions.</p>
          </div>
        </div>
      </div>

      {/* RIGHT: Results */}
      <div className="lg:col-span-8">
        {!result && !analyzing && (
          <div className="h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500 p-8 text-center">
            <p>Enter your trip details and click analyze to see personalized recommendations based on current estimated pollution.</p>
          </div>
        )}
        
        {analyzing && (
          <div className="h-full bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 p-8 space-y-4 min-h-[400px]">
            <Activity className="w-12 h-12 text-primary animate-pulse" />
            <p className="text-lg">Crunching environmental data...</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Recommendation Card */}
            <div className="bg-emerald-50 border-2 border-primary rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-primary" />
                  BETTER OPTION FOUND
                </h3>
                <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-sm font-medium mb-1">Mode</div>
                  <div className="text-lg font-bold">{result.recommendation.name}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-sm font-medium mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1" /> Time
                  </div>
                  <div className="text-lg font-bold">{result.recommendation.travelTimeMinutes} min</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-sm font-medium mb-1 flex items-center">
                    <Leaf className="w-4 h-4 mr-1" /> Est. CO2e
                  </div>
                  <div className="text-lg font-bold">{result.recommendation.estimatedCO2eKg} kg</div>
                </div>
              </div>

              <div className="bg-white/60 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-emerald-900 mb-2">Estimated Impact vs Original Plan:</h4>
                <ul className="space-y-2 text-emerald-800">
                  <li className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    <span>{result.estimatedSavings.timeDifferenceMinutes > 0 ? '+' : ''}{result.estimatedSavings.timeDifferenceMinutes} minutes travel time</span>
                  </li>
                  <li className="flex items-center">
                    <Wind className="w-4 h-4 mr-2" />
                    <span>{result.estimatedSavings.exposureReductionPercent}% reduction in estimated pollution exposure</span>
                  </li>
                  <li className="flex items-center">
                    <Leaf className="w-4 h-4 mr-2" />
                    <span>{result.estimatedSavings.co2eAvoidedKg > 0 ? `${result.estimatedSavings.co2eAvoidedKg} kg` : 'No'} estimated CO2e avoided</span>
                  </li>
                </ul>
              </div>

              {!accepted ? (
                <div className="flex gap-4">
                  <button onClick={handleAccept} className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-md">
                    Accept Recommendation
                  </button>
                  <button onClick={() => setResult(null)} className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Keep Original
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-600 text-white p-4 rounded-lg text-center font-bold animate-pulse">
                  Trip Optimized! +50 Eco Points earned.
                </div>
              )}
            </div>

            {/* Alternatives Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Compare Options</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Option</th>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Est. Exposure</th>
                      <th className="px-6 py-3">Est. CO2e</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[result.recommendation, ...result.alternatives].map((opt, i) => (
                      <tr key={opt.id} className={i === 0 ? "bg-emerald-50" : "bg-white border-t border-gray-100"}>
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                          {i === 0 && <CheckCircle className="w-4 h-4 text-primary mr-2" />}
                          {opt.name}
                        </td>
                        <td className="px-6 py-4">{opt.travelTimeMinutes} min</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            opt.exposureLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                            opt.exposureLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {opt.exposureLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">{opt.estimatedCO2eKg} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
