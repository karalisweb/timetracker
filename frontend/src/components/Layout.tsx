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
    <div className="min-h-screen flex" style={{ background: '#0d1521' }}>
      {/* ═══ Sidebar - Desktop ═══ */}
      <aside
        className="hidden md:flex md:flex-col w-[260px] fixed left-0 top-0 h-screen z-40"
        style={{ background: '#132032', borderRight: '1px solid #2a2a35' }}
      >
        {/* ═══ Zona 1 - Header App (Identita) ═══ */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid #2a2a35' }}
        >
          {/* Icona app: Lucide Clock su sfondo scuro */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: '#0d1521' }}
          >
            <Clock size={22} style={{ color: '#d4a726' }} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[0.95rem]" style={{ color: '#f5f5f7' }}>
              KW Time Report
            </span>
            <span className="text-xs" style={{ color: '#71717a' }}>
              v2.2.0
            </span>
          </div>
        </div>

        {/* ═══ Zona 2 - Navigazione Principale ═══ */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.filter(s => s.show).map((section, idx) => (
            <div key={section.title}>
              {/* Titolo sezione UPPERCASE */}
              <div
                className={`px-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.05em] ${idx === 0 ? 'mt-0' : 'mt-4'}`}
                style={{ color: '#71717a' }}
              >
                {section.title}
              </div>

              {/* Item navigazione */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        background: active ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                        color: active ? '#d4a726' : '#a1a1aa',
                      }}
                      onMouseOver={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = '#1a2d44';
                          e.currentTarget.style.color = '#f5f5f7';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#a1a1aa';
                        }
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ opacity: active ? 1 : 0.7 }}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ═══ Zona 3 - Navigazione Fissa (Footer) ═══ */}
        <div className="py-3" style={{ borderTop: '1px solid #2a2a35' }}>
          <div className="space-y-0.5">
            {/* Profilo */}
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: isActive('/settings') ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                color: isActive('/settings') ? '#d4a726' : '#a1a1aa',
              }}
              onMouseOver={(e) => {
                if (!isActive('/settings')) {
                  e.currentTarget.style.background = '#1a2d44';
                  e.currentTarget.style.color = '#f5f5f7';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive('/settings')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }
              }}
            >
              <UserCircle className="h-5 w-5" style={{ opacity: isActive('/settings') ? 1 : 0.7 }} />
              <span>Profilo</span>
            </Link>

            {/* Esci (logout) */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 w-[calc(100%-1rem)] text-left"
              style={{ color: '#a1a1aa' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#1a2d44';
                e.currentTarget.style.color = '#f5f5f7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#a1a1aa';
              }}
            >
              <LogOut className="h-5 w-5" style={{ opacity: 0.7 }} />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-[260px]">
        {/* Mobile header */}
        <div className="md:hidden">
          <Header />
        </div>

        {/* Mobile slide-over menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-over panel */}
            <div
              className="md:hidden fixed inset-y-0 right-0 w-72 z-50 p-4 space-y-2 overflow-y-auto"
              style={{ background: '#132032', borderLeft: '1px solid #2a2a35' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#f5f5f7' }}>Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#a1a1aa' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isAdmin && (
                <>
                  <div className="pb-1">
                    <p className="px-3 text-xs font-semibold uppercase" style={{ color: '#71717a' }}>Impostazioni</p>
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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                        style={{
                          background: active ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                          color: active ? '#d4a726' : '#a1a1aa',
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ opacity: active ? 1 : 0.7 }} />
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="pt-4" style={{ borderTop: '1px solid #2a2a35' }}>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    background: isActive('/settings') ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                    color: isActive('/settings') ? '#d4a726' : '#a1a1aa',
                  }}
                >
                  <UserCircle className="h-5 w-5" />
                  Profilo
                </Link>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid #2a2a35' }}>
                <div className="px-3 py-2 text-sm" style={{ color: '#a1a1aa' }}>
                  <p className="font-medium" style={{ color: '#f5f5f7' }}>{user?.name}</p>
                  <p className="text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#a1a1aa' }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Esci
                </button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-xs" style={{ color: '#71717a' }}>KW Time Report v2.2.0</p>
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
