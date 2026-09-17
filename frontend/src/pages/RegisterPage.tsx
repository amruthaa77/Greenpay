import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  User,
  Zap,
  MapPin,
  Building,
  Lock,
  Eye,
  EyeOff,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GreenPayLogo } from '../components/GreenPayLogo';
import { UserType } from '../types';
import { Button, Input, Card, Badge, Alert } from '../components/ui';

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [address, setAddress] = useState('');
  const [wardNumber, setWardNumber] = useState('');
  const [wardError, setWardError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('Individual');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength score 0 to 5
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.pwd_mismatch'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.pwd_min'));
      return;
    }

    const trimmedWard = wardNumber.trim();
    if (!trimmedWard || !/^\d+$/.test(trimmedWard)) {
      setWardError(t('auth.ward_invalid'));
      setErrorMessage(t('auth.ward_invalid'));
      return;
    }

    const parsedWard = parseInt(trimmedWard, 10);
    if (parsedWard <= 0) {
      setWardError(t('auth.ward_invalid'));
      setErrorMessage(t('auth.ward_invalid'));
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        meter_number: meterNumber.trim().toUpperCase(),
        address: address.trim(),
        ward_number: parsedWard,
        user_type: userType,
        phone_number: phoneNumber.trim() || undefined,
        password,
        confirm_password: confirmPassword,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#059669', '#34D399', '#FBBF24'],
      });

      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Registration failed. This meter number may already be registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10 bg-slate-50/70">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <GreenPayLogo size="md" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('auth.reg_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {t('auth.reg_subtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6">
            <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Account Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('auth.account_category')}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Step 1 of 4</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setUserType('Individual')}
                className={`py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  userType === 'Individual'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('type.individual_household')}</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('Commercial')}
                className={`py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  userType === 'Commercial'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('type.commercial_establishment')}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Identity */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Citizen Identity
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Step 2 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={userType === 'Individual' ? t('auth.name_label') : t('auth.org_name_label')}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={userType === 'Individual' ? 'e.g. Aarav Sharma' : 'e.g. Green Cafe Koramangala'}
                required
                leftIcon={<User className="w-4 h-4 text-emerald-700" />}
              />

              <Input
                label={t('auth.meter_label')}
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                placeholder={t('auth.meter_placeholder')}
                required
                leftIcon={<Zap className="w-4 h-4 text-emerald-700" />}
              />
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Premises Location
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Step 3 of 4</span>
            </div>

            <Input
              label={t('auth.address_label')}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('auth.address_placeholder')}
              required
              leftIcon={<MapPin className="w-4 h-4 text-emerald-700" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* BBMP WARD (STRICTLY MANUAL POSITIVE INTEGER INPUT) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('auth.ward_label')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={wardNumber}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      setWardNumber(cleanVal);
                      if (wardError) setWardError(null);
                    }}
                    placeholder={t('auth.ward_placeholder')}
                    required
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 ${
                      wardError
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20 text-rose-900'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/20'
                    }`}
                  />
                </div>
                {wardError ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{wardError}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400 font-normal">
                    Enter positive ward integer (e.g. 52, 151, 84)
                  </p>
                )}
              </div>

              {/* Optional Phone Number */}
              <Input
                label={t('auth.phone_label')}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98860 12345"
                leftIcon={<Phone className="w-4 h-4 text-emerald-700" />}
              />
            </div>
          </div>

          {/* Section 4: Security */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Security Credentials
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Step 4 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                label={t('auth.confirm_password_label')}
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                leftIcon={<Lock className="w-4 h-4 text-emerald-700" />}
              />
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Password Strength:</span>
                  <span
                    className={
                      pwdStrength <= 2
                        ? 'text-rose-600'
                        : pwdStrength <= 3
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {pwdStrength <= 2 ? 'Weak' : pwdStrength <= 3 ? 'Medium' : 'Strong'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 h-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-full rounded-full transition-all duration-200 ${
                        pwdStrength >= level
                          ? pwdStrength <= 2
                            ? 'bg-rose-500'
                            : pwdStrength <= 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {loading ? t('auth.btn_creating_account') : t('auth.btn_create_account')}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>{t('auth.already_have_account')}</span>{' '}
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 transition-colors"
          >
            {t('auth.sign_in_here')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
