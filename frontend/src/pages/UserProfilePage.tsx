import React, { useState, useEffect } from 'react';
import {
  User,
  Zap,
  MapPin,
  Building,
  Phone,
  ShieldCheck,
  Flame,
  Lock,
  Calendar,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User as UserEntity } from '../types';
import { api } from '../services/api';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '../components/ui';

export const UserProfilePage: React.FC = () => {
  const { session } = useAuth();
  const { t, translateUserType } = useLanguage();
  const [userData, setUserData] = useState<UserEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<UserEntity>('/auth/me');
        setUserData(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-64 bg-slate-200/80 rounded-3xl" />
        <div className="h-64 bg-slate-200/80 rounded-3xl" />
      </div>
    );
  }

  const prof = userData?.profile;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.sub')}
        badge={<Badge variant="emerald" dot>BBMP Citizen Verification Active</Badge>}
      />

      {/* Citizen Identity Hero */}
      <Card>
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
              {prof?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {prof?.name || t('role.user')}
                </h1>
                <Badge variant="emerald" size="xs">
                  {translateUserType(prof?.user_type) || t('type.individual')}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {t('common.meter_number')}: <strong className="text-slate-800">{userData?.meter_number}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t('green_score')}
              </span>
              <span className="text-xl font-black text-emerald-950 mt-0.5 block">
                {prof?.green_score || 75}/100
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                {t('profile.streak_label')}
              </span>
              <span className="text-xl font-black text-amber-950 mt-0.5 block">
                {t('profile.streak_days', { days: prof?.streak_days || 1 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Specifications Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.details_header')}</CardTitle>
          <CardDescription>Official municipal account registration details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('profile.meter_label')}
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-700" />
                <span>{userData?.meter_number}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('profile.account_type')}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>{translateUserType(prof?.user_type) || t('type.individual')}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('profile.ward_label')}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>
                  Ward {prof?.ward_number || 151} • {prof?.ward_name || 'Koramangala'}
                </span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('profile.phone_label')}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>{prof?.phone_number || t('profile.not_provided')}</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('profile.address_label')}
            </span>
            <p className="text-sm font-medium text-slate-800 mt-1">
              {prof?.address}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
