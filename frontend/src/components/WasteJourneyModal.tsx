import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, Truck, Layers, Cpu, Recycle, ArrowRight, ShieldCheck } from 'lucide-react';
import { WasteEntry, JourneyStage } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WasteJourneyModalProps {
  entry: WasteEntry | null;
  onClose: () => void;
}

export const WasteJourneyModal: React.FC<WasteJourneyModalProps> = ({ entry, onClose }) => {
  const { t, translateWasteType, translateClaimStatus, translateUserType } = useLanguage();

  if (!entry) return null;

  const stages: { key: JourneyStage; label: string; desc: string; icon: any }[] = [
    { key: 'Collection', label: t('stage.collection'), desc: t('stage.collection_desc'), icon: Truck },
    { key: 'Sorting', label: t('stage.sorting'), desc: t('stage.sorting_desc'), icon: Layers },
    { key: 'Processing', label: t('stage.processing'), desc: t('stage.processing_desc'), icon: Cpu },
    { key: 'Recycling/Disposal', label: t('stage.disposal'), desc: t('stage.disposal_desc'), icon: Recycle },
  ];

  // Determine stage progress
  const stageKeys = stages.map((s) => s.key);
  const currentStageIndex = stageKeys.indexOf(entry.journey_stage);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden relative max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-gray-100 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {entry.transaction_id}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    entry.claim_status === 'Processed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : entry.claim_status === 'Claimed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {translateClaimStatus(entry.claim_status)}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{t('journey.title')}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
            {/* Visual Waste Journey Multi-Step Timeline */}
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
                {t('journey.pipeline_header')}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative">
                {stages.map((st, idx) => {
                  const Icon = st.icon;
                  const isCompleted = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={st.key} className="flex flex-col items-center text-center relative group">
                      {/* Step Circle */}
                      <motion.div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-emerald-800 text-white ring-4 ring-emerald-200 shadow-md animate-pulse-subtle'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                        initial={false}
                        animate={{ scale: isCurrent ? 1.05 : 1 }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </motion.div>

                      {/* Label & Description */}
                      <h5
                        className={`text-xs font-bold mt-3 ${
                          isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {st.label}
                      </h5>
                      <p className="text-[10px] text-gray-500 mt-1 leading-tight px-1">
                        {st.desc}
                      </p>

                      {/* Status Tag */}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted
                          ? t('journey.verified_badge')
                          : isCurrent
                          ? t('journey.in_progress_badge')
                          : t('journey.pending_badge')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waste Record Specifications Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_category')}</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{translateWasteType(entry.waste_type)}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_weight')}</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{entry.weight_kg} kg</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_date')}</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {new Date(entry.collection_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_ward')}</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{entry.ward_name || 'Bengaluru'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_verifier')}</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{entry.recorder_name || 'BBMP Inspector'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-medium text-gray-500">{t('journey.spec_impact')}</span>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    (entry.reward_amount ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {(entry.reward_amount ?? 0) >= 0 ? `+${entry.reward_amount} GP` : `-${Math.abs(entry.reward_amount || 0)} GP`}
                </p>
              </div>
            </div>

            {/* Transparent Reward Breakdown Box */}
            {entry.reward_breakdown && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    {t('journey.formula_title')}
                  </h5>
                </div>
                <p className="font-mono text-sm font-semibold text-emerald-900 mt-1">
                  {entry.reward_breakdown}
                </p>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  {t('journey.formula_note', { userType: translateUserType(entry.user_type) || t('type.individual') })}
                </p>
              </div>
            )}

            {/* Admin Field Feedback */}
            {entry.admin_feedback && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {t('journey.feedback_title')}
                </span>
                <p className="text-xs text-gray-800 mt-1 italic">
                  "{entry.admin_feedback}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-gray-400 text-center sm:text-left">
              {t('journey.immutable_id', { id: entry.id })}
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {t('action.done')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
