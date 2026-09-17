import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Leaf,
  Scale,
  Award,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GreenPayLogo } from '../components/GreenPayLogo';
import { useLanguage } from '../context/LanguageContext';
import { Button, Input, Card, Badge, Alert } from '../components/ui';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [meterNumber, setMeterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!meterNumber.trim() || !password) {
      setErrorMessage(t('auth.error_required'));
      return;
    }

    setLoading(true);
    try {
      const session = await login(meterNumber.trim().toUpperCase(), password);
      if (session.role === 'ADMIN') {
        onNavigate('/admin');
      } else {
        onNavigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('auth.error_meter_password'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCitizen = () => {
    setMeterNumber('BESCOM-IND-104928');
    setPassword('Password123!');
    setErrorMessage(null);
  };

  const fillDemoAdmin = () => {
    setMeterNumber('ADM-BLR-001');
    setPassword('AdminSecret123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-slate-50/70">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Branding & Impact Column (Civic Tech Narrative) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-6 space-y-6 hidden sm:block"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bengaluru Civic-Tech Innovation</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Unified Waste Accountability & Citizen Rewards
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              GreenPay bridges citizens, authorized BBMP ward collectors, and municipal supervisors into an immutable, transparent ecological ledger.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                <Scale className="w-4 h-4" />
                <span>12,480 kg</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Verified Recyclables Diverted
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                <Award className="w-4 h-4" />
                <span>1,42,500 GP</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Green Points Issued to Citizens
              </p>
            </div>
          </div>

          {/* Civic Trust Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-900/5 border border-emerald-900/10 max-w-md">
            <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
            <span className="text-xs font-medium text-emerald-950">
              Verified by BBMP Municipal Ward Intelligence Standards
            </span>
          </div>
        </motion.div>

        {/* Right Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-200/80 relative">
            {/* Form Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <GreenPayLogo size="md" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t('auth.login_title')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('auth.login_subtitle')}
              </p>
            </div>

            {/* Polished Demo Access Section */}
            <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {t('auth.demo_chips_title')}
                </span>
                <Badge variant="neutral" size="xs">One-Click Fill</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillDemoCitizen}
                  className="p-2.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all text-left shadow-2xs group"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">
                      {t('auth.chip_citizen')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    Aarav (Ward 151)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="p-2.5 bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl transition-all text-left shadow-2xs group"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">
                      {t('auth.chip_admin')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    Supervisor Ramesh
                  </p>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5">
                <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.meter_label')}
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                placeholder={t('auth.meter_placeholder')}
                required
                leftIcon={<Zap className="w-4 h-4 text-emerald-700" />}
              />

              <Input
                label={t('auth.password_label')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                leftIcon={<Lock className="w-4 h-4 text-emerald-700" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? t('auth.btn_verifying') : t('auth.btn_sign_in')}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span>{t('auth.dont_have_account')}</span>
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 transition-colors"
              >
                {t('auth.register_here')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
