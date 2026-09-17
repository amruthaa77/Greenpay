import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translate } from '../i18n';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateWasteType: (type?: string | null) => string;
  translateClaimStatus: (status?: string | null) => string;
  translateUserType: (type?: string | null) => string;
  translateJourneyStage: (stage?: string | null) => string;
  translateAnomalyType: (type?: string | null) => string;
  translateSeverity: (severity?: string | null) => string;
  translateAnomalyStatus: (status?: string | null) => string;
  translateTransactionType: (type?: string | null) => string;
  getGreeting: () => string;
}

const STORAGE_KEY = 'greenpay-language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('greenpay_lang');
      if (stored === 'kn' || stored === 'en') {
        return stored;
      }
    } catch {
      // ignore localstorage errors
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem('greenpay_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  const translateWasteType = (type?: string | null): string => {
    if (!type) return '';
    const norm = type.trim().toLowerCase();
    if (norm === 'wet' || norm === 'wet waste') return t('waste.wet');
    if (norm === 'dry' || norm === 'dry waste') return t('waste.dry');
    if (norm === 'recyclable' || norm === 'recyclable waste') return t('waste.recyclable');
    if (norm === 'non-recyclable' || norm === 'non_recyclable' || norm === 'non recyclable') return t('waste.non_recyclable');
    if (norm === 'contaminated' || norm === 'contaminated waste') return t('waste.contaminated');
    return type;
  };

  const translateClaimStatus = (status?: string | null): string => {
    if (!status) return '';
    const norm = status.trim().toLowerCase();
    if (norm === 'pending') return t('status.pending');
    if (norm === 'claimed') return t('status.claimed');
    if (norm === 'processed') return t('status.processed');
    return status;
  };

  const translateUserType = (type?: string | null): string => {
    if (!type) return '';
    const norm = type.trim().toLowerCase();
    if (norm === 'individual') return t('type.individual');
    if (norm === 'commercial') return t('type.commercial');
    return type;
  };

  const translateJourneyStage = (stage?: string | null): string => {
    if (!stage) return '';
    const norm = stage.trim().toLowerCase();
    if (norm.includes('collect')) return t('stage.collection');
    if (norm.includes('sort')) return t('stage.sorting');
    if (norm.includes('process')) return t('stage.processing');
    if (norm.includes('dispos') || norm.includes('recycl')) return t('stage.disposal');
    return stage;
  };

  const translateAnomalyType = (type?: string | null): string => {
    if (!type) return '';
    const norm = type.trim();
    if (norm === 'UNUSUAL_WEIGHT_SPIKE') return t('anomaly.spike');
    if (norm === 'DUPLICATE_LIKE') return t('anomaly.duplicate');
    if (norm === 'SUSPICIOUS_REWARD') return t('anomaly.suspicious');
    if (norm === 'INCONSISTENT_RECORD') return t('anomaly.inconsistent');
    return type;
  };

  const translateSeverity = (severity?: string | null): string => {
    if (!severity) return '';
    const norm = severity.trim().toUpperCase();
    if (norm === 'LOW') return t('severity.low');
    if (norm === 'MEDIUM') return t('severity.medium');
    if (norm === 'HIGH') return t('severity.high');
    return severity;
  };

  const translateAnomalyStatus = (status?: string | null): string => {
    if (!status) return '';
    const norm = status.trim().toUpperCase();
    if (norm === 'PENDING_REVIEW' || norm === 'PENDING') return t('anomaly_status.pending');
    if (norm === 'CONFIRMED') return t('anomaly_status.confirmed');
    if (norm === 'DISMISSED') return t('anomaly_status.dismissed');
    return status;
  };

  const translateTransactionType = (type?: string | null): string => {
    if (!type) return '';
    const norm = type.trim().toUpperCase();
    if (norm === 'REWARD' || norm.includes('SEGREGATION')) return t('tx.reward');
    if (norm === 'PENALTY' || norm.includes('CONTAMINATION')) return t('tx.penalty');
    if (norm === 'ADJUSTMENT') return t('tx.adjustment');
    return type;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting_morning');
    if (hour < 17) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateWasteType,
        translateClaimStatus,
        translateUserType,
        translateJourneyStage,
        translateAnomalyType,
        translateSeverity,
        translateAnomalyStatus,
        translateTransactionType,
        getGreeting,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
