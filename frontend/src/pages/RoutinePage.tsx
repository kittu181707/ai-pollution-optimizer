import { Calendar, Briefcase, Coffee, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoutinePage() {
  const routine = [
    {
      id: 1,
      title: "Morning Commute",
      time: "08:00 AM",
      origin: "Home",
      destination: "Office",
      mode: "Car",
      icon: <Briefcase className="w-5 h-5 text-gray-500" />
    },
    {
      id: 2,
      title: "Lunch Break",
      time: "01:00 PM",
      origin: "Office",
      destination: "Restaurant",
      mode: "Walk",
      icon: <Coffee className="w-5 h-5 text-gray-500" />
    },
    {
      id: 3,
      title: "Evening Return",
      time: "06:00 PM",
      origin: "Office",
      destination: "Home",
      mode: "Car",
      icon: <Calendar className="w-5 h-5 text-gray-500" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Routine</h1>
          <p className="text-gray-500 mt-1">Optimize your recurring trips.</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors">
          + Add Trip
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h3 className="text-emerald-900 font-bold mb-1">Today's Routine Summary</h3>
          <p className="text-emerald-700 text-sm">3 trips analyzed • 2 recommendations • 1 accepted</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-emerald-600">1.5 kg</div>
          <div className="text-xs text-emerald-800">Est. CO2e Avoided</div>
        </div>
      </div>

      <div className="space-y-4">
        {routine.map(trip => (
          <div key={trip.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-primary transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-full">
                {trip.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{trip.title}</h4>
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span>{trip.time}</span> • 
                  <span>{trip.origin} <ArrowRight className="inline w-3 h-3" /> {trip.destination}</span> • 
                  <span>Mode: {trip.mode}</span>
                </div>
              </div>
            </div>
            
            <Link 
              to={`/optimize?from=${trip.origin}&to=${trip.destination}&mode=${trip.mode}`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Analyze Options
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
