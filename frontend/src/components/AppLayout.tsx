import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { OfflineBanner } from './OfflineBanner';
import { NotificationDrawer } from './NotificationDrawer';
import { DemoTourModal } from './DemoTourModal';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicRoute = ['/', '/login', '/register', '/secure-admin-registration'].includes(currentRoute);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-200 dark:selection:bg-emerald-800 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors duration-200">
      <OfflineBanner />

      {/* Authenticated Layout with Sidebar */}
      {isAuthenticated && !isPublicRoute ? (
        <div className="flex-1 flex flex-row min-h-screen">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              currentRoute={currentRoute}
              onNavigate={onNavigate}
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenDemoTour={() => setDemoTourOpen(true)}
            />
          </div>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="relative z-10 w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col"
                >
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <Sidebar
                    currentRoute={currentRoute}
                    onNavigate={(route) => {
                      onNavigate(route);
                      setMobileMenuOpen(false);
                    }}
                    onOpenNotifications={() => {
                      setMobileMenuOpen(false);
                      setNotificationsOpen(true);
                    }}
                    onOpenDemoTour={() => {
                      setMobileMenuOpen(false);
                      setDemoTourOpen(true);
                    }}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Right Main Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar
              currentRoute={currentRoute}
              onNavigate={onNavigate}
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenDemoTour={() => setDemoTourOpen(true)}
              onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
              mobileMenuOpen={mobileMenuOpen}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
              {children}
            </main>
          </div>
        </div>
      ) : (
        /* Public Layout (Landing, Login, Register) */
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenDemoTour={() => setDemoTourOpen(true)}
          />

          <main className="flex-1">
            {children}
          </main>
        </div>
      )}

      {/* Global Modals */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <DemoTourModal
        isOpen={demoTourOpen}
        onClose={() => setDemoTourOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
