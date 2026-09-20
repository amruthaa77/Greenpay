import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RewardItem, RewardRedemption, WalletOverview } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { StatCardSkeleton, TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Gift,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ArrowRight,
  Lock,
  Copy,
  Check,
  Package,
  HelpCircle,
} from 'lucide-react';

interface EssentialRewardsPageProps {
  onNavigate?: (route: string) => void;
}

export const EssentialRewardsPage: React.FC<EssentialRewardsPageProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'catalogue' | 'my-redemptions'>('catalogue');
  const [items, setItems] = useState<RewardItem[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redemption flow state
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [successRedemption, setSuccessRedemption] = useState<RewardRedemption | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catalogueData, redemptionsData, walletData] = await Promise.all([
        api.get<RewardItem[]>('/rewards/catalogue'),
        api.get<RewardRedemption[]>('/rewards/my-redemptions'),
        api.get<WalletOverview>('/users/me/rewards'),
      ]);
      setItems(catalogueData);
      setMyRedemptions(redemptionsData);
      setWallet(walletData);
    } catch (err: any) {
      setError(err.message || 'Unable to load rewards catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenConfirm = (item: RewardItem) => {
    setSelectedItem(item);
    setRedeemError(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedItem) return;
    try {
      setRedeeming(true);
      setRedeemError(null);
      const result = await api.post<RewardRedemption>('/rewards/redeem', {
        reward_item_id: selectedItem.id,
      });

      // Update local wallet points immediately
      if (wallet) {
        const newAvailable = Math.max(0, (wallet.available_points ?? wallet.current_balance) - selectedItem.points_cost);
        const newRedeemed = (wallet.total_redeemed_points ?? 0) + selectedItem.points_cost;
        setWallet({
          ...wallet,
          available_points: newAvailable,
          current_balance: newAvailable,
          total_redeemed_points: newRedeemed,
        });
      }

      // Add to redemptions list
      setMyRedemptions([result, ...myRedemptions]);

      // Decrement stock locally
      setItems(items.map(it => it.id === selectedItem.id ? { ...it, stock_quantity: Math.max(0, it.stock_quantity - 1) } : it));

      setConfirmModalOpen(false);
      setSuccessRedemption(result);
    } catch (err: any) {
      setRedeemError(err.message || 'Redemption failed. Please check your Green Points balance.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const availablePoints = wallet?.available_points ?? wallet?.current_balance ?? 0;
  const totalRedeemedPoints = wallet?.total_redeemed_points ?? 0;
  const activeRedemptionsCount = myRedemptions.filter(r => ['Requested', 'Approved', 'Ready for Collection'].includes(r.status)).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Requested':
        return <Badge variant="amber">{t('rewards.status_requested') || 'Requested'}</Badge>;
      case 'Approved':
        return <Badge variant="sky">{t('rewards.status_approved') || 'Approved'}</Badge>;
      case 'Ready for Collection':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <Package className="w-3.5 h-3.5" />
            {t('rewards.status_ready') || 'Ready for Pickup'}
          </span>
        );
      case 'Collected':
        return <Badge variant="emerald">{t('rewards.status_collected') || 'Collected'}</Badge>;
      case 'Rejected':
      case 'Cancelled':
        return <Badge variant="rose">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('rewards.title') || 'Essential Rewards Catalogue'}
        subtitle={t('rewards.subtitle') || 'Turn your segregated waste into daily essentials: Salt, Rice, Wheat, Cooking Oil, and Dal.'}
        badge={<Badge variant="emerald" dot>BBMP Fair-Price Grid</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate && onNavigate('/wallet')}
            >
              {t('rewards.view_points_ledger') || 'Green Points Wallet'}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert type="error" title="Error loading catalogue" message={error} />
      )}

      {/* Top Highlight Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-linear-to-br from-emerald-800 to-teal-950 text-white border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                {t('rewards.available_balance') || 'Available Green Points'}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{availablePoints.toLocaleString()}</span>
              <span className="text-sm font-bold text-emerald-300">GP</span>
            </div>
            <p className="mt-2 text-xs text-emerald-100/80">
              {t('rewards.balance_tip') || 'Deducted immediately upon redemption • Earn more by sorting waste'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('rewards.total_redeemed') || 'Points Redeemed'}
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totalRedeemedPoints.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-500">GP</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {myRedemptions.filter(r => r.status === 'Collected').length} {t('rewards.items_collected') || 'orders fulfilled successfully'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('rewards.active_requests') || 'Active Redemptions'}
              </span>
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{activeRedemptionsCount}</span>
              <span className="text-xs font-bold text-slate-500">{t('rewards.in_progress') || 'in progress'}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {activeRedemptionsCount > 0
                ? (t('rewards.pickup_ready_hint') || 'Check pickup pass below to collect from ward center')
                : (t('rewards.no_active_hint') || 'Ready to pick up your next grocery item')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`pb-2.5 sm:pb-3 px-1.5 sm:px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'catalogue'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t('rewards.tab_catalogue') || 'Essential Goods Catalogue'}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-redemptions')}
          className={`pb-2.5 sm:pb-3 px-1.5 sm:px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'my-redemptions'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t('rewards.tab_my_redemptions') || 'My Redemptions & Passes'}</span>
          {myRedemptions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {myRedemptions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Essential Goods Catalogue */}
      {activeTab === 'catalogue' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map(n => (
                <StatCardSkeleton key={n} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-6 h-6 text-emerald-600" />}
              title={t('rewards.empty_catalogue') || 'No reward items available'}
              description={t('rewards.empty_catalogue_desc') || 'The municipal civil supplies team is currently replenishing inventory.'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => {
                const canAfford = availablePoints >= item.points_cost;
                const deficit = Math.round(item.points_cost - availablePoints);
                const isOutOfStock = item.stock_quantity <= 0;

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden flex flex-col justify-between border-slate-200/80 hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Card Header with Icon and Badge */}
                      <div className="p-6 pb-4 bg-linear-to-b from-slate-50/80 to-white flex items-start justify-between border-b border-slate-100">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-transform">
                          {item.icon}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-800 text-white shadow-xs">
                            {item.points_cost} GP
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {item.quantity_label}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className={`text-[11px] font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-slate-500'}`}>
                            {isOutOfStock ? (t('rewards.out_of_stock') || 'Out of Stock') : `${item.stock_quantity} in stock`}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                          {item.description || 'BBMP authorized municipal food supplies grade.'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer with CTA */}
                    <div className="p-6 pt-0">
                      {isOutOfStock ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled
                          leftIcon={<Lock className="w-3.5 h-3.5" />}
                        >
                          {t('rewards.out_of_stock') || 'Currently Out of Stock'}
                        </Button>
                      ) : canAfford ? (
                        <Button
                          variant="primary"
                          className="w-full shadow-xs"
                          leftIcon={<Gift className="w-4 h-4" />}
                          onClick={() => handleOpenConfirm(item)}
                        >
                          {t('rewards.redeem_now') || `Redeem for ${item.points_cost} GP`}
                        </Button>
                      ) : (
                        <div className="space-y-1.5">
                          <Button
                            variant="secondary"
                            className="w-full opacity-70 cursor-not-allowed bg-slate-100 text-slate-500"
                            disabled
                            leftIcon={<Lock className="w-3.5 h-3.5" />}
                          >
                            {t('rewards.need_more_gp', { count: deficit }) || `Need ${deficit} More GP`}
                          </Button>
                          <p className="text-[10px] text-center text-slate-400 font-medium">
                            {t('rewards.earn_hint') || 'Hand over 2 kg recyclable waste to earn this!'}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Redemptions & Passes */}
      {activeTab === 'my-redemptions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : myRedemptions.length === 0 ? (
            <EmptyState
              icon={<Package className="w-6 h-6 text-emerald-600" />}
              title={t('rewards.no_redemptions') || 'No redemptions yet'}
              description={t('rewards.no_redemptions_desc') || 'You have not redeemed any items yet. Select an essential good from the catalogue to get your municipal pickup pass.'}
              action={
                <Button variant="primary" onClick={() => setActiveTab('catalogue')}>
                  {t('rewards.browse_catalogue') || 'Browse Essential Goods'}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {myRedemptions.map(red => (
                <Card key={red.id} className="p-5 border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Item Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                        {red.reward_name.includes('Salt') ? '🧂' : red.reward_name.includes('Rice') ? '🍚' : red.reward_name.includes('Wheat') ? '🌾' : red.reward_name.includes('Oil') ? '🛢️' : red.reward_name.includes('Dal') ? '🫘' : '📦'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{red.reward_name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {red.quantity_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="font-bold text-emerald-800">-{red.points_spent} GP</span>
                          <span>•</span>
                          <span>{new Date(red.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{red.pickup_location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pass PIN & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      {/* Pass Code Badge */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {t('rewards.pickup_pin') || 'Collection Pass PIN'}
                          </span>
                          <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                            {red.collection_pin}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyPin(red.collection_pin)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                          title="Copy Pass PIN"
                        >
                          {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-end">
                        {getStatusBadge(red.status)}
                      </div>
                    </div>
                  </div>

                  {red.admin_notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span><strong>Supervisor Note:</strong> {red.admin_notes}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => !redeeming && setConfirmModalOpen(false)}
        title={t('rewards.confirm_title') || 'Confirm Essential Good Redemption'}
        maxWidth="md"
      >
        {selectedItem && (
          <div className="space-y-5">
            {redeemError && (
              <Alert type="error" title="Redemption Error" message={redeemError} />
            )}

            {/* Selected item preview */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-3xl shadow-xs">
                {selectedItem.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedItem.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-emerald-800">{selectedItem.quantity_label}</span>
                  <span>•</span>
                  <span>{selectedItem.category}</span>
                </div>
              </div>
            </div>

            {/* Points deduction breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t('rewards.current_points') || 'Current Available Green Points'}:</span>
                <span className="font-bold text-slate-900">{availablePoints} GP</span>
              </div>
              <div className="flex items-center justify-between text-rose-600 font-bold">
                <span>{t('rewards.deduction') || 'Redemption Points Cost'}:</span>
                <span>-{selectedItem.points_cost} GP</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-slate-900 text-sm">
                <span>{t('rewards.remaining_points') || 'Remaining Balance After'}:</span>
                <span className="text-emerald-800">{Math.max(0, availablePoints - selectedItem.points_cost)} GP</span>
              </div>
            </div>

            {/* Ward Collection Pickup Info */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-0.5">{t('rewards.pickup_hub') || 'Collection Hub'}:</strong>
                <span>
                  {session?.ward_name
                    ? `BBMP Ward ${session.ward_number ?? ''} (${session.ward_name}) Dry Waste Collection Centre`
                    : 'Authorized BBMP Dry Waste Collection Center'}
                </span>
                <p className="mt-1 text-slate-500 text-[11px]">
                  Points will be deducted immediately from your available wallet upon confirmation.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpen(false)}
                disabled={redeeming}
              >
                {t('rewards.cancel') || 'Cancel'}
              </Button>
              <Button
                variant="primary"
                isLoading={redeeming}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleConfirmRedeem}
              >
                {t('rewards.confirm_btn') || `Deduct ${selectedItem.points_cost} GP & Redeem`}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Redemption Success Modal (Pass Generator) */}
      <Modal
        isOpen={!!successRedemption}
        onClose={() => setSuccessRedemption(null)}
        title={t('rewards.pass_title') || 'Digital Municipal Collection Pass Issued! 🎉'}
        maxWidth="md"
      >
        {successRedemption && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {t('rewards.pass_success_title') || 'Redemption Successfully Placed!'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {t('rewards.pass_success_desc') || `Your request for ${successRedemption.quantity_label} ${successRedemption.reward_name} has been verified and registered.`}
              </p>
            </div>

            {/* Municipal Collection Pass Slip */}
            <div className="bg-linear-to-b from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  BBMP Civic Supplies Pass
                </span>
                <Badge variant="amber">{successRedemption.status}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pass PIN</span>
                  <div className="font-mono font-black text-2xl text-slate-900 tracking-wider">
                    {successRedemption.collection_pin}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyPin(successRedemption.collection_pin)}
                  className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Item</span>
                  <div className="font-bold text-slate-800 truncate">{successRedemption.reward_name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Quantity</span>
                  <div className="font-bold text-slate-800">{successRedemption.quantity_label}</div>
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-emerald-200/80">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Pickup Location</span>
                <div className="font-medium text-slate-800 text-[11px] flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{successRedemption.pickup_location}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              {t('rewards.pass_instruction') || 'Present this pass PIN to your ward center supervisor when collecting your items.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setSuccessRedemption(null);
                  setActiveTab('my-redemptions');
                }}
              >
                {t('rewards.view_in_my_redemptions') || 'View in My Redemptions'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
