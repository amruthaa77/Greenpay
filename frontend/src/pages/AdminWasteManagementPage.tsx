import React, { useState, useRef } from 'react';
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
  Upload,
  SlidersHorizontal,
  X,
  Scale,
  Award,
  QrCode,
  UserCheck,
} from 'lucide-react';
import {
  WasteType,
  ClaimStatus,
  VisionClassificationResult,
  WasteEntry,
  CitizenLookupResult,
} from '../types';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { api, classifyWasteVision, classifyWasteVisionImage } from '../services/api';
import { CitizenQRScannerModal } from '../components/CitizenQRScannerModal';
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

  // Citizen QR Identification state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [identifiedCitizen, setIdentifiedCitizen] = useState<CitizenLookupResult | null>(null);

  // AI Classification state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'real' | 'demo'>('real');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<VisionClassificationResult | null>(null);
  const [selectedAiClassificationId, setSelectedAiClassificationId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('clean_pet_bottles_chips_wrappers');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<WasteType | null>(null);
  const [showOverridePicker, setShowOverridePicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleOpenAIModal = () => {
    setAiModalOpen(true);
    setAiError(null);
    setShowOverridePicker(false);
    setOverrideCategory(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAiError('Please select a valid image file (JPEG, PNG, or WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAiError('Selected file exceeds maximum allowable size of 10MB.');
      return;
    }

    setAiError(null);
    setSelectedFile(file);
    setAiResult(null);
    setShowOverridePicker(false);
    setOverrideCategory(null);

    // Create object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAiResult(null);
    setAiError(null);
    setShowOverridePicker(false);
    setOverrideCategory(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRunAIVision = async () => {
    setAiLoading(true);
    setAiError(null);
    setShowOverridePicker(false);
    setOverrideCategory(null);

    try {
      let data: VisionClassificationResult;
      if (aiMode === 'real') {
        if (!selectedFile) {
          setAiError('Please take a photo or upload an image file first.');
          setAiLoading(false);
          return;
        }
        data = await classifyWasteVisionImage(selectedFile);
      } else {
        data = await classifyWasteVision(selectedPreset);
      }
      setAiResult(data);
    } catch (err: any) {
      console.error('AI Classification error:', err);
      setAiError(err.message || 'Vision classification failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAI = () => {
    if (!aiResult) return;
    const finalCategory = overrideCategory || aiResult.classification;
    setWasteType(finalCategory);
    setSelectedAiClassificationId(aiResult.classification_id);
    const overrideNote = overrideCategory && overrideCategory !== aiResult.classification
      ? ` [Admin Override from ${aiResult.classification}]`
      : '';
    setFeedback(
      `AI Vision verified: ${aiResult.detected_object} -> ${finalCategory} (${(aiResult.confidence * 100).toFixed(0)}% confidence)${overrideNote}`
    );
    setAiModalOpen(false);
  };

  const handleCitizenResolved = (citizen: CitizenLookupResult) => {
    setIdentifiedCitizen(citizen);
    setMeterNumber(citizen.greenpay_id);
    setErrorMessage(null);
  };

  const handleClearCitizen = () => {
    setIdentifiedCitizen(null);
    setMeterNumber('');
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
        meter_number: identifiedCitizen?.meter_number || meterNumber.trim().toUpperCase(),
        waste_type: wasteType,
        weight_kg: kg,
        collection_date: new Date().toISOString(),
        claim_status: claimStatus,
        admin_feedback: feedback.trim() || undefined,
        ai_classification_id: selectedAiClassificationId || undefined,
      });
      setConfirmationOpen(false);
      setSubmitting(false);
      setSuccessMessage(t('waste_mgmt.offline_saved'));
      setWeightKg('');
      setFeedback('');
      setSelectedAiClassificationId(null);
      setAiResult(null);
      return;
    }

    try {
      const resp = await api.post<WasteEntry>('/admin/waste', {
        meter_number: identifiedCitizen?.meter_number || meterNumber.trim().toUpperCase(),
        greenpay_id: identifiedCitizen?.greenpay_id || (meterNumber.trim().toUpperCase().startsWith('GP-') ? meterNumber.trim().toUpperCase() : undefined),
        waste_type: wasteType,
        weight_kg: kg,
        claim_status: claimStatus,
        admin_feedback: feedback.trim() || undefined,
        ai_classification_id: selectedAiClassificationId || undefined,
      });

      setConfirmationOpen(false);
      setSuccessMessage(
        t('waste_mgmt.success_msg', {
          weight: resp.weight_kg,
          type: translateWasteType(resp.waste_type),
          meter: resp.greenpay_id || resp.meter_number || meterNumber,
          amount: resp.reward_amount ?? 0,
        })
      );
      setWeightKg('');
      setFeedback('');
      setAiResult(null);
      setSelectedAiClassificationId(null);
      setIdentifiedCitizen(null);
      setMeterNumber('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record waste entry. Please verify the meter number or GreenPay ID.');
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrScannerOpen(true)}
              leftIcon={<QrCode className="w-4 h-4 text-emerald-600" />}
            >
              Scan Citizen QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAIModal}
              leftIcon={<Cpu className="w-4 h-4 text-purple-600" />}
            >
              {t('waste_mgmt.btn_ai')}
            </Button>
          </div>
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
              {/* Identified Citizen Context Card */}
              {identifiedCitizen ? (
                <div className="mb-5 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">{identifiedCitizen.name}</h4>
                          <Badge variant="emerald" size="xs">QR Verified</Badge>
                        </div>
                        <div className="text-xs text-slate-600 font-mono mt-0.5">
                          ID: <strong className="text-emerald-800">{identifiedCitizen.greenpay_id}</strong> • Meter: {identifiedCitizen.meter_number}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleClearCitizen}
                      className="text-slate-500 hover:text-rose-600 text-xs"
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Ward: <strong>{identifiedCitizen.ward_name || 'BBMP Ward'}</strong></span>
                    <span>Current Balance: <strong className="text-emerald-700 font-mono">+{(identifiedCitizen.green_points ?? identifiedCitizen.green_points_balance ?? 0).toFixed(1)} GP</strong></span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Have citizen's QR code?</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setQrScannerOpen(true)}
                  >
                    Scan QR
                  </Button>
                </div>
              )}

              <form onSubmit={handleValidateForm} className="space-y-4">
                <Input
                  label="Citizen GreenPay ID or Electricity Meter Number"
                  type="text"
                  value={meterNumber}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setMeterNumber(val);
                    if (identifiedCitizen && val !== identifiedCitizen.greenpay_id && val !== identifiedCitizen.meter_number) {
                      setIdentifiedCitizen(null);
                    }
                  }}
                  placeholder="e.g. GP-000001 or BESCOM-IND-104928"
                  required
                  leftIcon={<Zap className="w-4 h-4 text-emerald-700" />}
                  helperText="Enter citizen's permanent GreenPay ID (GP-XXXXXX) or BESCOM meter number"
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
        subtitle="Upload or capture a waste image for AI-assisted classification."
        footer={
          aiResult ? (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAiModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverridePicker(!showOverridePicker)}
                  leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                >
                  {showOverridePicker ? 'Hide Override' : 'Override / Change'}
                </Button>
                <Button
                  variant={(overrideCategory || aiResult.classification) !== 'Contaminated Waste' ? 'primary' : 'danger'}
                  size="sm"
                  onClick={handleAcceptAI}
                  leftIcon={(overrideCategory || aiResult.classification) !== 'Contaminated Waste' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                >
                  {overrideCategory
                    ? `Accept (${overrideCategory})`
                    : aiResult.action === 'ACCEPT'
                    ? `Accept (${aiResult.classification})`
                    : 'Apply Contamination Penalty'}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAiMode('real');
                setAiError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                aiMode === 'real'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Real Image Vision</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiMode('demo');
                setAiError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                aiMode === 'demo'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Demo Test Samples</span>
            </button>
          </div>

          {/* Hidden File / Camera Inputs */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {aiMode === 'real' ? (
            <div className="space-y-3">
              {/* Photo Preview / Upload Area */}
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Captured waste preview"
                    className="max-h-56 w-auto object-contain rounded-xl"
                  />
                  <div className="w-full bg-slate-950/80 backdrop-blur-xs p-2.5 px-3 flex items-center justify-between text-xs text-white border-t border-white/10">
                    <div className="truncate max-w-[220px]">
                      <span className="font-semibold block truncate">{selectedFile?.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-white hover:bg-white/10 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-rose-400 hover:bg-rose-500/20 text-xs"
                        onClick={handleClearImage}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Capture or Upload Waste Photo
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Photograph clean dry recyclables or suspected contamination for automated vision analysis.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      leftIcon={<Camera className="w-4 h-4" />}
                    >
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Upload Image
                    </Button>
                  </div>
                  <span className="block text-[10px] text-slate-400">
                    Supports JPEG, PNG, WEBP (up to 10MB)
                  </span>
                </div>
              )}

              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAIVision}
                isLoading={aiLoading}
                disabled={!selectedFile}
                className="w-full py-2.5 text-purple-700 border-purple-200 hover:bg-purple-50 disabled:opacity-50"
                leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
              >
                {aiLoading ? 'Analyzing image with vision model...' : 'Run Vision Model Analysis'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-800">
                <span className="font-bold block">Demo Test Samples Mode:</span>
                Simulated presets for operator training and validation without taking live camera photos.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Demo Sample Preset
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                >
                  <option value="clean_pet_bottles_chips_wrappers">Clean PET Bottles & Chips Wrappers (Clean Plastic Packaging)</option>
                  <option value="clean_plastic_bottle">Clean Rigid Plastic Containers / Bottles (Clean Plastic Packaging)</option>
                  <option value="clean_cardboard">Clean Corrugated Cardboard Boxes (Paper & Cardboard)</option>
                  <option value="clean_newspaper">Clean Newspapers & Office Paper (Paper & Cardboard)</option>
                  <option value="clean_aluminum_can">Clean Aluminum Beverage Cans (Recyclable Metals & Cans)</option>
                  <option value="clean_metal_tin">Clean Metal Food Tins (Recyclable Metals & Cans)</option>
                  <option value="clean_foil">Clean Aluminum Household Foil (Recyclable Metals & Cans)</option>
                  <option value="wet_food_scraps">Wet Kitchen Food Scraps (REJECT - Contaminated / Non-Accepted)</option>
                  <option value="mixed_contaminated">Greasy Pizza Box / Mixed Residual (REJECT - Contaminated Waste)</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAIVision}
                isLoading={aiLoading}
                className="w-full py-2.5 text-purple-700 border-purple-200 hover:bg-purple-50"
                leftIcon={<Layers className="w-4 h-4 text-purple-600" />}
              >
                {aiLoading ? 'Analyzing Sample with AI Vision...' : 'Run Vision Model Analysis'}
              </Button>
            </div>
          )}

          {aiError && (
            <Alert
              type="error"
              message={aiError}
              onClose={() => setAiError(null)}
            />
          )}

          {/* AI Result Card */}
          {aiResult && (
            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{aiResult.detected_object}</span>
                <Badge
                  variant={aiResult.confidence >= 0.75 ? 'purple' : 'amber'}
                  size="xs"
                >
                  {(aiResult.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              </div>

              {/* Low Confidence Alert */}
              {aiResult.confidence < 0.75 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Low confidence ({(aiResult.confidence * 100).toFixed(0)}%) — manual verification required.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-purple-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Classification</span>
                  <span className="font-bold text-purple-950">
                    {overrideCategory || aiResult.classification}
                    {overrideCategory && <span className="text-[10px] text-amber-700 ml-1 font-semibold">(Overridden)</span>}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Reward Rate</span>
                  <span className={`font-bold ${(overrideCategory || aiResult.classification) !== 'Contaminated Waste' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {(overrideCategory || aiResult.classification) === 'Paper & Cardboard' && '+25 GP/kg'}
                    {(overrideCategory || aiResult.classification) === 'Recyclable Metals & Cans' && '+50 GP/kg'}
                    {(overrideCategory || aiResult.classification) === 'Clean Plastic Packaging' && '+100 GP/kg'}
                    {(overrideCategory || aiResult.classification) === 'Contaminated Waste' && '-15 GP penalty'}
                  </span>
                </div>
              </div>

              {/* Override Picker */}
              {showOverridePicker && (
                <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-slate-600">
                    Select Manual Category Override:
                  </label>
                  <select
                    value={overrideCategory || aiResult.classification}
                    onChange={(e) => setOverrideCategory(e.target.value as WasteType)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Paper & Cardboard">📦 Paper & Cardboard (25 GP/kg)</option>
                    <option value="Recyclable Metals & Cans">🥫 Recyclable Metals & Cans (50 GP/kg)</option>
                    <option value="Clean Plastic Packaging">🧴 Clean Plastic Packaging (100 GP/kg)</option>
                    <option value="Contaminated Waste">⚠️ Contaminated Waste (-15 GP penalty)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Model Recommendation:</span>
                <Badge
                  variant={aiResult.action === 'ACCEPT' ? 'emerald' : 'rose'}
                  size="xs"
                >
                  {aiResult.action === 'ACCEPT' ? 'VERIFIED ACCEPT' : 'REJECT / PENALIZE'}
                </Badge>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-purple-100">
                {aiResult.description}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Citizen QR Scanner Modal */}
      <CitizenQRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onCitizenResolved={handleCitizenResolved}
      />
    </div>
  );
};
