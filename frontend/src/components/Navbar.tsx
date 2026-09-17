import React, { useState } from 'react';
import { GreenPayLogo } from './GreenPayLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Menu,
  X,
  Bell,
  Sparkles,
  LogOut,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenNotifications: () => void;
  onOpenDemoTour: () => void;
  unreadCount?: number;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenNotifications,
  onOpenDemoTour,
  unreadCount = 0,
  onToggleMobileMenu,
  mobileMenuOpen = false,
}) => {
  const { session, isAuthenticated, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);

  const isLandingPage = currentRoute === '/';

  const scrollToSection = (sectionId: string) => {
    setPublicMenuOpen(false);
    if (isLandingPage) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      onNavigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  const navLinks = [
    { label: t('landing.nav_how_it_works') || 'How It Works', id: 'how-it-works' },
    { label: t('landing.nav_green_points') || 'Green Points', id: 'green-points' },
    { label: t('landing.nav_rewards') || 'Essential Goods', id: 'essential-goods' },
    { label: t('landing.nav_civic_tech') || 'Civic Intelligence', id: 'civic-tech' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger or Logo */}
          <div className="flex items-center gap-3">
            {/* Authenticated hamburger */}
            {isAuthenticated ? (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            ) : (
              /* Public mobile hamburger */
              <button
                onClick={() => setPublicMenuOpen(!publicMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Toggle navigation menu"
              >
                {publicMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div
              className={`cursor-pointer flex items-center ${isAuthenticated ? 'lg:hidden' : ''}`}
              onClick={() => onNavigate(isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/')}
            >
              <GreenPayLogo size="sm" />
            </div>

            {/* Authenticated Desktop Context Badge */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>BBMP Urban Waste Grid • Verified Live</span>
                </span>
              </div>
            )}
          </div>

          {/* Center Navigation for Public / Landing Page */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Demo Tour Button */}
            <button
              onClick={onOpenDemoTour}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Interactive 14-Step Guided Demo for Judges"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">{t('nav.demo_tour')}</span>
            </button>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold transition-colors">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'kn'
                    ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Notifications Trigger (if authenticated) */}
            {isAuthenticated && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title={t('nav.notifications_tooltip')}
                aria-label={t('nav.notifications_tooltip')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Public Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => onNavigate('/register')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{t('nav.register')}</span>
                </button>
              </div>
            ) : (
              /* Authenticated User info & Logout */
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                    {session?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {session?.meter_number}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('/');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title={t('nav.signout_tooltip')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu (Public) */}
      {!isAuthenticated && publicMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setPublicMenuOpen(false);
                onNavigate('/login');
              }}
              className="w-full py-2.5 text-center text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {t('nav.login')}
            </button>
            <button
              onClick={() => {
                setPublicMenuOpen(false);
                onNavigate('/register');
              }}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              {t('nav.register')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
