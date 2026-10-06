import { useEffect, useState } from 'react';
import { Users, Globe2, Wind, Loader2 } from 'lucide-react';
import { fetchImpact } from '../services/api';

export default function ImpactPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpact()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-4">Delhi Collective Impact</h1>
          <p className="text-emerald-100 max-w-2xl text-lg mb-8">
            See how individual decisions are compounding into city-wide benefits.
            By choosing cleaner transportation, the community is actively reducing estimated transport emissions and personal pollution exposure.
          </p>
          {data.isDemo && <span className="bg-emerald-700 text-xs px-2 py-1 rounded">Using simulated baseline</span>}
        </div>
        <Globe2 className="absolute -right-20 -bottom-20 w-96 h-96 text-emerald-800 opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <div className="text-4xl font-bold text-gray-900 mb-2">{data.community.participants.toLocaleString()}</div>
          <div className="text-gray-500 font-medium">Active Participants</div>
          <div className="text-xs text-gray-400 mt-2">({data.baseline})</div>
        </div>
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <Wind className="w-12 h-12 text-primary mx-auto mb-4" />
          <div className="text-4xl font-bold text-gray-900 mb-2">{data.community.tripsOptimized.toLocaleString()}</div>
          <div className="text-gray-500 font-medium">Trips Optimized</div>
        </div>
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <Globe2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <div className="text-4xl font-bold text-gray-900 mb-2">{data.community.co2eAvoidedTonnes.toFixed(3)}</div>
          <div className="text-gray-500 font-medium">Tonnes Est. CO2e Avoided</div>
        </div>
      </div>
    </div>
  );
}
