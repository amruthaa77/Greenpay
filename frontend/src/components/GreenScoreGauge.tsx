import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle, TrendingUp, TrendingDown, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ScoreBreakdown } from '../types';
import { api } from '../services/api';

interface GreenScoreGaugeProps {
  score: number;
  delta: number;
  explanation?: string;
  size?: number;
}

export const GreenScoreGauge: React.FC<GreenScoreGaugeProps> = ({
  score,
  delta,
  explanation,
  size = 200,
}) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // SVG Gauge calculations
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Score clamped between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color based on score tier
  const getScoreTheme = (val: number) => {
    if (val >= 85) return { stroke: '#10B981', text: 'text-emerald-700', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800', label: t('score.excellent') };
    if (val >= 70) return { stroke: '#3B82F6', text: 'text-blue-700', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', label: t('score.good') };
    if (val >= 50) return { stroke: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', label: t('score.fair') };
    return { stroke: '#EF4444', text: 'text-rose-700', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-800', label: t('score.needs_attention') };
  };

  const theme = getScoreTheme(normalizedScore);

  const fetchScoreBreakdown = async () => {
    setShowModal(true);
    if (!breakdown) {
      setLoadingBreakdown(true);
      try {
        const data = await api.get<ScoreBreakdown>('/users/me/score-breakdown');
        setBreakdown(data);
      } catch (err) {
        console.error('Failed to load score breakdown:', err);
      } finally {
        setLoadingBreakdown(false);
      }
    }
  };

  const translateCompName = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('segregat')) return t('score_modal.comp_segregation');
    if (n.includes('recycl')) return t('score_modal.comp_recyclable');
    if (n.includes('consist')) return t('score_modal.comp_consistency');
    if (n.includes('contamin')) return t('score_modal.comp_contamination');
    if (n.includes('participat')) return t('score_modal.comp_participation');
    return name;
  };

  const translateCompDesc = (name: string, fallback: string) => {
    const n = name.toLowerCase();
    if (n.includes('segregat')) return t('score_modal.comp_segregation_desc');
    if (n.includes('recycl')) return t('score_modal.comp_recyclable_desc');
    if (n.includes('consist')) return t('score_modal.comp_consistency_desc');
    if (n.includes('contamin')) return t('score_modal.comp_contamination_desc');
    if (n.includes('participat')) return t('score_modal.comp_participation_desc');
    return fallback;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-emerald-950/10 shadow-sm flex flex-col items-center relative">
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{t('green_score')}</h3>
        </div>
        <button
          onClick={fetchScoreBreakdown}
          className="text-gray-400 hover:text-emerald-700 transition-colors p-1 rounded-full hover:bg-emerald-50"
          title="Explain Score Breakdown"
          aria-label="Explain Green Score calculation breakdown"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Progress Meter */}
      <div className="relative flex items-center justify-center my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            className="text-4xl font-black text-gray-900 tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {normalizedScore}
          </motion.span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">/ 100</span>
          <span className={`mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>
            {theme.label}
          </span>
        </div>
      </div>

      {/* Delta indicator & Explanation */}
      <div className="mt-3 text-center w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700">
          {delta >= 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('dashboard.score_improved', { points: delta })}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('dashboard.score_declined', { points: delta })}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
          {explanation || t('dashboard.green_score_sub')}
        </p>
      </div>

      <button
        onClick={fetchScoreBreakdown}
        className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
      >
        <span>{t('dashboard.score_formula_link')}</span>
        <span>&rarr;</span>
      </button>

      {/* Modal: Transparent Score Breakdown */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  {normalizedScore}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{t('score_modal.title')}</h4>
                  <p className="text-xs text-gray-500">{t('score_modal.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-gray-600 bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 leading-relaxed">
                {t('score_modal.desc')}
              </p>

              {loadingBreakdown ? (
                <div className="py-8 text-center text-xs text-gray-400">{t('score_modal.loading')}</div>
              ) : breakdown ? (
                <div className="space-y-3">
                  {breakdown.components.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800">
                          {translateCompName(comp.name)}
                        </span>
                        <span className={`text-xs font-bold ${comp.score >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {t('score_modal.pts', { points: comp.score > 0 ? `+${comp.score}` : comp.score })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        {translateCompDesc(comp.name, comp.description)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-4">{t('score.details_unavailable')}</div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                {t('action.got_it')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
