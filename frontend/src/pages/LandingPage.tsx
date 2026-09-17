import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Award,
  BarChart3,
  Recycle,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Globe,
  Truck,
  Cpu,
  Gift,
  Leaf,
  Scale,
  ShoppingBag,
  Coins,
  Database,
} from 'lucide-react';
import { GreenPayLogo } from '../components/GreenPayLogo';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  onOpenDemoTour: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenDemoTour }) => {
  const { language, setLanguage, t } = useLanguage();

  // 4-Step Process
  const steps = [
    {
      num: t('landing.step1_num') || '01',
      title: t('landing.step1_title') || 'Segregate',
      desc: t('landing.step1_desc') || 'Separate wet, dry, and recyclable waste at source before doorstep handover.',
      icon: Recycle,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      num: t('landing.step2_num') || '02',
      title: t('landing.step2_title') || 'Verify',
      desc: t('landing.step2_desc') || 'Municipal collector certifies weight and segregation quality via digital scale.',
      icon: Scale,
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      iconBg: 'bg-teal-600 text-white',
    },
    {
      num: t('landing.step3_num') || '03',
      title: t('landing.step3_title') || 'Earn',
      desc: t('landing.step3_desc') || 'Green Points are mathematically computed and credited instantly to your meter wallet.',
      icon: Leaf,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-700 text-white',
    },
    {
      num: t('landing.step4_num') || '04',
      title: t('landing.step4_title') || 'Redeem',
      desc: t('landing.step4_desc') || 'Exchange accumulated Green Points for essential groceries at your ward distribution hub.',
      icon: Gift,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-600 text-white',
    },
  ];

  // Essential Goods Preview (5 Items)
  const essentialGoods = [
    {
      name: t('landing.goods_item1') || 'Table Salt – 1 kg',
      points: '100 GP',
      emoji: '🧂',
      category: 'Cooking Staple',
    },
    {
      name: t('landing.goods_item2') || 'Sona Masoori Rice – 2 kg',
      points: '200 GP',
      emoji: '🍚',
      category: 'Grains & Rice',
    },
    {
      name: t('landing.goods_item3') || 'Whole Wheat Atta – 1 kg',
      points: '300 GP',
      emoji: '🌾',
      category: 'Flour & Atta',
    },
    {
      name: t('landing.goods_item4') || 'Sunflower Cooking Oil – 1 L',
      points: '400 GP',
      emoji: '🛢️',
      category: 'Edible Oils',
    },
    {
      name: t('landing.goods_item5') || 'Toor Dal – 1 kg',
      points: '500 GP',
      emoji: '🫘',
      category: 'Pulses & Dal',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Municipal Prototype Notice Banner */}
      <div className="bg-emerald-950 text-emerald-200 dark:text-emerald-300 text-xs py-2 px-4 text-center font-medium border-b border-emerald-900/80 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span>{t('app.prototype_notice')}</span>
      </div>

      {/* Decorative Subtle Background Glow */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:opacity-20"
          />
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Small Badges */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex flex-wrap items-center justify-center gap-2 mb-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('landing.badge')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                <span>🏙️ {t('landing.bengaluru_sub')}</span>
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]"
            >
              {t('landing.hero_title')}{' '}
              <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-300">
                {t('landing.hero_subtitle')}
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
            >
              {t('landing.hero_desc')}
            </motion.p>

            {/* HERO CTAS - Prominent, high-contrast, fully visible */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              {/* PRIMARY CTA: Access Citizen Portal */}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-700/25 dark:shadow-emerald-950/60 hover:shadow-xl hover:shadow-emerald-700/30 ring-2 ring-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-500/30"
              >
                <Leaf className="w-4 h-4 text-emerald-200" />
                <span>{t('landing.cta_citizen')}</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>

              {/* SECONDARY CTA: View How It Works */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('landing.cta_how_it_works')}</span>
              </button>

              {/* HACKATHON GUIDED TOUR CTA */}
              <button
                type="button"
                onClick={onOpenDemoTour}
                className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('landing.cta_tour')}</span>
              </button>
            </motion.div>

            {/* Quick Demo Credentials Bar */}
            <div className="mt-8 p-3.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs max-w-xl mx-auto flex flex-wrap items-center justify-around gap-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t('landing.quick_test')}</span>
              <button
                onClick={() => onNavigate('/login')}
                className="font-mono text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {t('landing.quick_citizen')}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => onNavigate('/login')}
                className="font-mono text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                {t('landing.quick_supervisor')}
              </button>
            </div>
          </div>

          {/* HERO VISUAL: Closed-Loop Ecosystem & Live Green Points Visual Card */}
          <div id="green-points" className="mt-14 sm:mt-18 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Interactive Closed-Loop Process Card (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {t('landing.lifecycle_badge')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                    BBMP WARD-150 ESCROW
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('landing.lifecycle_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Every gram of household waste is certified at your doorstep and digitally transformed into civic ration purchasing power.
                </p>
              </div>

              {/* Visual Flow diagram */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-5 gap-2 text-center items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5">Citizen</span>
                  <span className="text-[9px] text-slate-400">Meter ID</span>
                </div>

                <div className="text-slate-300 dark:text-slate-700 font-bold">→</div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5">Weighed</span>
                  <span className="text-[9px] text-slate-400">Certified Net</span>
                </div>

                <div className="text-slate-300 dark:text-slate-700 font-bold">→</div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5">Redeem</span>
                  <span className="text-[9px] text-slate-400">Staples</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                  Zero Cash Owed • 100% Escrow Backed
                </span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 underline cursor-pointer" onClick={() => onNavigate('/login')}>
                  View Ledger →
                </span>
              </div>
            </motion.div>

            {/* Right: Dedicated Green Points Showcase Card (5 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-emerald-700/40 shadow-2xl flex flex-col justify-between relative overflow-hidden"
            >
              {/* Background ambient pattern */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-600/40 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('landing.gp_card_title')}</span>
                  </span>
                  <span className="text-[11px] text-emerald-200/70 font-mono">CPCB R-RATE</span>
                </div>

                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  {t('landing.gp_card_sub')}
                </p>

                {/* Point reward tier lines */}
                <div className="mt-4 space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥗</span>
                      <span className="text-xs font-bold text-white">{t('landing.gp_wet')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">+25 GP</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📦</span>
                      <span className="text-xs font-bold text-white">{t('landing.gp_dry')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">+50 GP</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧴</span>
                      <span className="text-xs font-bold text-white">{t('landing.gp_plastics')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">+100 GP</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-200">
                  {t('landing.gp_redeem_hint')}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Redeem</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* SECTION: ESSENTIAL GOODS PREVIEW (5 Mini-Cards) */}
      <section id="essential-goods" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('landing.goods_badge')}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('landing.goods_title')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('landing.goods_sub')}
            </p>
          </div>

          {/* 5 Mini-Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {essentialGoods.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-black shadow-xs">
                      {item.points}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Ward Center Hub</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Verified</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <span>{t('landing.goods_browse_cta')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: HOW IT WORKS (4 Steps with connecting flow) */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-black uppercase tracking-wider mb-3">
            <Recycle className="w-3.5 h-3.5" />
            <span>{t('landing.how_badge')}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('landing.how_title')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('landing.how_sub')}
          </p>
        </div>

        {/* 4 Steps Row with Connecting Line on Desktop */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-300 to-amber-200 dark:from-emerald-800 dark:via-teal-800 dark:to-amber-800 -z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col items-center text-center group"
                >
                  <div className="relative mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black border ${step.badgeColor}`}>
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION: CIVIC INTELLIGENCE (BENTO GRID) */}
      <section id="civic-tech" className="py-16 sm:py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>{t('landing.bento_badge')}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('landing.bento_title')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('landing.bento_sub')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* HERO BENTO CARD: Waste Accountability (Span 2) */}
            <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-black text-xl text-slate-900 dark:text-white">
                  {t('landing.bento_hero_title')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                  {t('landing.bento_hero_desc')}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Isolation</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Strict Tenant</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Zero-Ghost</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Auth</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Meter-Bound</p>
                </div>
              </div>
            </div>

            {/* BENTO CARD 2: AI-Assisted Classification */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('landing.bento_ai_title')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('landing.bento_ai_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Human Confirmation</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">94% Confidence</span>
              </div>
            </div>

            {/* BENTO CARD 3: BBMP Ward Intelligence */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('landing.bento_ward_title')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('landing.bento_ward_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Zonal Analytics</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">198 Wards</span>
              </div>
            </div>

            {/* BENTO CARD 4: Immutable Civic Audit Trail */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('landing.bento_audit_title')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('landing.bento_audit_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Integrity</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Tamper-Evident</span>
              </div>
            </div>

            {/* BENTO CARD 5: Offline-First Field Operations (Span 2 on lg) */}
            <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-4">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('landing.bento_offline_title')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('landing.bento_offline_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Zero-Network Mode</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">UUID Auto-Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL PRE-FOOTER CTA SECTION */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to Transform Your Household Waste?
          </h2>
          <p className="text-emerald-100/80 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Join Bengaluru citizens earning Green Points every morning for verified, segregated waste collections.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/register')}
              className="px-7 py-3.5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-2xl text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t('auth.btn_create_account')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="px-7 py-3.5 bg-emerald-950/60 hover:bg-emerald-950 text-white border border-emerald-500/40 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t('landing.cta_citizen')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* POLISHED CIVIC FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          {/* Col 1: Branding */}
          <div className="md:col-span-1 space-y-3">
            <GreenPayLogo size="sm" showText={true} />
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing.footer_tagline')}
            </p>
            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
              BBMP Prototype v2.4
            </span>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-2.5 text-xs">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              {t('landing.footer_platform')}
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.nav_how_it_works')}
                </button>
              </li>
              <li>
                <button onClick={() => {
                  const el = document.getElementById('green-points');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.nav_green_points')}
                </button>
              </li>
              <li>
                <button onClick={() => {
                  const el = document.getElementById('essential-goods');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.nav_rewards')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.cta_citizen')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Municipal Operations */}
          <div className="space-y-2.5 text-xs">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              {t('landing.footer_municipal')}
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => {
                  const el = document.getElementById('civic-tech');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.bento_hero_title')}
                </button>
              </li>
              <li>
                <button onClick={() => {
                  const el = document.getElementById('civic-tech');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-white transition-colors cursor-pointer">
                  {t('landing.bento_ward_title')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/login')} className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                  {t('landing.footer_staff')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/secure-admin-registration')} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                  Supervisor Setup
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Localization & Theme */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              {t('landing.footer_languages')} & Theme
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'kn'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Theme:</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <span>{t('landing.footer_prototype_note')}</span>
          <span>{t('app.prototype_disclaimer')}</span>
        </div>
      </footer>
    </div>
  );
};
