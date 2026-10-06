import { Users, MapPin, Globe } from 'lucide-react';
import type { CommunityImpact } from '../types';

export default function ImpactPage() {
  // Demo community data
  const community: CommunityImpact = {
    participants: 10247,
    tripsOptimized: 4820,
    co2eAvoidedTonnes: 8.4
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Delhi Collective Impact</h1>
        <p className="text-xl text-gray-600">See how individual optimizations add up to city-wide change.</p>
        <span className="inline-block mt-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
          Demo / Simulated Community Data
        </span>
      </div>

      <div className="bg-primary text-white rounded-2xl shadow-xl p-8 lg:p-12 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <Users className="w-12 h-12 mb-4 text-emerald-200" />
          <div className="text-4xl font-bold mb-2">{community.participants.toLocaleString()}</div>
          <div className="text-emerald-100 uppercase tracking-wider text-sm font-semibold">Active Participants</div>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <MapPin className="w-12 h-12 mb-4 text-emerald-200" />
          <div className="text-4xl font-bold mb-2">{community.tripsOptimized.toLocaleString()}</div>
          <div className="text-emerald-100 uppercase tracking-wider text-sm font-semibold">Trips Optimized</div>
        </div>

        <div className="flex flex-col items-center text-center">
          <Globe className="w-12 h-12 mb-4 text-emerald-200" />
          <div className="text-4xl font-bold mb-2">{community.co2eAvoidedTonnes}</div>
          <div className="text-emerald-100 uppercase tracking-wider text-sm font-semibold">Tonnes Est. CO2e Avoided</div>
        </div>
      </div>

      <div className="mt-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Contribution</h2>
        <p className="text-gray-600 mb-6">
          You optimized 18 trips this month. That's an estimated <strong className="text-emerald-600">12.4 kg of CO2e</strong> avoided.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div className="bg-primary h-4 rounded-full" style={{ width: '4%' }}></div>
        </div>
        <p className="text-xs text-gray-400">You represent a growing fraction of our community impact!</p>
      </div>
    </div>
  );
}
