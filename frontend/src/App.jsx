import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Auth Flow
  if (!session) {
    if (authMode === 'signup') {
      return <Signup onNavigate={() => setAuthMode('login')} />;
    }
    return <Login onNavigate={() => setAuthMode('signup')} />;
  }

  // Dashboard Flow
  return (
    <DashboardLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'settings' && <Settings />}
      {currentView === 'bots' && <div className="p-8 text-gray-400">My Bots - Coming Soon</div>}
      {currentView === 'rules' && <div className="p-8 text-gray-400">Rules - Coming Soon</div>}
    </DashboardLayout>
  );
}

export default App;
