import { Leaf, Award, Map, TrendingDown } from 'lucide-react';
import type { EcoStats } from '../types';

export default function DashboardPage() {
  // Demo stats
  const stats: EcoStats = {
    ecoPoints: 350,
    co2eAvoided: 12.4,
    exposureReduced: 24,
    tripsOptimized: 18,
    streak: 5
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personal Impact Dashboard</h1>
        <p className="text-gray-500 mt-2">Track your estimated environmental contribution and optimized habits.</p>
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-lg">
              <div>
                <div className="font-bold text-gray-800">Anand Vihar → Connaught Place</div>
                <div className="text-sm text-gray-500">Changed to Metro + Walk</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-600 font-bold font-mono">-1.5 kg CO2e</div>
                <div className="text-xs text-gray-400">Oct {10 - i}, 2026</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
