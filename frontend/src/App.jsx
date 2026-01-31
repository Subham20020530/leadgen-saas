import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scraper from './pages/Scraper';
import LeadList from './pages/LeadList';
import Auth from './Auth'; // Keeping the original Auth component for now, or wrapping it

import Pricing from './pages/Pricing'; // NEW: Import Pricing

// Auth Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  // For dev/demo purposes, we might want to bypass or allow a simple check
  // if (!user) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
};

// Public Route (Login)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/scraper" element={
            <ProtectedRoute>
              <Scraper />
            </ProtectedRoute>
          } />

          <Route path="/leads" element={
            <ProtectedRoute>
              <LeadList />
            </ProtectedRoute>
          } />

          <Route path="/pricing" element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
