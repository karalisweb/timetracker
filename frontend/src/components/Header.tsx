import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  // Ottieni le iniziali dell'utente
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-dark-850 border-b border-dark-700 px-4 h-16 flex items-center justify-between">
      {/* Logo e nome app */}
      <Link to="/" className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">TR</span>
        </div>
        <div className="hidden sm:block">
          <span className="font-bold text-brand-teal text-lg">Time Report</span>
        </div>
      </Link>

      {/* Icone a destra */}
      <div className="flex items-center space-x-3">
        {/* Notifiche */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-dark-700 transition-colors">
          <Bell className="h-5 w-5 text-gray-400" />
          {/* Badge notifiche (opzionale) */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>

        {/* Profilo utente */}
        <Link
          to="/settings"
          className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center hover:bg-dark-600 transition-colors border border-dark-600"
        >
          {user?.name ? (
            <span className="text-sm font-medium text-gray-300">{getInitials(user.name)}</span>
          ) : (
            <Settings className="h-5 w-5 text-gray-400" />
          )}
        </Link>
      </div>
    </header>
  );
}
