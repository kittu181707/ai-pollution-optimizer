import { useEffect, useState } from 'react';
import { Leaf, Award, Map, TrendingDown, Loader2 } from 'lucide-react';
import type { EcoStats } from '../types';
import { fetchDashboard } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export default function DashboardPage() {
  const [stats, setStats] = useState<EcoStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('userId', id);
    }
    
    fetchDashboard(id)
      .then(data => {
        setStats(data.stats);
        setRecentTrips(data.recentTrips);
        setIsDemo(data.isDemo);
      })
      .catch(err => console.error("Failed to load dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personal Impact Dashboard</h1>
        <p className="text-gray-500 mt-2">Track your estimated environmental contribution and optimized habits.</p>
        {isDemo && <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block">Demo / Simulated Mode</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Award className="w-10 h-10 text-yellow-500 mb-3" />
          <div className="text-3xl font-bold text-gray-900">{stats.ecoPoints}</div>
          <div className="text-sm text-gray-500 font-medium">Eco Points</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Leaf className="w-10 h-10 text-emerald-500 mb-3" />
          <div className="text-3xl font-bold text-gray-900">{stats.co2eAvoided} kg</div>
          <div className="text-sm text-gray-500 font-medium">Est. CO2e Avoided</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <TrendingDown className="w-10 h-10 text-blue-500 mb-3" />
          <div className="text-3xl font-bold text-gray-900">{stats.exposureReduced}%</div>
          <div className="text-sm text-gray-500 font-medium">Avg. Est. Exposure Reduction</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Map className="w-10 h-10 text-purple-500 mb-3" />
          <div className="text-3xl font-bold text-gray-900">{stats.tripsOptimized}</div>
          <div className="text-sm text-gray-500 font-medium">Trips Optimized</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Recent Optimized Trips</h2>
        {recentTrips.length === 0 ? (
          <p className="text-gray-500">No optimized trips accepted yet. Plan a trip to get started!</p>
        ) : (
          <div className="space-y-4">
            {recentTrips.map((trip: any, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-bold text-gray-800">Trip Optimized</div>
                  <div className="text-sm text-gray-500">Changed from {trip.originalMode} to {trip.recommendedMode}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-600 font-bold font-mono">-{trip.co2eAvoidedKg} kg CO2e</div>
                  <div className="text-xs text-gray-400">{new Date(trip.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
