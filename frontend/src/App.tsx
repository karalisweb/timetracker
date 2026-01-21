import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Week from './pages/Week';
import SettingsPage from './pages/Settings';
import Compliance from './pages/admin/Compliance';
import UsersPage from './pages/admin/Users';
import ProjectsPage from './pages/admin/Projects';
import AsanaConfigPage from './pages/admin/AsanaConfig';
import OrchProjectsPage from './pages/orchestration/OrchProjects';
import OrchProjectDetailPage from './pages/orchestration/OrchProjectDetail';
import OrchProjectCreatePage from './pages/orchestration/OrchProjectCreate';
import OrchProjectCreateAIPage from './pages/orchestration/OrchProjectCreateAI';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function OrchestrationRoute({ children }: { children: React.ReactNode }) {
  const { user, canAccessOrchestration, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessOrchestration) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="week" element={<Week />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Admin routes */}
        <Route
          path="admin/compliance"
          element={
            <AdminRoute>
              <Compliance />
            </AdminRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/projects"
          element={
            <AdminRoute>
              <ProjectsPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/asana"
          element={
            <AdminRoute>
              <AsanaConfigPage />
            </AdminRoute>
          }
        />

        {/* Orchestration routes */}
        <Route
          path="orchestration"
          element={
            <OrchestrationRoute>
              <OrchProjectsPage />
            </OrchestrationRoute>
          }
        />
        <Route
          path="orchestration/new"
          element={
            <OrchestrationRoute>
              <OrchProjectCreatePage />
            </OrchestrationRoute>
          }
        />
        <Route
          path="orchestration/new-ai"
          element={
            <OrchestrationRoute>
              <OrchProjectCreateAIPage />
            </OrchestrationRoute>
          }
        />
        <Route
          path="orchestration/:id"
          element={
            <OrchestrationRoute>
              <OrchProjectDetailPage />
            </OrchestrationRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
