import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Recycle,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { WasteEntry, WasteType, ClaimStatus } from '../types';
import { WasteJourneyModal } from '../components/WasteJourneyModal';
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
  StatusBadge,
  Button,
  EmptyState,
} from '../components/ui';

export const UserWasteHistoryPage: React.FC = () => {
  const { t, translateWasteType, translateClaimStatus } = useLanguage();

  const [items, setItems] = useState<WasteEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');
      if (selectedType !== 'All') params.append('waste_type', selectedType);
      if (selectedStatus !== 'All') params.append('claim_status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      const data = await api.get<{ items: WasteEntry[]; total: number }>(
        `/users/me/waste?${params.toString()}`
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load waste history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('history.title')}
        subtitle={t('history.subtitle')}
        badge={<Badge variant="emerald" dot>{t('history.view_only_banner')}</Badge>}
        actions={
          <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{t('common.total_collections')}:</span>
            <span className="text-base font-black text-emerald-900">{total}</span>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('history.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </form>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="All">{t('filter.all_waste_types')}</option>
                <option value="Paper & Cardboard">📦 Paper & Cardboard</option>
                <option value="Recyclable Metals & Cans">🥫 Recyclable Metals & Cans</option>
                <option value="Clean Plastic Packaging">🧴 Clean Plastic Packaging</option>
                <option value="Contaminated Waste">⚠️ Contaminated Waste</option>
                <option value="Dry Waste">Dry Waste</option>
                <option value="Recyclable">Recyclable</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="All">{t('filter.all_statuses')}</option>
                <option value="PENDING">Pending</option>
                <option value="CLAIMED">Claimed</option>
                <option value="PROCESSED">Processed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline List (Cards Layout) */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-2xl" />
              <div className="h-20 bg-slate-100 rounded-2xl" />
              <div className="h-20 bg-slate-100 rounded-2xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Recycle className="w-6 h-6 text-emerald-600" />}
                title={t('history.no_records')}
                description={t('history.no_records_sub')}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                      <Recycle className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-slate-900">
                          {translateWasteType(entry.waste_type)}
                        </span>
                        <StatusBadge status={entry.claim_status || 'PROCESSED'} />
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{entry.id.slice(0, 8)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }) : 'N/A'}
                      </p>

                      {entry.admin_feedback && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg max-w-md">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{entry.admin_feedback}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-slate-900">
                        {entry.weight_kg} kg
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          (entry.reward_amount || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {(entry.reward_amount || 0) >= 0
                          ? `+${entry.reward_amount?.toFixed(0)} GP`
                          : `-${Math.abs(entry.reward_amount || 0).toFixed(0)} GP`}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(entry)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      {t('action.inspect_journey')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {t('common.showing_page', { page, totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
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
