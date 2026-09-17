import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RewardItem, RewardRedemption, RedemptionStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { StatCardSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Gift,
  Package,
  CheckCircle2,
  Plus,
  Edit3,
  RotateCcw,
  Search,
  MapPin,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

interface AdminRewardManagementPageProps {
  onNavigate?: (route: string) => void;
}

export const AdminRewardManagementPage: React.FC<AdminRewardManagementPageProps> = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'redemptions' | 'catalogue'>('redemptions');

  // Redemptions state
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);
  const [redemptionsError, setRedemptionsError] = useState<string | null>(null);

  // Status modal state
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);
  const [newStatus, setNewStatus] = useState<RedemptionStatus>('Approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Catalogue state
  const [catalogue, setCatalogue] = useState<RewardItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<RewardItem | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Form fields for item edit/create
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Essential Groceries');
  const [formQty, setFormQty] = useState('1 kg');
  const [formCost, setFormCost] = useState(100);
  const [formStock, setFormStock] = useState(100);
  const [formIcon, setFormIcon] = useState('📦');
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Safe date formatter that will NEVER throw TypeError: Invalid option : timeStyle
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getRewardIcon = (name?: string, icon?: string) => {
    if (icon && icon.trim()) return icon;
    const n = name || '';
    if (n.includes('Salt')) return '🧂';
    if (n.includes('Rice')) return '🍚';
    if (n.includes('Wheat')) return '🌾';
    if (n.includes('Oil')) return '🛢️';
    if (n.includes('Dal')) return '🫘';
    return '📦';
  };

  const fetchRedemptions = async () => {
    try {
      setRedemptionsLoading(true);
      setRedemptionsError(null);
      const params = statusFilter !== 'All' ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
      const data = await api.get<RewardRedemption[]>(`/rewards/admin/redemptions${params}`);
      setRedemptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch redemptions:', err);
      setRedemptionsError(err.message || 'Unable to load redemptions');
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const fetchCatalogue = async () => {
    try {
      setCatalogueLoading(true);
      setCatalogueError(null);
      const data = await api.get<RewardItem[]>('/rewards/admin/catalogue');
      setCatalogue(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch catalogue:', err);
      setCatalogueError(err.message || 'Unable to load rewards catalogue');
    } finally {
      setCatalogueLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
  }, [statusFilter]);

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const handleRetryAll = () => {
    setRedemptionsError(null);
    setCatalogueError(null);
    fetchRedemptions();
    fetchCatalogue();
  };

  const handleOpenStatusModal = (red: RewardRedemption, targetStatus: RedemptionStatus) => {
    setSelectedRedemption(red);
    setNewStatus(targetStatus);
    setAdminNotes(red.admin_notes || '');
    setActionError(null);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedRedemption) return;
    try {
      setSubmittingStatus(true);
      setActionError(null);
      const updated = await api.patch<RewardRedemption>(`/rewards/admin/redemptions/${selectedRedemption.id}`, {
        status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
      });

      setRedemptions(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setStatusModalOpen(false);

      // Refresh catalogue in case refund restocked item
      fetchCatalogue();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update redemption status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenCreateItem = () => {
    setIsNewItem(true);
    setEditItem(null);
    setFormName('');
    setFormCategory('Essential Groceries');
    setFormQty('1 kg');
    setFormCost(100);
    setFormStock(100);
    setFormIcon('📦');
    setFormDesc('');
    setFormActive(true);
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: RewardItem) => {
    setIsNewItem(false);
    setEditItem(item);
    setFormName(item.name || '');
    setFormCategory(item.category || 'Essential Groceries');
    setFormQty(item.quantity_label || '1 kg');
    setFormCost(item.points_cost || 100);
    setFormStock(item.stock_quantity ?? 0);
    setFormIcon(item.icon || '📦');
    setFormDesc(item.description || '');
    setFormActive(item.is_active ?? true);
    setItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    try {
      setSubmittingItem(true);
      if (isNewItem) {
        const created = await api.post<RewardItem>('/rewards/admin/catalogue', {
          name: formName.trim(),
          category: formCategory.trim(),
          quantity_label: formQty.trim(),
          points_cost: Number(formCost),
          stock_quantity: Number(formStock),
          icon: formIcon.trim() || '📦',
          description: formDesc.trim() || undefined,
          is_active: formActive,
        });
        setCatalogue(prev => [...prev, created]);
      } else if (editItem) {
        const updated = await api.put<RewardItem>(`/rewards/admin/catalogue/${editItem.id}`, {
          name: formName.trim(),
          category: formCategory.trim(),
          quantity_label: formQty.trim(),
          points_cost: Number(formCost),
          stock_quantity: Number(formStock),
          icon: formIcon.trim() || '📦',
          description: formDesc.trim() || undefined,
          is_active: formActive,
        });
        setCatalogue(prev => prev.map(it => (it.id === updated.id ? updated : it)));
      }
      setItemModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save catalogue item.');
    } finally {
      setSubmittingItem(false);
    }
  };

  const safeRedemptions = Array.isArray(redemptions) ? redemptions : [];
  const safeCatalogue = Array.isArray(catalogue) ? catalogue : [];

  const filteredRedemptions = safeRedemptions.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const rName = (r.reward_name || '').toLowerCase();
    const uName = (r.user_name || '').toLowerCase();
    const mNum = (r.meter_number || '').toLowerCase();
    const pin = (r.collection_pin || '').toLowerCase();
    return rName.includes(q) || uName.includes(q) || mNum.includes(q) || pin.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.rewards_title') || '🎁 Rewards & Redemptions'}
        subtitle={t('admin.rewards_sub') || 'Manage essential goods and citizen Green Point redemptions.'}
        actions={
          activeTab === 'catalogue' ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreateItem}
            >
              Add Catalogue Item
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'redemptions'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Redemption Requests</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {safeRedemptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalogue'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Reward Catalogue</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {safeCatalogue.length}
          </span>
        </button>
      </div>

      {/* TAB 1: REDEMPTION REQUESTS */}
      {activeTab === 'redemptions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search citizen, meter number, or pass PIN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs w-full outline-none text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Requested', 'Approved', 'Ready for Collection', 'Collected', 'Rejected', 'Cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {redemptionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : redemptionsError ? (
            /* Error state */
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ⚠️ Unable to load rewards
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
                {redemptionsError}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryAll}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retry
              </Button>
            </div>
          ) : filteredRedemptions.length === 0 ? (
            /* Empty state */
            <EmptyState
              icon={<Package className="w-6 h-6 text-emerald-600" />}
              title="📦 No redemption requests yet"
              description="Citizen redemption requests will appear here."
            />
          ) : (
            /* Redemptions list */
            <div className="space-y-3">
              {filteredRedemptions.map(red => (
                <Card key={red.id} className="p-5 border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Citizen & Good Details */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                        {getRewardIcon(red.reward_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-base">{red.reward_name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                            {red.quantity_label}
                          </span>
                          <span className="font-black text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {red.points_spent} GP
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                          <span className="font-bold text-slate-900">{red.user_name || 'Citizen'}</span>
                          <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{red.meter_number || '—'}</span>
                          <span>•</span>
                          <span>Ward {red.ward_number || '—'} ({red.ward_name || 'Bengaluru'})</span>
                          <span>•</span>
                          <span className="text-slate-400">{formatDate(red.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{red.pickup_location || 'BBMP Collection Centre'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pass PIN, Status & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      {/* Pass Code Pill */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center sm:text-left">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass PIN</span>
                        <span className="font-mono font-black text-sm text-slate-900">{red.collection_pin || '—'}</span>
                      </div>

                      {/* Status Pill */}
                      <div className="flex items-center">
                        <Badge
                          variant={
                            red.status === 'Requested' ? 'amber' :
                            red.status === 'Approved' ? 'sky' :
                            red.status === 'Ready for Collection' ? 'emerald' :
                            red.status === 'Collected' ? 'emerald' : 'rose'
                          }
                        >
                          {red.status}
                        </Badge>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center gap-2">
                        {red.status === 'Requested' && (
                          <>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenStatusModal(red, 'Approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleOpenStatusModal(red, 'Rejected')}
                            >
                              Reject & Refund
                            </Button>
                          </>
                        )}

                        {red.status === 'Approved' && (
                          <>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenStatusModal(red, 'Ready for Collection')}
                            >
                              Mark Ready
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleOpenStatusModal(red, 'Rejected')}
                            >
                              Reject & Refund
                            </Button>
                          </>
                        )}

                        {red.status === 'Ready for Collection' && (
                          <>
                            <Button
                              variant="primary"
                              size="xs"
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenStatusModal(red, 'Collected')}
                            >
                              Confirm Handover
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleOpenStatusModal(red, 'Rejected')}
                            >
                              Reject & Refund
                            </Button>
                          </>
                        )}

                        {['Collected', 'Rejected', 'Cancelled'].includes(red.status) && (
                          <span className="text-xs text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-lg">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {red.admin_notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <strong>Admin Notes:</strong> {red.admin_notes}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARD CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          {catalogueLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(n => (
                <StatCardSkeleton key={n} />
              ))}
            </div>
          ) : catalogueError ? (
            /* Error state */
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ⚠️ Unable to load rewards
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
                {catalogueError}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryAll}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retry
              </Button>
            </div>
          ) : safeCatalogue.length === 0 ? (
            <EmptyState
              icon={<Gift className="w-6 h-6 text-emerald-600" />}
              title="No reward items in catalogue"
              description="Click 'Add Catalogue Item' above to register the first essential good."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {safeCatalogue.map(item => (
                <Card key={item.id} className="p-5 border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">
                        {getRewardIcon(item.name, item.icon)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-1 bg-emerald-800 text-white text-xs font-black rounded-lg">
                          {item.points_cost} GP
                        </span>
                        <Badge variant={item.is_active ? 'emerald' : 'neutral'} size="xs">
                          {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 uppercase">{item.category}</span>
                        <span className="font-semibold text-slate-500">{item.quantity_label}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {item.description || 'Civic essential good.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Available Stock:</span>
                      <span className={`font-black text-sm ${(item.stock_quantity ?? 0) <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {item.stock_quantity ?? 0} units
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      leftIcon={<Edit3 className="w-4 h-4" />}
                      onClick={() => handleOpenEditItem(item)}
                    >
                      Edit Item & Stock
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redemption Status Transition Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => !submittingStatus && setStatusModalOpen(false)}
        title={`Update Redemption Status to: ${newStatus}`}
        maxWidth="md"
      >
        {selectedRedemption && (
          <div className="space-y-4">
            {actionError && (
              <Alert type="error" title="Status Update Error" message={actionError} />
            )}

            {newStatus === 'Rejected' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="block font-bold">Important Refund Trigger:</strong>
                  Rejecting this request will <strong>immediately refund {selectedRedemption.points_spent} GP</strong> back to citizen {selectedRedemption.user_name} ({selectedRedemption.meter_number}) and increment inventory stock by 1.
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs">
              <div><strong>Item:</strong> {selectedRedemption.reward_name} ({selectedRedemption.quantity_label})</div>
              <div><strong>Citizen:</strong> {selectedRedemption.user_name} ({selectedRedemption.meter_number})</div>
              <div><strong>Pass PIN:</strong> {selectedRedemption.collection_pin}</div>
              <div><strong>Points:</strong> {selectedRedemption.points_spent} GP</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supervisor / Staff Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Verified citizen identity. Handed over package at Counter 1."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStatusModalOpen(false)}
                disabled={submittingStatus}
              >
                Cancel
              </Button>
              <Button
                variant={newStatus === 'Rejected' ? 'danger' : 'primary'}
                isLoading={submittingStatus}
                onClick={handleConfirmStatusChange}
              >
                Confirm {newStatus}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Catalogue Item Create/Edit Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => !submittingItem && setItemModalOpen(false)}
        title={isNewItem ? 'Add Essential Good to Catalogue' : `Edit Item: ${editItem?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Sona Masoori Rice"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Icon Emoji</label>
              <input
                type="text"
                value={formIcon}
                onChange={e => setFormIcon(e.target.value)}
                placeholder="e.g. 🍚"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Label</label>
              <input
                type="text"
                value={formQty}
                onChange={e => setFormQty(e.target.value)}
                placeholder="e.g. 2 kg or 1 L"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Points Cost (GP)</label>
              <input
                type="number"
                value={formCost}
                onChange={e => setFormCost(Number(e.target.value))}
                min={10}
                step={10}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formStock}
                onChange={e => setFormStock(Number(e.target.value))}
                min={0}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Brief civic description of item grade and source..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activeToggle"
              checked={formActive}
              onChange={e => setFormActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="activeToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
              Active in Citizen Catalogue
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setItemModalOpen(false)}
              disabled={submittingItem}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={submittingItem}
              onClick={handleSaveItem}
            >
              {isNewItem ? 'Create Item' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
