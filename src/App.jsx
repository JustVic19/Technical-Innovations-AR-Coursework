import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Faults from '@/pages/Faults';
import ARView from '@/pages/ARView';
import Tools from '@/pages/Tools';
import Sites from '@/pages/Sites';
import AuditLog from '@/pages/AuditLog';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">Authenticating</div>
        </div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/faults" element={<Faults />} />
        <Route path="/ar" element={<ARView />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App