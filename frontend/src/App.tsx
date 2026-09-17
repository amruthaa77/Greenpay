import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { AppLayout } from './components/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SecureAdminRegisterPage } from './pages/SecureAdminRegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { UserWasteHistoryPage } from './pages/UserWasteHistoryPage';
import { UserWalletPage } from './pages/UserWalletPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { EnvironmentalImpactPage } from './pages/EnvironmentalImpactPage';
import { EssentialRewardsPage } from './pages/EssentialRewardsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminWasteManagementPage } from './pages/AdminWasteManagementPage';
import { AdminAnomaliesPage } from './pages/AdminAnomaliesPage';
import { AdminWardIntelligencePage } from './pages/AdminWardIntelligencePage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminRewardManagementPage } from './pages/AdminRewardManagementPage';

const AppContent: React.FC = () => {
  const { session, isAuthenticated, isAdmin, isLoading } = useAuth();
  const { t } = useLanguage();
  const normalizeRoute = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return normalizeRoute(window.location.pathname || '/');
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizeRoute(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t('app.loading')}
          </span>
        </div>
      </div>
    );
  }

  // Routing Logic
  const renderPage = () => {
    // Public routes
    if (currentRoute === '/') {
      return <LandingPage onNavigate={navigate} onOpenDemoTour={() => setDemoTourOpen(true)} />;
    }
    if (currentRoute === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentRoute === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentRoute === '/secure-admin-registration') {
      return <SecureAdminRegisterPage onNavigate={navigate} />;
    }

    // Role-protected routes
    if (!isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }

    // Admin Routes
    if (isAdmin) {
      switch (currentRoute) {
        case '/admin':
          return <AdminDashboard onNavigate={navigate} />;
        case '/admin/rewards':
          return <AdminRewardManagementPage onNavigate={navigate} />;
        case '/admin/waste':
          return <AdminWasteManagementPage />;
        case '/admin/anomalies':
          return <AdminAnomaliesPage />;
        case '/admin/ward-intelligence':
          return <AdminWardIntelligencePage />;
        case '/admin/audit-logs':
          return <AdminAuditLogsPage />;
        case '/admin/users':
          return <AdminUsersPage />;
        default:
          return <AdminDashboard onNavigate={navigate} />;
      }
    }

    // Citizen Routes
    switch (currentRoute) {
      case '/dashboard':
        return <UserDashboard onNavigate={navigate} />;
      case '/rewards':
        return <EssentialRewardsPage onNavigate={navigate} />;
      case '/waste-history':
        return <UserWasteHistoryPage />;
      case '/wallet':
        return <UserWalletPage onNavigate={navigate} />;
      case '/impact':
        return <EnvironmentalImpactPage />;
      case '/profile':
        return <UserProfilePage />;
      default:
        return <UserDashboard onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout currentRoute={currentRoute} onNavigate={navigate}>
      {renderPage()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OfflineProvider>
            <AppContent />
          </OfflineProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
