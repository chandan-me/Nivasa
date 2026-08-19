import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout & Common
import Layout from './components/layout/Layout';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard / Private pages
import Dashboard from './pages/Dashboard';
import Visitors from './pages/Visitors';
import Maintenance from './pages/Maintenance';
import Interactions from './pages/Interactions';
import Payments from './pages/Payments';
import LocalServices from './pages/LocalServices';
import Marketplace from './pages/Marketplace';
import Parking from './pages/Parking';
import Directory from './pages/Directory';
import Chat from './pages/Chat';
import Support from './pages/Support';
import GuardPortal from './pages/GuardPortal';
import ProviderPortal from './pages/ProviderPortal';
import Admin from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Dashboard Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Resident & Family routes */}
            <Route path="/visitors" element={<Visitors />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/interactions" element={<Interactions />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/local-services" element={<LocalServices />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/parking" element={<Parking />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/support" element={<Support />} />

            {/* Guard routes */}
            <Route path="/guard" element={<GuardPortal />} />

            {/* Provider routes */}
            <Route path="/provider-portal" element={<ProviderPortal />} />

            {/* Admin routes */}
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
