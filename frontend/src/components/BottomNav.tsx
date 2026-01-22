import { Link, useLocation } from 'react-router-dom';
import { Clock, Calendar, ClipboardCheck, BarChart3, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
  const location = useLocation();
  const { canAccessOrchestration } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  // Voci base sempre visibili
  const baseItems = [
    { path: '/', label: 'Oggi', icon: Clock },
    { path: '/week', label: 'Settimana', icon: Calendar },
  ];

  // Voci orchestration (visibili solo se autorizzato)
  const orchestrationItems = canAccessOrchestration ? [
    { path: '/orchestration', label: 'Workflow', icon: ClipboardCheck },
    { path: '/admin/compliance', label: 'Compliance', icon: BarChart3 },
  ] : [];

  const navItems = [...baseItems, ...orchestrationItems];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-850 border-t border-dark-700 px-2 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg min-w-[60px] transition-colors ${
                active
                  ? 'text-brand-orange'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-brand-orange' : ''}`} />
              <span className={`text-xs mt-1 font-medium ${active ? 'text-brand-orange' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu hamburger per opzioni aggiuntive */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg min-w-[60px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
