import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

interface TourStep {
  step: number;
  title: string;
  role: 'CITIZEN' | 'ADMIN' | 'SYSTEM';
  description: string;
  actionText?: string;
  targetRoute?: string;
  autoAction?: () => Promise<void>;
  keyHighlight: string;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPerforming, setIsPerforming] = useState(false);

  const steps: TourStep[] = [
    {
      step: 1,
      title: t('tour.step1_title'),
      role: 'CITIZEN',
      description: t('tour.step1_desc'),
      actionText: t('tour.step1_action'),
      targetRoute: '/dashboard',
      keyHighlight: t('tour.step1_highlight'),
      autoAction: async () => {
        await login('BESCOM-IND-104928', 'Password123!');
        onNavigate('/dashboard');
      },
    },
    {
      step: 2,
      title: t('tour.step2_title'),
      role: 'CITIZEN',
      description: t('tour.step2_desc'),
      actionText: t('tour.step2_action'),
      targetRoute: '/dashboard',
      keyHighlight: t('tour.step2_highlight'),
    },
    {
      step: 3,
      title: t('tour.step3_title'),
      role: 'CITIZEN',
      description: t('tour.step3_desc'),
      actionText: t('tour.step3_action'),
      targetRoute: '/waste-history',
      keyHighlight: t('tour.step3_highlight'),
    },
    {
      step: 4,
      title: t('tour.step4_title'),
      role: 'CITIZEN',
      description: t('tour.step4_desc'),
      actionText: t('tour.step4_action'),
      targetRoute: '/waste-history',
      keyHighlight: t('tour.step4_highlight'),
    },
    {
      step: 5,
      title: t('tour.step5_title'),
      role: 'CITIZEN',
      description: t('tour.step5_desc'),
      actionText: t('tour.step5_action'),
      targetRoute: '/wallet',
      keyHighlight: t('tour.step5_highlight'),
    },
    {
      step: 6,
      title: t('tour.step6_title'),
      role: 'ADMIN',
      description: t('tour.step6_desc'),
      actionText: t('tour.step6_action'),
      targetRoute: '/admin',
      keyHighlight: t('tour.step6_highlight'),
      autoAction: async () => {
        await login('ADM-BLR-001', 'AdminSecret123!');
        onNavigate('/admin');
      },
    },
    {
      step: 7,
      title: t('tour.step7_title'),
      role: 'ADMIN',
      description: t('tour.step7_desc'),
      actionText: t('tour.step7_action'),
      targetRoute: '/admin/users',
      keyHighlight: t('tour.step7_highlight'),
    },
    {
      step: 8,
      title: t('tour.step8_title'),
      role: 'ADMIN',
      description: t('tour.step8_desc'),
      actionText: t('tour.step8_action'),
      targetRoute: '/admin/waste',
      keyHighlight: t('tour.step8_highlight'),
    },
    {
      step: 9,
      title: t('tour.step9_title'),
      role: 'ADMIN',
      description: t('tour.step9_desc'),
      actionText: t('tour.step9_action'),
      targetRoute: '/admin/waste',
      keyHighlight: t('tour.step9_highlight'),
    },
    {
      step: 10,
      title: t('tour.step10_title'),
      role: 'SYSTEM',
      description: t('tour.step10_desc'),
      actionText: t('tour.step10_action'),
      targetRoute: '/admin/waste',
      keyHighlight: t('tour.step10_highlight'),
    },
    {
      step: 11,
      title: t('tour.step11_title'),
      role: 'SYSTEM',
      description: t('tour.step11_desc'),
      actionText: t('tour.step11_action'),
      targetRoute: '/admin/anomalies',
      keyHighlight: t('tour.step11_highlight'),
    },
    {
      step: 12,
      title: t('tour.step12_title'),
      role: 'ADMIN',
      description: t('tour.step12_desc'),
      actionText: t('tour.step12_action'),
      targetRoute: '/admin/anomalies',
      keyHighlight: t('tour.step12_highlight'),
    },
    {
      step: 13,
      title: t('tour.step13_title'),
      role: 'ADMIN',
      description: t('tour.step13_desc'),
      actionText: t('tour.step13_action'),
      targetRoute: '/admin/ward-intelligence',
      keyHighlight: t('tour.step13_highlight'),
    },
    {
      step: 14,
      title: t('tour.step14_title'),
      role: 'ADMIN',
      description: t('tour.step14_desc'),
      actionText: t('tour.step14_action'),
      targetRoute: '/admin/ward-intelligence',
      keyHighlight: t('tour.step14_highlight'),
    },
  ];

  const current = steps[currentStep];

  const handleStepAction = async () => {
    if (current.autoAction) {
      setIsPerforming(true);
      try {
        await current.autoAction();
      } catch (err) {
        console.error('Tour auto-action failed:', err);
      } finally {
        setIsPerforming(false);
      }
    } else if (current.targetRoute) {
      onNavigate(current.targetRoute);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-emerald-950/10 overflow-hidden relative max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">{t('tour.modal_title')}</h3>
                <p className="text-[11px] text-gray-400">{t('tour.step_counter', { current: currentStep + 1, total: steps.length })}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full my-3 sm:my-4 overflow-hidden shrink-0">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="py-2 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  current.role === 'CITIZEN'
                    ? 'bg-blue-100 text-blue-800'
                    : current.role === 'ADMIN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {current.role === 'CITIZEN'
                  ? t('tour.perspective_citizen')
                  : current.role === 'ADMIN'
                  ? t('tour.perspective_admin')
                  : t('tour.perspective_system')}
              </span>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {current.keyHighlight}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-gray-900 mt-2">{current.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
              {current.description}
            </p>

            {/* Action Trigger Button */}
            {current.actionText && (
              <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('tour.quick_nav')}</span>
                </div>
                <button
                  onClick={handleStepAction}
                  disabled={isPerforming}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPerforming ? t('tour.switching') : current.actionText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-5">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('action.previous')}
            </button>

            <span className="text-xs font-bold text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                {t('action.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {t('action.finish_tour')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
