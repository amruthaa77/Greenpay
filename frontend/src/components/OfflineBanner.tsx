import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { WifiOff, RefreshCw, CheckCircle2, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const {
    isOnline,
    pendingRecords,
    isSyncing,
    syncSuccessMessage,
    triggerSync,
    simulateOfflineToggle,
  } = useOffline();
  const { t } = useLanguage();

  if (isOnline && pendingRecords.length === 0 && !syncSuccessMessage) {
    return null;
  }

  return (
    <div className="w-full transition-all duration-300">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-950 shrink-0" />
            <span>
              {t('offline.queued_count', { count: pendingRecords.length })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateOfflineToggle}
              className="px-2 py-0.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors"
            >
              {t('action.simulate_online')}
            </button>
          </div>
        </div>
      )}

      {/* Syncing In-Progress */}
      {isSyncing && (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>{t('offline.syncing')}</span>
          </div>
        </div>
      )}

      {/* Sync Success Message */}
      {syncSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Reconnected with Pending Queue */}
      {isOnline && pendingRecords.length > 0 && !isSyncing && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t('offline.restored', { count: pendingRecords.length })}
            </span>
          </div>
          <button
            onClick={triggerSync}
            className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('action.sync_now')}
          </button>
        </div>
      )}
    </div>
  );
};
