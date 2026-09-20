import React from 'react';
import { GreenPayLogo } from './GreenPayLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  History,
  Wallet,
  Leaf,
  User as UserIcon,
  PlusCircle,
  AlertTriangle,
  BarChart3,
  Users,
  FileText,
  LogOut,
  Sparkles,
  Shield,
  Building2,
  Bell,
  Gift,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenNotifications: () => void;
  onOpenDemoTour: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenNotifications,
  onOpenDemoTour,
  unreadCount = 0,
}) => {
  const { session, isAdmin, logout } = useAuth();
  const { language, setLanguage, t, translateUserType } = useLanguage();

  const citizenLinks = [
    { route: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { route: '/rewards', label: t('nav.essential_rewards') || 'Essential Rewards', icon: Gift },
    { route: '/wallet', label: t('nav.wallet') || 'Green Points Wallet', icon: Wallet },
    { route: '/waste-history', label: t('nav.waste_history'), icon: History },
    { route: '/impact', label: t('nav.impact'), icon: Leaf },
    { route: '/profile', label: t('nav.profile'), icon: UserIcon },
  ];

  const adminLinks = [
    { route: '/admin', label: t('nav.admin_center'), icon: LayoutDashboard },
    { route: '/admin/rewards', label: t('nav.admin_rewards') || 'Rewards & Redemptions', icon: Gift },
    { route: '/admin/waste', label: t('nav.record_waste'), icon: PlusCircle },
    { route: '/admin/anomalies', label: t('nav.anomalies'), icon: AlertTriangle },
    { route: '/admin/ward-intelligence', label: t('nav.ward_intel'), icon: BarChart3 },
    { route: '/admin/users', label: t('nav.users'), icon: Users },
    { route: '/admin/audit-logs', label: t('nav.audit_logs'), icon: FileText },
  ];

  const links = isAdmin ? adminLinks : citizenLinks;

  return (
    <aside className="w-full lg:w-64 max-w-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full lg:h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div
          className="cursor-pointer"
          onClick={() => onNavigate(isAdmin ? '/admin' : '/dashboard')}
        >
          <GreenPayLogo size="sm" />
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-6 pt-4 pb-2">
        <div
          className={`px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold ${
            isAdmin
              ? 'bg-purple-50 text-purple-900 border border-purple-200/80'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
          }`}
        >
          {isAdmin ? (
            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          ) : (
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <div className="flex-1 truncate">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {isAdmin ? 'Municipal Operations' : 'Civic Account'}
            </span>
            <span className="truncate block">
              {isAdmin ? t('role.admin') : translateUserType(session?.user_type) || t('role.user')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Navigation
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentRoute === link.route;
          return (
            <button
              key={link.route}
              onClick={() => onNavigate(link.route)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-150 relative ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
              <span className="truncate">{link.label}</span>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Guided Tour Trigger inside Nav */}
        <div className="pt-4">
          <button
            onClick={onOpenDemoTour}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs flex items-center gap-2.5 transition-transform active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">{t('nav.demo_tour')}</span>
          </button>
        </div>
      </nav>

      {/* User & Settings Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
        {/* Language & Notification Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg transition-all text-[11px] ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('kn')}
              className={`px-2 py-0.5 rounded-lg transition-all text-[11px] ${
                language === 'kn'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={t('nav.notifications_tooltip')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {session?.name || 'Citizen'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {session?.meter_number}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('/');
            }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
            title={t('nav.signout_tooltip')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
