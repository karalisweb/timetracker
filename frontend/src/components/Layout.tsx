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

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  const isItemActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/orchestration') return isActivePrefix('/orchestration');
    return isActive(path);
  };

  /* ═══════════════════════════════════════════
     Navigazione Principale (Zona 2)
     Ref: DESIGN-SYSTEM.md sezione 7.1
     ═══════════════════════════════════════════ */

  const navSections = [
    {
      title: 'TIME TRACKING',
      show: true,
      items: [
        { path: '/', label: 'Oggi', icon: Clock },
        { path: '/week', label: 'Settimana', icon: Calendar },
      ],
    },
    {
      title: 'ORCHESTRATION',
      show: canAccessOrchestration,
      items: [
        { path: '/orchestration', label: 'Workflow', icon: ClipboardCheck },
        { path: '/admin/compliance', label: 'Compliance', icon: BarChart3 },
      ],
    },
    {
      title: 'IMPOSTAZIONI',
      show: isAdmin,
      items: [
        { path: '/admin/projects', label: 'Progetti', icon: FolderKanban },
        { path: '/admin/users', label: 'Utenti', icon: Users },
        { path: '/admin/asana', label: 'Asana', icon: Link2 },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-dark-950">
      {/* ═══ Sidebar - Desktop ═══ */}
      <aside className="hidden md:flex md:flex-col w-[260px] fixed left-0 top-0 h-screen z-40 bg-dark-900 border-r border-dark-700">
        {/* ═══ Zona 1 - Header App (Identita) ═══ */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-950">
            <Clock size={22} className="text-brand-orange" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[0.95rem] text-dark-50">
              KW Time Report
            </span>
            <span className="text-xs text-dark-500">
              v1.2.0
            </span>
          </div>
        </div>

        {/* ═══ Zona 2 - Navigazione Principale ═══ */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.filter(s => s.show).map((section, idx) => (
            <div key={section.title}>
              <div
                className={`px-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-dark-500 ${idx === 0 ? 'mt-0' : 'mt-4'}`}
              >
                {section.title}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-brand-orange/10 text-brand-orange'
                          : 'text-dark-400 hover:bg-dark-800 hover:text-dark-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? '' : 'opacity-70'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ═══ Zona 3 - Navigazione Fissa (Footer) ═══ */}
        <div className="py-3 border-t border-dark-700">
          <div className="space-y-0.5">
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-brand-orange/10 text-brand-orange'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-50'
              }`}
            >
              <UserCircle className={`h-5 w-5 ${isActive('/settings') ? '' : 'opacity-70'}`} />
              <span>Profilo</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 w-[calc(100%-1rem)] text-left text-dark-400 hover:bg-dark-800 hover:text-dark-50"
            >
              <LogOut className="h-5 w-5 opacity-70" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-[260px]">
        <div className="md:hidden">
          <Header />
        </div>

        {/* Mobile slide-over menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="md:hidden fixed inset-y-0 right-0 w-72 z-50 p-4 space-y-2 overflow-y-auto bg-dark-900 border-l border-dark-700 animate-slideUp">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark-50">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-dark-400"
                  aria-label="Chiudi menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isAdmin && (
                <>
                  <div className="pb-1">
                    <p className="px-3 text-xs font-semibold uppercase text-dark-500">Impostazioni</p>
                  </div>
                  {[
                    { path: '/admin/projects', label: 'Progetti', icon: FolderKanban },
                    { path: '/admin/users', label: 'Utenti', icon: Users },
                    { path: '/admin/asana', label: 'Asana', icon: Link2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          active
                            ? 'bg-brand-orange/10 text-brand-orange'
                            : 'text-dark-400'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? '' : 'opacity-70'}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="pt-4 border-t border-dark-700">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive('/settings')
                      ? 'bg-brand-orange/10 text-brand-orange'
                      : 'text-dark-400'
                  }`}
                >
                  <UserCircle className="h-5 w-5" />
                  Profilo
                </Link>
              </div>

              <div className="pt-4 border-t border-dark-700">
                <div className="px-3 py-2 text-sm text-dark-400">
                  <p className="font-medium text-dark-50">{user?.name}</p>
                  <p className="text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-dark-400 hover:text-dark-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Esci
                </button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-xs text-dark-500">KW Time Report v1.2.0</p>
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto overflow-x-hidden pb-20 md:pb-6">
          <Outlet />
        </main>

        <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />
      </div>
    </div>
  );
}
