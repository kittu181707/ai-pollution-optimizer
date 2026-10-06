import { useState, useEffect } from 'react';
import { Calendar, Briefcase, Coffee, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchRoutines, addRoutine, deleteRoutine } from '../services/api';

export default function RoutinePage() {
  const [routine, setRoutine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [newTrip, setNewTrip] = useState({
    title: 'Morning Commute',
    time: '08:00 AM',
    origin: 'Anand Vihar, Delhi',
    destination: 'Connaught Place, Delhi',
    mode: 'car'
  });

  const getUserId = () => localStorage.getItem('userId') || 'demo-user';

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const data = await fetchRoutines(getUserId());
      setRoutine(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleAdd = async () => {
    try {
      await addRoutine({ ...newTrip, userId: getUserId() });
      setShowForm(false);
      loadRoutines();
    } catch (e) {
      alert("Failed to add trip");
    }
  };

  const handleDelete = async (tripId: string) => {
    try {
      await deleteRoutine(getUserId(), tripId);
      loadRoutines();
    } catch (e) {
      alert("Failed to delete trip");
    }
  };

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('commute') || title.toLowerCase().includes('work') || title.toLowerCase().includes('office')) return <Briefcase className="w-5 h-5 text-gray-500" />;
    if (title.toLowerCase().includes('lunch') || title.toLowerCase().includes('food')) return <Coffee className="w-5 h-5 text-gray-500" />;
    return <Calendar className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Routine</h1>
          <p className="text-gray-500 mt-1">Optimize your recurring trips.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Trip'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">Add Recurring Trip</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" className="w-full p-2 border rounded-md" value={newTrip.title} onChange={e => setNewTrip({...newTrip, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="text" className="w-full p-2 border rounded-md" value={newTrip.time} onChange={e => setNewTrip({...newTrip, time: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input type="text" className="w-full p-2 border rounded-md" value={newTrip.origin} onChange={e => setNewTrip({...newTrip, origin: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input type="text" className="w-full p-2 border rounded-md" value={newTrip.destination} onChange={e => setNewTrip({...newTrip, destination: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Mode</label>
              <select className="w-full p-2 border rounded-md" value={newTrip.mode} onChange={e => setNewTrip({...newTrip, mode: e.target.value})}>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
                <option value="walk">Walk</option>
                <option value="cycle">Cycle</option>
                <option value="metro_walk">Metro</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} className="bg-primary text-white px-6 py-2 rounded-md font-bold">Save Trip</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {routine.length === 0 && !showForm && (
            <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No trips saved. Add a trip to your routine.
            </div>
          )}
          {routine.map(trip => (
            <div key={trip.tripId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-primary transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  {getIcon(trip.title)}
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
              
              <div className="flex items-center gap-2">
                <Link 
                  to={`/optimize?from=${encodeURIComponent(trip.origin)}&to=${encodeURIComponent(trip.destination)}&mode=${trip.mode}`}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
                >
                  Analyze Today
                </Link>
                <button onClick={() => handleDelete(trip.tripId)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
