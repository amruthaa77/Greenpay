import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Zap,
  Weight,
  ShieldCheck,
  Filter,
  MessageSquare,
  ShieldAlert,
  MapPin,
  FileText,
} from 'lucide-react';
import { Anomaly } from '../types';
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

export const AdminAnomaliesPage: React.FC = () => {
  const { t, translateAnomalyType, translateSeverity, translateAnomalyStatus } = useLanguage();

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [loading, setLoading] = useState(true);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [reviewAction, setReviewAction] = useState<'CONFIRMED' | 'DISMISSED'>('CONFIRMED');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await api.get<Anomaly[]>(`/admin/anomalies?status_filter=${statusFilter}`);
      setAnomalies(data);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [statusFilter]);

  const handleOpenReview = (a: Anomaly, action: 'CONFIRMED' | 'DISMISSED') => {
    setSelectedAnomaly(a);
    setReviewAction(action);
    setAdminNotes(a.admin_notes || '');
  };

  const handleConfirmReview = async () => {
    if (!selectedAnomaly) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/anomalies/${selectedAnomaly.id}`, {
        status: reviewAction,
        admin_notes: adminNotes.trim() || undefined,
      });
      setSelectedAnomaly(null);
      fetchAnomalies();
    } catch (err) {
      console.error('Failed to review anomaly:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t('anomalies.title')}
        subtitle={t('anomalies.subtitle')}
        badge={<Badge variant="amber" dot>{t('anomalies.badge')}</Badge>}
        actions={
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            {[
              { label: 'Pending Review', val: 'PENDING_REVIEW' },
              { label: 'Confirmed', val: 'CONFIRMED' },
              { label: 'Dismissed', val: 'DISMISSED' },
              { label: 'All', val: 'ALL' },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setStatusFilter(f.val)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === f.val
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Anomaly Cards List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-slate-200/80 rounded-3xl" />
          <div className="h-36 bg-slate-200/80 rounded-3xl" />
        </div>
      ) : anomalies.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
              title={t('anomalies.no_anomalies')}
              description={t('anomalies.no_anomalies_sub')}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {anomalies.map((a) => {
            const isHigh = a.severity === 'HIGH';
            return (
              <Card key={a.id} hover className="overflow-hidden">
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <AlertTriangle className={`w-4 h-4 ${isHigh ? 'text-rose-600' : 'text-amber-500'}`} />
                        <span>Flag Detected:</span>
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {translateAnomalyType(a.anomaly_type)}
                      </span>
                      <Badge variant={isHigh ? 'rose' : 'amber'} size="xs" dot>
                        {a.severity} SEVERITY
                      </Badge>
                      <StatusBadge status={a.status} />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {a.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Zap className="w-3.5 h-3.5 text-emerald-700" />
                        <strong>{a.meter_number || 'N/A'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {a.timestamp ? new Date(a.timestamp).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }) : 'Recent'}
                      </span>
                      {a.admin_notes && (
                        <span className="text-slate-600 italic">
                          Notes: "{a.admin_notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {a.status === 'PENDING_REVIEW' && (
                    <div className="flex items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenReview(a, 'CONFIRMED')}
                        leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                      >
                        Confirm Spike
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReview(a, 'DISMISSED')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Dismiss Alert
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedAnomaly)}
        onClose={() => setSelectedAnomaly(null)}
        title={reviewAction === 'CONFIRMED' ? 'Confirm Anomaly Flag' : 'Dismiss Anomaly Flag'}
        subtitle={`Audit decision for ${selectedAnomaly?.meter_number || 'Weighment Record'}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedAnomaly(null)}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'CONFIRMED' ? 'danger' : 'primary'}
              size="sm"
              isLoading={submitting}
              onClick={handleConfirmReview}
            >
              Commit Decision
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Anomaly Type:</span>
              <span className="font-bold text-slate-800">{selectedAnomaly?.anomaly_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Severity:</span>
              <span className="font-bold text-slate-800">{selectedAnomaly?.severity}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supervisor Audit Notes
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Provide justification for municipal record..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
