import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OptimizerPage from './pages/OptimizerPage';
import DashboardPage from './pages/DashboardPage';
import ImpactPage from './pages/ImpactPage';
import LandingPage from './pages/LandingPage';
import RoutinePage from './pages/RoutinePage';
import { Wind, Leaf, Activity, Map, Home } from 'lucide-react';
import clsx from 'clsx';

function NavLinks() {
  const location = useLocation();
  const links = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4 mr-2" /> },
    { path: '/optimize', label: 'Optimize', icon: <Map className="w-4 h-4 mr-2" /> },
    { path: '/routine', label: 'Routine', icon: <Activity className="w-4 h-4 mr-2" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <Leaf className="w-4 h-4 mr-2" /> },
    { path: '/impact', label: 'Delhi Impact', icon: <Wind className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="flex gap-4">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={clsx(
            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === link.path
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header className="bg-surface shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 flex items-center">
                <Leaf className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900">EcoRoute Delhi</span>
              </div>
              <div className="hidden md:flex">
                <NavLinks />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/optimize" element={<OptimizerPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/routine" element={<RoutinePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
