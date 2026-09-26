import React, { useState } from 'react';
import {
  PlusCircle,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Weight,
  Layers,
  FileText,
  Camera,
  X,
  Scale,
  Award,
} from 'lucide-react';
import { WasteType, ClaimStatus, AIClassificationResult, WasteEntry } from '../types';
import { useOffline } from '../context/OfflineContext';
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
  Input,
  Alert,
  Modal,
} from '../components/ui';

export const AdminWasteManagementPage: React.FC = () => {
  const { isOnline, queueRecord } = useOffline();
  const { t, translateWasteType, translateClaimStatus } = useLanguage();

  const [meterNumber, setMeterNumber] = useState('');
  const [wasteType, setWasteType] = useState<WasteType>('Paper & Cardboard');
  const [weightKg, setWeightKg] = useState<string>('');
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('Processed');
  const [feedback, setFeedback] = useState('');

  // AI Classification state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('plastic_bottle');

  // Confirmation & submission state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live estimated reward calculation based on dry waste rate schedule
  const getLiveCalculation = (type: WasteType, kgStr: string) => {
    const kg = parseFloat(kgStr);
    if (isNaN(kg) || kg <= 0) return { amount: 0, text: 'Enter weight to calculate estimated Green Points' };

    switch (type) {
      case 'Paper & Cardboard':
        return { amount: kg * 25.0, text: `${kg.toFixed(2)} kg × 25 GP/kg = +${(kg * 25.0).toFixed(1)} GP` };
      case 'Recyclable Metals & Cans':
        return { amount: kg * 50.0, text: `${kg.toFixed(2)} kg × 50 GP/kg = +${(kg * 50.0).toFixed(1)} GP` };
      case 'Clean Plastic Packaging':
        return { amount: kg * 100.0, text: `${kg.toFixed(2)} kg × 100 GP/kg = +${(kg * 100.0).toFixed(1)} GP` };
      case 'Contaminated Waste':
        return { amount: -15.0, text: 'Contamination deduction: -15 GP flat penalty' };
      default:
        return { amount: 0, text: 'N/A' };
    }
  };

  const liveCalc = getLiveCalculation(wasteType, weightKg);

  const handleTriggerAI = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    try {
      const data = await api.post<AIClassificationResult>('/admin/ai/classify', {
        image_name_or_keyword: selectedPreset,
      });
      setAiResult(data);
    } catch (err: any) {
      console.error('AI Classification error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAI = (category: WasteType) => {
    setWasteType(category);
    setFeedback(`AI classification assistance verified: ${aiResult?.detected_object}`);
    setAiModalOpen(false);
  };

  const handleValidateForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const kg = parseFloat(weightKg);
    if (!meterNumber.trim()) {
      setErrorMessage(t('auth.error_required'));
      return;
    }
    if (isNaN(kg) || kg <= 0) {
      setErrorMessage('Weight must be a positive number greater than 0 kg.');
      return;
    }
    if (kg > 5000) {
      setErrorMessage('Weight exceeds maximum operational batch size (5,000 kg).');
      return;
    }

    setConfirmationOpen(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const kg = parseFloat(weightKg);

    if (!isOnline) {
      queueRecord({
        meter_number: meterNumber.trim().toUpperCase(),
        waste_type: wasteType,
        weight_kg: kg,
        collection_date: new Date().toISOString(),
        claim_status: claimStatus,
        admin_feedback: feedback.trim() || undefined,
        ai_classification_id: aiResult?.classification_id,
      });
      setConfirmationOpen(false);
      setSubmitting(false);
      setSuccessMessage(t('waste_mgmt.offline_saved'));
      setWeightKg('');
      setFeedback('');
      return;
    }

    try {
      const resp = await api.post<WasteEntry>('/admin/waste', {
        meter_number: meterNumber.trim().toUpperCase(),
        waste_type: wasteType,
        weight_kg: kg,
        claim_status: claimStatus,
        admin_feedback: feedback.trim() || undefined,
        ai_classification_id: aiResult?.classification_id,
      });

      setConfirmationOpen(false);
      setSuccessMessage(
        t('waste_mgmt.success_msg', {
          weight: resp.weight_kg,
          type: translateWasteType(resp.waste_type),
          meter: resp.meter_number || meterNumber,
          amount: resp.reward_amount ?? 0,
        })
      );
      setWeightKg('');
      setFeedback('');
      setAiResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record waste entry. Please verify the meter number.');
      setConfirmationOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <PageHeader
        title={t('waste_mgmt.title')}
        subtitle={t('waste_mgmt.subtitle')}
        badge={<Badge variant="purple" dot>{t('waste_mgmt.badge')}</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerAI}
            leftIcon={<Cpu className="w-4 h-4 text-purple-600" />}
          >
            {t('waste_mgmt.btn_ai')}
          </Button>
        }
      />

      {successMessage && (
        <Alert
          type="success"
          title="Weighment Certified & Recorded"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Weighment Form */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Batch Weighment Entry</CardTitle>
              <CardDescription>Enter verified scale reading from door-to-door or collection center</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleValidateForm} className="space-y-4">
                <Input
                  label="Citizen Electricity Meter Number"
                  type="text"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. BESCOM-IND-104928"
                  required
                  leftIcon={<Zap className="w-4 h-4 text-emerald-700" />}
                  helperText="Format: BESCOM-IND-XXXXXX or BESCOM-COM-XXXXXX"
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Waste Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value as WasteType)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  >
                    <option value="Paper & Cardboard">📦 Paper & Cardboard (Light Dry Waste) - 25 GP/kg</option>
                    <option value="Recyclable Metals & Cans">🥫 Recyclable Metals & Cans (Hard Dry Waste) - 50 GP/kg</option>
                    <option value="Clean Plastic Packaging">🧴 Clean Plastic Packaging (Flexible & Rigid) - 100 GP/kg</option>
                    <option value="Contaminated Waste">⚠️ Contaminated Waste (Wet/Food residue) - 15 GP penalty</option>
                  </select>
                </div>

                <Input
                  label="Verified Weight (Kilograms)"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5000"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 4.5"
                  required
                  leftIcon={<Weight className="w-4 h-4 text-emerald-700" />}
                />

                <Input
                  label="Supervisor Verification Notes (Optional)"
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Verified clean segregation at Koramangala Ward 151"
                  leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Verify & Proceed to Certification
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Reward Calculation Preview Panel */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-linear-to-br from-slate-900 to-slate-950 text-white border-slate-800">
            <CardHeader className="border-b border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Live Calculation Engine
              </span>
              <CardTitle className="text-white mt-1">Estimated Citizen Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs text-slate-400 font-medium">Credited / Deducted</span>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-tight mt-1 ${
                    liveCalc.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {liveCalc.amount >= 0 ? `+${liveCalc.amount.toFixed(1)} GP` : `-${Math.abs(liveCalc.amount).toFixed(1)} GP`}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  {liveCalc.text}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 font-medium leading-relaxed">
                Green Points are deposited into the citizen's civic wallet immediately upon certification for essential grocery redemption.
              </div>
            </CardContent>
          </Card>

          {/* Rate Card Reference */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Official BBMP Dry Waste Points Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">📦 Paper & Cardboard</span>
                <span className="font-bold text-emerald-800">25 GP / kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">🥫 Recyclable Metals & Cans</span>
                <span className="font-bold text-emerald-800">50 GP / kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">🧴 Clean Plastic Packaging</span>
                <span className="font-bold text-emerald-800">100 GP / kg</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 font-medium">⚠️ Contamination Penalty</span>
                <span className="font-bold text-rose-600">-15 GP flat</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        title="Confirm Waste Weighment Certification"
        subtitle="Review certified batch details before committing to municipal ledger"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmationOpen(false)}
            >
              Back to Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitting}
              onClick={handleFinalSubmit}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {submitting ? 'Certifying...' : 'Certify & Award Green Points'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Electricity Meter:</span>
              <span className="font-mono font-bold text-slate-900">{meterNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Waste Category:</span>
              <span className="font-bold text-slate-900">{translateWasteType(wasteType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Certified Weight:</span>
              <span className="font-black text-slate-900">{weightKg} kg</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-bold">Green Points Awarded:</span>
              <span
                className={`font-black text-sm ${
                  liveCalc.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {liveCalc.amount >= 0 ? `+${liveCalc.amount.toFixed(1)} GP` : `-${Math.abs(liveCalc.amount).toFixed(1)} GP`}
              </span>
            </div>
          </div>

          <p className="text-slate-500 leading-relaxed text-[11px]">
            This certification is permanent and will trigger an automated SMS / municipal ledger update to the citizen account.
          </p>
        </div>
      </Modal>

      {/* AI Classifier Assistance Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Vision Classification Assistance"
        subtitle="Simulate camera snapshot analysis for automated category detection"
        footer={
          aiResult ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleConfirmAI(aiResult.predicted_category)}
            >
              Accept ({aiResult.predicted_category})
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Sample Preset Image
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="plastic_bottle">Clean PET Bottles & Chips Wrappers (Clean Plastic Packaging)</option>
              <option value="metal_can">Aluminum Beverage Cans & Tins (Recyclable Metals & Cans)</option>
              <option value="cardboard_box">Corrugated Packaging & Newspapers (Paper & Cardboard)</option>
              <option value="food_waste">Wet Kitchen Scraps (REJECT - Non-Accepted Wet Waste)</option>
              <option value="e_waste">Consumer Lithium Battery / Cell (Hazardous Contamination)</option>
              <option value="mixed_dirty">Food Grease Contaminated Container (Contaminated Waste)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerAI}
            isLoading={aiLoading}
            className="w-full"
            leftIcon={<Camera className="w-4 h-4 text-purple-600" />}
          >
            {aiLoading ? 'Analyzing Sample with AI...' : 'Run Vision Model Analysis'}
          </Button>

          {aiResult && (
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">{aiResult.detected_object}</span>
                <Badge variant="purple" size="xs">
                  {(aiResult.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              </div>
              <p className="text-purple-800">
                Recommended Classification: <strong>{aiResult.predicted_category}</strong>
              </p>
              <p className="text-[11px] text-purple-700/80 leading-relaxed">
                {(aiResult as any).reasoning || aiResult.suggested_action}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
