import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Users, FolderKanban, BarChart3, LogOut, X, UserCircle, Link2, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  const { user, logout, isAdmin, canAccessOrchestration } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const timeTrackingItems = [
    { path: '/', label: 'Oggi', icon: Clock, color: 'text-blue-400' },
    { path: '/week', label: 'Settimana', icon: Calendar, color: 'text-green-400' },
  ];

  const orchestrationItems = [
    { path: '/orchestration', label: 'Workflow', icon: ClipboardCheck, color: 'text-emerald-400' },
    { path: '/admin/compliance', label: 'Compliance', icon: BarChart3, color: 'text-purple-400' },
  ];

  const settingsItems = [
    { path: '/admin/projects', label: 'Progetti', icon: FolderKanban, color: 'text-cyan-400' },
    { path: '/admin/users', label: 'Utenti', icon: Users, color: 'text-orange-400' },
    { path: '/admin/asana', label: 'Asana', icon: Link2, color: 'text-pink-400' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-56 bg-dark-850 border-r border-dark-700">
        {/* Logo */}
        <div className="p-5 border-b border-dark-700">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-orange rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">TR</span>
            </div>
            <div>
              <span className="font-bold text-brand-teal text-lg">Time Report</span>
              <p className="text-xs text-gray-400">v. 2.2</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Time Tracking Section */}
          <div className="pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Time Tracking
            </p>
          </div>
          {timeTrackingItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-gradient-brand text-white shadow-md'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-white' : item.color}`} />
              {item.label}
            </Link>
          ))}

          {canAccessOrchestration && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Orchestration
                </p>
              </div>
              {orchestrationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration'))
                      ? 'bg-gradient-brand text-white shadow-md'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration')) ? 'text-white' : item.color}`} />
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Impostazioni
                </p>
              </div>
              {settingsItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-gradient-brand text-white shadow-md'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-white' : item.color}`} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-dark-700 space-y-1">
          <Link
            to="/settings"
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-gradient-brand text-white shadow-md'
                : 'text-gray-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <UserCircle className={`h-5 w-5 mr-3 ${isActive('/settings') ? 'text-white' : 'text-gray-400'}`} />
            Profilo
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3 text-gray-400" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header - solo su mobile */}
        <div className="md:hidden">
          <Header />
        </div>

        {/* Mobile slide-over menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-over panel */}
            <div className="md:hidden fixed inset-y-0 right-0 w-72 bg-dark-850 border-l border-dark-700 z-50 p-4 space-y-2 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isAdmin && (
                <>
                  <div className="pb-1">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase">Impostazioni</p>
                  </div>
                  {settingsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive(item.path)
                          ? 'bg-gradient-brand text-white'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-white' : item.color}`} />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              <div className="pt-4 border-t border-dark-700">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive('/settings')
                      ? 'bg-gradient-brand text-white'
                      : 'text-gray-300 hover:bg-dark-700'
                  }`}
                >
                  <UserCircle className="h-5 w-5 mr-3" />
                  Profilo
                </Link>
              </div>

              <div className="pt-4 border-t border-dark-700">
                <div className="px-3 py-2 text-sm text-gray-400">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-dark-700 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Esci
                </button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-xs text-gray-500">Time Report v2.2</p>
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto overflow-x-hidden pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Bottom Navigation - Mobile only */}
        <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />
      </div>
    </div>
  );
}
