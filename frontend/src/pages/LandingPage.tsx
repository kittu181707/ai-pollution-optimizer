import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Shield, Map } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Don't Just Check Delhi's AQI.<br />
          <span className="text-primary">Change Your Decision.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered travel recommendations that help you reduce estimated pollution exposure and transport emissions.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          to="/optimize"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary hover:bg-emerald-600 transition-colors shadow-lg"
        >
          Optimize My Trip
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
        <Link
          to="/impact"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          See Delhi Impact
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <Map className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">1. Analyze</h3>
          <p className="text-gray-600 text-sm">We analyze your route against current environmental data and transport emission factors.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <Shield className="w-10 h-10 text-emerald-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">2. Optimize</h3>
          <p className="text-gray-600 text-sm">Our determinist engine finds alternatives that minimize personal exposure and emissions.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <Leaf className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">3. Act & Measure</h3>
          <p className="text-gray-600 text-sm">Accept recommendations, earn eco points, and contribute to the collective impact.</p>
        </div>
      </div>
    </div>
  );
}
