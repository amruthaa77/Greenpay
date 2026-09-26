import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Recycle,
  Droplets,
  Zap,
  Info,
  ShieldCheck,
  TrendingUp,
  TreePine,
  ExternalLink,
} from 'lucide-react';
import { EnvironmentalImpact } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  StatCard,
} from '../components/ui';

export const EnvironmentalImpactPage: React.FC = () => {
  const { t } = useLanguage();
  const [impact, setImpact] = useState<EnvironmentalImpact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await api.get<EnvironmentalImpact>('/users/me/impact');
        setImpact(data);
      } catch (err) {
        console.error('Failed to load impact:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-200/80 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const formulas = impact?.formula_descriptions || {};

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('impact.page_title')}
        subtitle={t('impact.page_subtitle')}
        badge={<Badge variant="emerald" dot>{t('impact.page_badge')}</Badge>}
      />

      {/* 4 Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('dashboard.landfill_diverted')}
          value={`${impact?.landfill_diverted_kg ?? 0} kg`}
          subtitle="Diverted from Mandur / Doddaballapur dumpsites"
          variant="emerald"
          icon={<Recycle className="w-5 h-5 text-emerald-700" />}
        />

        <StatCard
          title={t('dashboard.co2_avoided')}
          value={`${impact?.co2_avoided_kg ?? 0} kg`}
          subtitle="Greenhouse gas emissions mitigated"
          variant="sky"
          icon={<Leaf className="w-5 h-5 text-sky-700" />}
        />

        <StatCard
          title={t('dashboard.water_conserved')}
          value={`${impact?.water_conserved_liters ?? 0} L`}
          subtitle="Industrial pulping water saved"
          variant="slate"
          icon={<Droplets className="w-5 h-5 text-blue-700" />}
        />

        <StatCard
          title={t('impact.trees_saved_title')}
          value={`${(impact as any)?.trees_saved_equivalent ?? Math.round((impact?.co2_avoided_kg ?? 0) / 21)}`}
          subtitle="Mature urban canopy equivalence"
          variant="emerald"
          icon={<TreePine className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Methodology & CPCB Audit Standards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <CardTitle>{t('impact.methodology_title')}</CardTitle>
          </div>
          <CardDescription>{t('impact.methodology_sub')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-emerald-900 block mb-1">
                Landfill Diversion (kg)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct physical weight summation of verified dry recyclable batches (paper, cardboards, plastics, metal cans) certified at BBMP collection centers.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-sky-900 block mb-1">
                CO2e Offset Factor
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard CPCB conversion formula attributing 1.42 kg CO2 equivalent avoided per kg of segregated plastic and paper recyclables diverted from anaerobic landfill decomposition.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
