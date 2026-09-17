import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface PendingWasteRecord {
  idempotency_key: string;
  meter_number: string;
  waste_type: string;
  weight_kg: number;
  collection_date: string;
  claim_status: string;
  admin_feedback?: string;
  ai_classification_id?: string;
  timestamp: string;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingRecords: PendingWasteRecord[];
  isSyncing: boolean;
  syncSuccessMessage: string | null;
  queueRecord: (record: Omit<PendingWasteRecord, 'idempotency_key' | 'timestamp'>) => void;
  triggerSync: () => Promise<void>;
  simulateOfflineToggle: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingRecords, setPendingRecords] = useState<PendingWasteRecord[]>(() => {
    const saved = localStorage.getItem('greenpay_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('greenpay_offline_queue', JSON.stringify(pendingRecords));
  }, [pendingRecords]);

  const queueRecord = (record: Omit<PendingWasteRecord, 'idempotency_key' | 'timestamp'>) => {
    const newRecord: PendingWasteRecord = {
      ...record,
      idempotency_key: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setPendingRecords((prev) => [...prev, newRecord]);
  };

  const triggerSync = async () => {
    const queue = [...pendingRecords];
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;
    const remaining: PendingWasteRecord[] = [];

    for (const item of queue) {
      try {
        await api.post('/admin/waste', {
          meter_number: item.meter_number,
          waste_type: item.waste_type,
          weight_kg: item.weight_kg,
          collection_date: item.collection_date,
          claim_status: item.claim_status,
          admin_feedback: item.admin_feedback,
          ai_classification_id: item.ai_classification_id,
          idempotency_key: item.idempotency_key,
        });
        successCount++;
      } catch (err) {
        console.error('Failed to sync record:', item, err);
        remaining.push(item);
      }
    }

    setPendingRecords(remaining);
    setIsSyncing(false);

    if (successCount > 0) {
      setSyncSuccessMessage(`✓ ${successCount} record${successCount > 1 ? 's' : ''} synchronized`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    }
  };

  const simulateOfflineToggle = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingRecords,
        isSyncing,
        syncSuccessMessage,
        queueRecord,
        triggerSync,
        simulateOfflineToggle,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
