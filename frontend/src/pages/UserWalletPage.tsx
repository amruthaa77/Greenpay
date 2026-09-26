import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Gift,
  Coins,
  Sparkles,
  Package,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { WalletOverview, RewardTransaction } from '../types';
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
  Button,
  EmptyState,
} from '../components/ui';

interface UserWalletPageProps {
  onNavigate?: (route: string) => void;
}

export const UserWalletPage: React.FC<UserWalletPageProps> = ({ onNavigate }) => {
  const { t, translateTransactionType } = useLanguage();
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await api.get<WalletOverview>('/users/me/rewards');
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/80 rounded-3xl" />
        <div className="h-80 bg-slate-200/80 rounded-3xl" />
      </div>
    );
  }

  const txs: RewardTransaction[] = wallet?.recent_transactions || [];
  const availablePoints = wallet?.available_points ?? wallet?.current_balance ?? 0;
  const totalEarnedPoints = wallet?.total_earned_points ?? wallet?.total_earned ?? 0;
  const totalRedeemedPoints = wallet?.total_redeemed_points ?? wallet?.total_deductions ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('wallet.title') || 'Green Points Wallet & Ledger'}
        subtitle={t('wallet.sub') || 'Track your earned Green Points, points deductions, and essential grocery redemptions.'}
        badge={<Badge variant="emerald" dot>BBMP Green Escrow Verified</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Gift className="w-4 h-4" />}
            onClick={() => onNavigate && onNavigate('/rewards')}
          >
            {t('rewards.redeem_goods_cta') || 'Redeem Essential Goods'}
          </Button>
        }
      />

      {/* Large Green Points Wallet Balance Card */}
      <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/60 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('wallet.badge') || 'Municipal Green Points Balance'}</span>
            </span>
            <p className="text-xs text-emerald-200/80 mt-3 font-medium">
              {t('wallet.current_balance_label') || 'Available Green Points'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {availablePoints.toLocaleString()}
              </span>
              <span className="text-xl font-bold text-emerald-300">GP</span>
            </div>
            <p className="text-xs text-emerald-200/70 mt-2 max-w-md leading-relaxed">
              {t('wallet.balance_desc') || 'Your verified Green Points can be redeemed for essential food items (Salt, Rice, Wheat, Oil, Dal) at any BBMP Ward Collection Centre.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-3.5 sm:p-6 rounded-2xl border border-white/10 shrink-0">
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-[11px] text-emerald-200 font-medium">{t('wallet.total_credits') || 'Total Earned'}</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  +{totalEarnedPoints.toLocaleString()} GP
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-[11px] text-amber-200 font-medium">{t('wallet.total_redeemed') || 'Points Redeemed'}</span>
                <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                  -{totalRedeemedPoints.toLocaleString()} GP
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <button
                onClick={() => onNavigate && onNavigate('/rewards')}
                className="w-full sm:w-auto px-5 py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-md hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('rewards.browse_catalogue') || 'Browse Catalogue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Green Points Policy Notice */}
      <div className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed font-medium">
          <strong>{t('wallet.policy_title') || 'Civic Accountability Rule'}:</strong>{' '}
          {t('wallet.schedule_notice') || 'Paper & Cardboard: 25 GP/kg, Recyclable Metals & Cans: 50 GP/kg, Clean Plastic Packaging: 100 GP/kg. Points are immediately deducted upon placing an essential goods redemption pass. Penalties apply for contaminated or wet waste.'}
        </div>
      </div>

      {/* Green Points Ledger Cards / Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>{t('wallet.ledger_title') || 'Green Points Activity Ledger'}</CardTitle>
            <CardDescription>{t('wallet.ledger_sub') || 'Complete, immutable log of waste collections, rewards earned, and groceries redeemed.'}</CardDescription>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {t('wallet.tx_count', { count: txs.length }) || `${txs.length} total transactions`}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {txs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Coins className="w-6 h-6 text-emerald-600" />}
                title={t('wallet.no_tx') || 'No points activity recorded yet'}
                description={t('wallet.no_tx_sub') || 'Hand over segregated waste during morning collections to start earning Green Points!'}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {txs.map((tx) => {
                const isRedemption = tx.transaction_type === 'REDEEM' || tx.calculation_breakdown?.toLowerCase().includes('redeemed');
                const isCredit = !isRedemption && (tx.transaction_type === 'REWARD' || tx.amount > 0);

                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isRedemption
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : isCredit
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {isRedemption ? (
                          <Gift className="w-5 h-5" />
                        ) : isCredit ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {isRedemption ? 'Essential Good Redemption' : translateTransactionType(tx.transaction_type)}
                          </span>
                          <Badge
                            variant={isRedemption ? 'amber' : isCredit ? 'emerald' : 'rose'}
                            size="xs"
                          >
                            {isRedemption ? 'REDEEMED' : isCredit ? 'CREDIT' : 'DEBIT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                          {tx.calculation_breakdown || (isCredit ? 'Reward points credited for verified segregation' : 'Deduction logged')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span
                          className={`text-base font-black ${
                            isRedemption
                              ? 'text-amber-700'
                              : isCredit
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {isCredit ? `+${tx.amount} GP` : `-${Math.abs(tx.amount)} GP`}
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : 'Recent'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
