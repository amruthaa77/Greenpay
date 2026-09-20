import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Zap,
  MapPin,
  Eye,
  Building,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Scale,
  Award,
  Calendar,
} from 'lucide-react';
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
  Modal,
  EmptyState,
} from '../components/ui';

export const AdminUsersPage: React.FC = () => {
  const { t, translateUserType, translateWasteType } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('All');
  const [loading, setLoading] = useState(true);

  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '15');
      if (userType !== 'All') params.append('user_type', userType);
      if (search.trim()) params.append('search', search.trim());

      const data = await api.get<{ items: any[]; total: number }>(`/admin/users?${params.toString()}`);
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, userType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewUser = async (userId: string) => {
    setDetailLoading(true);
    setSelectedUserDetail(null);
    try {
      const data = await api.get<any>(`/admin/users/${userId}`);
      setSelectedUserDetail(data);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 15) || 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('admin_users.title')}
        subtitle={t('admin_users.subtitle')}
        badge={<Badge variant="purple" dot>{t('admin_users.badge')}</Badge>}
        actions={
          <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Registered Citizens:</span>
            <span className="text-base font-black text-slate-900">{total}</span>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin_users.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setPage(1);
                }}
                className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="All">All User Types</option>
                <option value="Individual">Individual Households</option>
                <option value="Commercial">Commercial Establishments</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table / List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-2xl" />
              <div className="h-12 bg-slate-100 rounded-2xl" />
              <div className="h-12 bg-slate-100 rounded-2xl" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Users className="w-6 h-6 text-emerald-600" />}
                title={t('admin_users.no_users')}
                description="Try adjusting your search criteria or role filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 sm:px-6">Citizen</th>
                    <th className="p-4">Electricity Meter</th>
                    <th className="p-4">Ward</th>
                    <th className="p-4">Account Type</th>
                    <th className="p-4 text-center">Green Score</th>
                    <th className="p-4 text-right sm:pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 sm:px-6">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">
                          {u.address}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">
                        {u.meter_number}
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        Ward {u.ward_number} ({u.ward_name})
                      </td>
                      <td className="p-4">
                        <Badge variant="neutral" size="xs">
                          {translateUserType(u.user_type)}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          🌱 {u.green_score?.toFixed(0) || 75}
                        </span>
                      </td>
                      <td className="p-4 text-right sm:pr-6">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewUser(u.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Dossier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
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

      {/* Citizen Dossier Modal */}
      <Modal
        isOpen={Boolean(selectedUserDetail)}
        onClose={() => setSelectedUserDetail(null)}
        title={selectedUserDetail?.user?.name || 'Citizen Dossier'}
        subtitle={`Meter: ${selectedUserDetail?.user?.meter_number} • Ward ${selectedUserDetail?.user?.ward_number} (${selectedUserDetail?.user?.ward_name})`}
        maxWidth="xl"
      >
        {selectedUserDetail && (
          <div className="space-y-5 text-xs">
            {/* Quick KPI stats in modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Green Score</span>
                <span className="text-xl font-black text-emerald-950 mt-0.5 block">
                  🌱 {selectedUserDetail.stats?.green_score || 75}
                </span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/80 text-center">
                <span className="text-[10px] font-bold text-sky-800 uppercase block">Total Waste</span>
                <span className="text-xl font-black text-sky-950 mt-0.5 block">
                  {selectedUserDetail.stats?.total_waste_kg || 0} kg
                </span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Points Earned</span>
                <span className="text-xl font-black text-purple-950 mt-0.5 block">
                  {selectedUserDetail.stats?.total_rewards?.toFixed(0) || '0'} GP
                </span>
              </div>
            </div>

            {/* Address & Phone */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <p className="text-slate-500 font-medium">Registered Premises:</p>
              <p className="font-bold text-slate-800">{selectedUserDetail.user?.address}</p>
              {selectedUserDetail.user?.phone_number && (
                <p className="text-slate-600">Phone: {selectedUserDetail.user.phone_number}</p>
              )}
            </div>

            {/* Recent Collections */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Recent Collections for this Citizen
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(selectedUserDetail.recent_waste || []).slice(0, 5).map((w: any) => (
                  <div key={w.id} className="p-3 flex items-center justify-between bg-white text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{translateWasteType(w.waste_type)}</span>
                      <span className="text-slate-400 ml-2">({w.weight_kg} kg)</span>
                    </div>
                    <span className="font-bold text-emerald-700">+{w.reward_amount?.toFixed(0)} GP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
