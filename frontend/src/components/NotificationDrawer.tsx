import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Award, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { InAppNotification } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: InAppNotification[]; unread_count: number }>(
        '/users/me/notifications'
      );
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/users/me/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'REWARD':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'ANOMALY':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'STATUS_UPDATE':
        return <CheckCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-[calc(100vw-0.75rem)] sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-gray-100 dark:border-slate-800"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {t('notifications.unread_badge', { count: unreadCount })}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-10 text-xs text-gray-400">{t('notifications.loading')}</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">{t('notifications.empty_title')}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('notifications.empty_desc')}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      notif.is_read
                        ? 'bg-white border-gray-100'
                        : 'bg-emerald-50/50 border-emerald-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-gray-100 shadow-xs shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(notif.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="mt-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t('action.mark_as_read')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
