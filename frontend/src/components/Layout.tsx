import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Users, FolderKanban, BarChart3, LogOut, Menu, X, UserCircle, Link2, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';

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
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">Time Report</span>
              <p className="text-xs text-gray-400">v. 1.0</p>
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
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-black' : item.color}`} />
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
                      ? 'bg-amber-500 text-black'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration')) ? 'text-black' : item.color}`} />
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
                      ? 'bg-amber-500 text-black'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-black' : item.color}`} />
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
                ? 'bg-amber-500 text-black'
                : 'text-gray-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <UserCircle className={`h-5 w-5 mr-3 ${isActive('/settings') ? 'text-black' : 'text-gray-400'}`} />
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
        {/* Mobile header */}
        <header className="md:hidden bg-dark-850 border-b border-dark-700 px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Time Report</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-850 border-b border-dark-700 px-4 py-3 space-y-1">
            {/* Time Tracking Section */}
            <div className="pb-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase">Time Tracking</p>
            </div>
            {timeTrackingItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-300'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-black' : item.color}`} />
                {item.label}
              </Link>
            ))}

            {canAccessOrchestration && (
              <>
                <div className="pt-3 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase">Orchestration</p>
                </div>
                {orchestrationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration'))
                        ? 'bg-amber-500 text-black'
                        : 'text-gray-300'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) || (item.path === '/orchestration' && isActivePrefix('/orchestration')) ? 'text-black' : item.color}`} />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {isAdmin && (
              <>
                <div className="pt-3 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase">Impostazioni</p>
                </div>
                {settingsItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-amber-500 text-black'
                        : 'text-gray-300'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 ${isActive(item.path) ? 'text-black' : item.color}`} />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            <div className="pt-3 border-t border-dark-700 mt-3">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 text-sm text-gray-300"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Profilo
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-300">{user?.name}</span>
                <button onClick={handleLogout} className="text-red-400 text-sm flex items-center">
                  <LogOut className="h-4 w-4 mr-1" />
                  Esci
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
