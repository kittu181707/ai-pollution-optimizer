import { useState } from 'react';
import type { TripRequest, TransportMode, Preference, OptimizationResponse, TripOption } from '../types';
import { optimizeTrip, geocodeLocation, fetchEnvironment, acceptTrip } from '../services/api';
import { Wind, Activity, CheckCircle, MapPin } from 'lucide-react';
import { Map } from '../components/Map';
import { v4 as uuidv4 } from 'uuid';

export default function OptimizerPage() {
  const [request, setRequest] = useState<TripRequest>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      origin: params.get('from') || 'Anand Vihar, Delhi',
      destination: params.get('to') || 'Connaught Place, Delhi',
      departureTime: '08:00',
      transportMode: (params.get('mode') as TransportMode) || 'car',
      preference: 'balanced'
    };
  });

  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pollutionData, setPollutionData] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<TripOption | undefined>(undefined);

  // Fallback initial coords for Delhi if not searched yet
  const [originCoords, setOriginCoords] = useState<{lat: number, lon: number} | undefined>(undefined);
  const [destCoords, setDestCoords] = useState<{lat: number, lon: number} | undefined>(undefined);

  const getUserId = () => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('userId', id);
    }
    return id;
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);
    setAccepted(false);
    setError(null);
    setPollutionData(null);
    setActiveRoute(undefined);

    try {
      // 1. Geocode
      const oCoords = await geocodeLocation(request.origin);
      const dCoords = await geocodeLocation(request.destination);
      
      if (!oCoords || !dCoords) {
        throw new Error("Could not find coordinates for the provided locations.");
      }

      setOriginCoords(oCoords);
      setDestCoords(dCoords);

      const requestWithCoords = {
        ...request,
        originCoords: oCoords,
        destinationCoords: dCoords
      };

      // 2. Fetch Environment (for dashboard & map)
      const env = await fetchEnvironment(oCoords.lat, oCoords.lon);
      setPollutionData(env);

      // 3. Optimize Trip (this also fetches route from OSRM)
      const optimization = await optimizeTrip({
        ...requestWithCoords,
        originalMode: request.transportMode // Passing it to backend
      } as any);

      setResult(optimization);
      setActiveRoute(optimization.recommendation);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze trip. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAccept = async () => {
    if (!result) return;
    try {
      await acceptTrip(getUserId(), result.originalTrip, result.recommendation, result.estimatedSavings);
      setAccepted(true);
    } catch (e) {
      alert("Failed to save trip.");
    }
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
              <div className="relative">
                <input 
                  type="text" 
                  value={request.origin}
                  onChange={e => setRequest({...request, origin: e.target.value})}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={request.destination}
                  onChange={e => setRequest({...request, destination: e.target.value})}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Mode</label>
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
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {error}
              </div>
            )}

            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-emerald-600 transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {analyzing ? (
                 <><Activity className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</>
              ) : 'Analyze Trip'}
            </button>
          </div>
        </div>

        {pollutionData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <Wind className="w-5 h-5 mr-2 text-primary" /> Live Environmental Data
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">PM2.5</div>
                <div className="font-bold text-lg">{pollutionData.pm25} µg/m³</div>
              </div>
              <div>
                <div className="text-gray-500">AQI (Est)</div>
                <div className="font-bold text-lg">{pollutionData.aqi}</div>
              </div>
              <div>
                <div className="text-gray-500">Temp</div>
                <div className="font-bold">{pollutionData.temperature}°C</div>
              </div>
              <div>
                <div className="text-gray-500">Wind</div>
                <div className="font-bold">{pollutionData.windSpeed} km/h</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Source: {pollutionData.source}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Map & Results */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* The Map */}
        <div className="w-full h-96 bg-gray-100 rounded-xl relative z-0">
          <Map 
            origin={originCoords} 
            destination={destCoords} 
            route={activeRoute} 
            pollutionData={pollutionData} 
          />
        </div>

        {!result && !analyzing && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500 p-8 text-center">
            <p>Enter your trip details and click analyze to see live routes and pollution data.</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-medium mb-1">Mode</div>
                  <div className="text-lg font-bold truncate" title={result.recommendation.name}>{result.recommendation.name}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-medium mb-1">Time</div>
                  <div className="text-lg font-bold">{result.recommendation.travelTimeMinutes} min</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-medium mb-1">Distance</div>
                  <div className="text-lg font-bold">{result.recommendation.distanceKm} km</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-medium mb-1">Est. CO2e</div>
                  <div className="text-lg font-bold">{result.recommendation.estimatedCO2eKg} kg</div>
                </div>
              </div>

              <div className="bg-white/60 p-4 rounded-lg mb-6 text-emerald-900">
                <p className="font-medium mb-2">{result.explanation || "This option balances your preferences."}</p>
                <div className="text-sm mt-2 font-mono">
                  {result.isLiveEnvironment ? "✓ Using live environmental data" : "⚠️ Using simulated environmental data"}
                </div>
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
                <div className="bg-emerald-600 text-white p-4 rounded-lg text-center font-bold">
                  Trip Accepted! Impact saved to your dashboard.
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
                      <th className="px-4 py-3">Option</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Est. Exposure</th>
                      <th className="px-4 py-3">Est. CO2e</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[result.recommendation, ...result.alternatives].map((opt, i) => (
                      <tr 
                        key={opt.id} 
                        className={`${i === 0 ? "bg-emerald-50" : "bg-white"} border-t border-gray-100 hover:bg-gray-50 transition-colors`}
                        onClick={() => setActiveRoute(opt)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center">
                          {i === 0 && <CheckCircle className="w-4 h-4 text-primary mr-1" />}
                          {opt.name}
                        </td>
                        <td className="px-4 py-3">{opt.travelTimeMinutes} min</td>
                        <td className="px-4 py-3">{opt.distanceKm} km</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            opt.exposureLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                            opt.exposureLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {opt.exposureLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">{opt.estimatedCO2eKg} kg</td>
                        <td className="px-4 py-3">
                           <button 
                             className="text-xs text-primary underline"
                             onClick={(e) => { e.stopPropagation(); setActiveRoute(opt); }}
                           >
                             View Map
                           </button>
                        </td>
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
