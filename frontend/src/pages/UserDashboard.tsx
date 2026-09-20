import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Leaf,
  Recycle,
  Droplets,
  TrendingUp,
  History,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Scale,
  Award,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GreenScoreGauge } from '../components/GreenScoreGauge';
import { WasteJourneyModal } from '../components/WasteJourneyModal';
import { WasteEntry, EnvironmentalImpact } from '../types';
import { api } from '../services/api';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  StatusBadge,
  Button,
  ChartCard,
  EmptyState,
} from '../components/ui';

interface UserDashboardProps {
  onNavigate: (route: string) => void;
}

const CATEGORY_COLORS = ['#10B981', '#059669', '#3B82F6', '#F59E0B', '#64748B'];

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const { t, translateWasteType, translateClaimStatus, translateUserType, getGreeting } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);

  const fetchDashboard = async () => {
    try {
      const data = await api.get<any>('/users/me/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="h-32 bg-slate-200/80 rounded-3xl" />
          <div className="h-32 bg-slate-200/80 rounded-3xl" />
          <div className="h-32 bg-slate-200/80 rounded-3xl" />
          <div className="h-32 bg-slate-200/80 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200/80 rounded-3xl" />
          <div className="h-80 bg-slate-200/80 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const user = dashboardData?.user;
  const greenScore = dashboardData?.green_score;
  const wallet = dashboardData?.wallet;
  const recentWaste: WasteEntry[] = dashboardData?.recent_waste || [];
  const impact: EnvironmentalImpact = dashboardData?.impact;

  // Calculate total waste recorded
  const totalWasteKg = recentWaste.reduce((acc: number, item: WasteEntry) => acc + (item.weight_kg || 0), 0);

  // Group waste by category for visual pie chart
  const categoryData = Object.entries(
    recentWaste.reduce((acc: Record<string, number>, item: WasteEntry) => {
      acc[item.waste_type] = (acc[item.waste_type] || 0) + item.weight_kg;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }));

  // Trend data for area chart from recent collections
  const trendData = [...recentWaste]
    .slice(0, 7)
    .reverse()
    .map((item, idx) => ({
      date: item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`,
      weight: item.weight_kg,
      reward: item.reward_amount,
    }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Personalized Welcome Banner */}
      <div className="bg-linear-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <Badge variant="emerald" size="xs">
                {translateUserType(user?.user_type) || t('type.individual')}
              </Badge>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-xs font-semibold">
                {t('common.ward')} {user?.ward_number} • {user?.ward_name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold">
                {user?.meter_number}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {getGreeting()}, {user?.name || 'Citizen'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-xl">
              You are actively segregating waste and making a measurable positive impact in Ward {user?.ward_number || 151}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/wallet')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
            >
              🌱 {wallet?.available_points ?? wallet?.current_balance ?? 0} GP
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title={t('score.title')}
          value={`🌱 ${greenScore?.score?.toFixed(0) || 75}`}
          subtitle={t('score.positive_status')}
          variant="emerald"
          icon={<Leaf className="w-5 h-5 text-emerald-700" />}
          trend={{
            value: `+${greenScore?.delta || 0}`,
            isPositive: (greenScore?.delta || 0) >= 0,
            label: 'this month',
          }}
        />

        <StatCard
          title="Total Waste"
          value={`${totalWasteKg.toFixed(1)} kg`}
          subtitle="Certified segregated weight"
          variant="sky"
          icon={<Scale className="w-5 h-5 text-sky-700" />}
        />

        <StatCard
          title={t('dashboard.total_earned')}
          value={`${wallet?.total_earned_points ?? wallet?.total_earned ?? 0} GP`}
          subtitle="Earned Green Points"
          variant="emerald"
          icon={<Award className="w-5 h-5 text-emerald-700" />}
        />

        <StatCard
          title="Collections"
          value={recentWaste.length}
          subtitle="Municipal door-to-door logs"
          variant="purple"
          icon={<Layers className="w-5 h-5 text-purple-700" />}
        />
      </div>

      {/* Main Grid: Green Score Gauge + Recharts Waste Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Large Green Score Gauge Card */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="border-b-0 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('score.title')}</CardTitle>
                  <CardDescription>Evaluated across segregation accuracy & regularity</CardDescription>
                </div>
                <Badge variant="emerald" dot>Tier 1 Citizen</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <GreenScoreGauge
                score={greenScore?.score || 75}
                delta={greenScore?.delta || 0}
                explanation={greenScore?.explanation}
                size={190}
              />
              <p className="text-xs text-center text-slate-500 max-w-xs mt-3 leading-relaxed">
                {greenScore?.explanation || "You're making a positive contribution to your ward."}
              </p>
            </CardContent>
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Ward 151 Benchmark:</span>
              <span className="text-xs font-bold text-slate-800">Top 15% in Koramangala</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Waste Collection Trends (Recharts) */}
        <div className="lg:col-span-7 min-w-0">
          <ChartCard
            title="Waste Collection Activity"
            subtitle="Recent certified weighments & reward progression"
          >
            {trendData.length > 0 ? (
              <div className="h-56 sm:h-72 w-full pt-2 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      unit="kg"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '1rem',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#wasteGrad)"
                      name="Weight (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={<Recycle className="w-6 h-6 text-emerald-600" />}
                title="No collection trend data yet"
                description="Your waste weighments will chart here once certified by the ward supervisor."
              />
            )}
          </ChartCard>
        </div>
      </div>

      {/* Rewards You Can Redeem Preview Section */}
      <Card className="p-6 bg-linear-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border-emerald-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('rewards.redeem_preview_title') || 'Essential Goods You Can Redeem'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {t('rewards.redeem_preview_desc') || 'Redeem your Green Points for daily civic essentials at your local ward collection center.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/rewards')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            {t('rewards.view_all_catalogue') || 'Browse All Goods'}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {[
            { name: 'Table Salt', qty: '1 kg', cost: 100, icon: '🧂' },
            { name: 'Sona Masoori Rice', qty: '2 kg', cost: 200, icon: '🍚' },
            { name: 'Whole Wheat Atta', qty: '1 kg', cost: 300, icon: '🌾' },
            { name: 'Cooking Oil', qty: '1 L', cost: 400, icon: '🛢️' },
            { name: 'Toor Dal', qty: '1 kg', cost: 500, icon: '🫘' },
          ].map((item) => {
            const userBalance = wallet?.available_points ?? wallet?.current_balance ?? 0;
            const canAfford = userBalance >= item.cost;
            return (
              <div
                key={item.name}
                onClick={() => onNavigate('/rewards')}
                className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all hover:scale-102 flex flex-col justify-between ${
                  canAfford
                    ? 'bg-white border-emerald-300 shadow-xs hover:border-emerald-600'
                    : 'bg-white/60 border-slate-200 opacity-80'
                }`}
              >
                <div>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.qty}</span>
                </div>
                <div className="mt-2.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                      canAfford
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.cost} GP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Collections Timeline */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>{t('dashboard.recent_title')}</CardTitle>
            <CardDescription>{t('dashboard.recent_sub')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/waste-history')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            {t('action.view_all')}
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {recentWaste.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Recycle className="w-6 h-6 text-emerald-600" />}
                title={t('dashboard.no_records')}
                description={t('dashboard.no_records_sub')}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentWaste.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                      <Recycle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {translateWasteType(entry.waste_type)}
                        </span>
                        <StatusBadge status={entry.claim_status || 'PROCESSED'} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black text-slate-900">
                        {entry.weight_kg} kg
                      </p>
                      <p className="text-xs font-bold text-emerald-700">
                        +{entry.reward_amount} GP
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedEntry(entry)}
                      className="text-slate-500 hover:text-emerald-800"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      {t('action.inspect')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waste Journey Modal */}
      {selectedEntry && (
        <WasteJourneyModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};
