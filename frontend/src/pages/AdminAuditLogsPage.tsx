import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AuditLog } from '../types';
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

export const AdminAuditLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '20');
      if (actionFilter !== 'ALL') params.append('action', actionFilter);

      const data = await api.get<{ items: AuditLog[]; total: number }>(
        `/admin/audit-logs?${params.toString()}`
      );
      setLogs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / 20) || 1;

  const getActionTheme = (act: string) => {
    if (act.includes('REGISTER')) return { variant: 'sky' as const, dot: 'bg-sky-500' };
    if (act.includes('WASTE_CREATE') || act.includes('REWARD')) return { variant: 'emerald' as const, dot: 'bg-emerald-500' };
    if (act.includes('ANOMALY')) return { variant: 'amber' as const, dot: 'bg-amber-500' };
    return { variant: 'neutral' as const, dot: 'bg-slate-500' };
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        badge={<Badge variant="purple" dot>{t('audit.badge')}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <option value="ALL">{t('audit.all_events')}</option>
              <option value="WASTE_CREATE">Waste Created</option>
              <option value="WASTE_UPDATE">Waste Updated</option>
              <option value="REWARD_ISSUE">Reward Issued</option>
              <option value="ANOMALY_REVIEW">Anomaly Reviewed</option>
              <option value="USER_REGISTER">Citizen Registered</option>
              <option value="ADMIN_REGISTER">Admin Provisioned</option>
            </select>
          </div>
        }
      />

      {/* Timeline Feed Container */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Municipal Verification Trail</CardTitle>
            <CardDescription>Chronological timeline of system events and operations</CardDescription>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">
            Total {total} Verified Events
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded-2xl" />
              <div className="h-16 bg-slate-100 rounded-2xl" />
              <div className="h-16 bg-slate-100 rounded-2xl" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<FileText className="w-6 h-6 text-emerald-600" />}
                title={t('audit.empty_title')}
                description="No municipal audit events match your selected criteria."
              />
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 pr-4 sm:pr-6 py-4 space-y-6 before:absolute before:left-8 sm:before:left-10 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => {
                const theme = getActionTheme(log.action);
                return (
                  <div key={log.id} className="relative flex items-start gap-4">
                    {/* Timeline bullet dot */}
                    <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-slate-100 ${theme.dot} shrink-0 mt-1 z-10`} />

                    {/* Timeline Event Card */}
                    <div className="flex-1 bg-slate-50/80 hover:bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {log.action}
                          </span>
                          <Badge variant={theme.variant} size="xs">
                            {log.affected_entity_type || 'System'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : ''}{' '}
                          •{' '}
                          {log.timestamp ? new Date(log.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          }) : ''}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap mt-1">
                        <span className="font-medium text-slate-700">
                          Actor: <strong>{log.actor_role || 'SYSTEM'}</strong>
                        </span>
                        {log.affected_entity_id && (
                          <span className="text-slate-400 font-mono">
                            Target: {log.affected_entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      {log.new_state && Object.keys(log.new_state).length > 0 && (
                        <div className="mt-2.5 p-2 bg-white rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-600 overflow-x-auto">
                          {JSON.stringify(log.new_state)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
};
