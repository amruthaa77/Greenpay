import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound, Zap, User, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GreenPayLogo } from '../components/GreenPayLogo';

interface SecureAdminRegisterProps {
  onNavigate: (route: string) => void;
}

export const SecureAdminRegisterPage: React.FC<SecureAdminRegisterProps> = ({ onNavigate }) => {
  const { registerAdmin } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.pwd_mismatch'));
      return;
    }

    setLoading(true);
    try {
      await registerAdmin({
        name: name.trim(),
        meter_number: meterNumber.trim().toUpperCase(),
        password,
        confirm_password: confirmPassword,
        access_code: accessCode.trim(),
      });
      onNavigate('/admin');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authorization failed: Invalid administrator invitation access code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillSecretCode = () => {
    setAccessCode('GREENPAY_BBMP_ADMIN_2025');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-4 py-6 sm:py-10 bg-gray-900/95">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-9 shadow-2xl border border-gray-100 relative"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            {t('auth.admin_badge')}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {t('auth.admin_title')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {t('auth.admin_subtitle')}
          </p>
        </div>

        {/* Demo fast-fill shortcut for judges */}
        <div className="mb-5 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-purple-900">
            <KeyRound className="w-3.5 h-3.5 text-purple-700" />
            <span>{t('auth.admin_hackathon_code')}</span>
          </div>
          <button
            type="button"
            onClick={fillSecretCode}
            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-mono font-bold transition-colors"
          >
            {t('auth.admin_insert_code')}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t('auth.name_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4 text-purple-700" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BBMP Supervisor Ramesh"
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t('auth.admin_meter_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Zap className="w-4 h-4 text-purple-700" />
              </div>
              <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                placeholder={t('auth.admin_meter_placeholder')}
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t('auth.admin_code_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4 text-purple-700" />
              </div>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder={t('auth.admin_code_placeholder')}
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t('auth.password_label')}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t('auth.confirm_password_label')}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>{t('auth.admin_provisioning')}</span>
            ) : (
              <>
                <span>{t('auth.btn_admin_provision')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => onNavigate('/login')}
            className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
          >
            {t('auth.back_to_login')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
