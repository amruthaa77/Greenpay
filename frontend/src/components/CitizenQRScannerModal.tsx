import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Search,
  UserCheck,
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Modal, Button, Badge, Alert } from './ui';
import { resolveCitizenByGreenpayId } from '../services/api';
import type { CitizenLookupResult } from '../types';

interface CitizenQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitizenResolved: (citizen: CitizenLookupResult) => void;
}

export const CitizenQRScannerModal: React.FC<CitizenQRScannerModalProps> = ({
  isOpen,
  onClose,
  onCitizenResolved,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvedCitizen, setResolvedCitizen] = useState<CitizenLookupResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const containerId = 'greenpay-qr-reader';

  // Handle citizen identification API call
  const handleResolveCitizen = async (rawId: string) => {
    if (!rawId.trim()) return;
    setLoading(true);
    setResolveError(null);

    try {
      const citizen = await resolveCitizenByGreenpayId(rawId);
      setResolvedCitizen(citizen);
      // Stop scanner upon successful detection
      stopScanner();
    } catch (err: any) {
      console.error('Citizen resolution error:', err);
      setResolveError(err.message || 'Failed to identify citizen.');
    } finally {
      setLoading(false);
    }
  };

  // Start camera scanner
  const startScanner = async () => {
    setCameraError(null);
    try {
      // Ensure element exists in DOM before initializing
      const elem = document.getElementById(containerId);
      if (!elem) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      if (!isScanningRef.current) {
        isScanningRef.current = true;
        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Decoded QR text e.g. "GREENPAY:GP-000001"
            handleResolveCitizen(decodedText);
          },
          () => {
            // Scan failure callback (ignore frames without QR)
          }
        );
      }
    } catch (err: any) {
      console.warn('Camera scanner initialization failed:', err);
      isScanningRef.current = false;
      setCameraError(
        'Camera access was denied or is unavailable on this device. You can enter the GreenPay ID manually.'
      );
      setActiveTab('manual');
    }
  };

  // Stop camera scanner
  const stopScanner = () => {
    if (scannerRef.current && isScanningRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          isScanningRef.current = false;
          scannerRef.current?.clear();
          scannerRef.current = null;
        })
        .catch((err) => {
          console.warn('Error stopping scanner:', err);
          isScanningRef.current = false;
        });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setResolvedCitizen(null);
      setResolveError(null);
      setCameraError(null);
      setManualId('');
      if (activeTab === 'camera') {
        const timeout = setTimeout(() => {
          startScanner();
        }, 150);
        return () => clearTimeout(timeout);
      }
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      handleResolveCitizen(manualId.trim());
    }
  };

  const handleStartCollection = () => {
    if (resolvedCitizen) {
      onCitizenResolved(resolvedCitizen);
      onClose();
    }
  };

  const handleReset = () => {
    setResolvedCitizen(null);
    setResolveError(null);
    setManualId('');
    if (activeTab === 'camera') {
      startScanner();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Citizen Identification & QR Verification"
      subtitle="Scan citizen QR or enter GreenPay ID to attach collection context"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Identified Citizen Banner / Card */}
        {resolvedCitizen ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-300 dark:border-emerald-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <Badge variant="emerald" size="sm" dot>
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                CITIZEN FOUND ✓
              </Badge>
              <Badge variant="purple" size="xs">
                {resolvedCitizen.user_type}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {resolvedCitizen.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                  {resolvedCitizen.greenpay_id}
                </span>
                <span>•</span>
                <span>Meter: {resolvedCitizen.meter_number}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80">
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                <div className="text-[10px] font-bold uppercase text-slate-400">Current Wallet</div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {resolvedCitizen.green_points.toFixed(1)} GP
                </div>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                <div className="text-[10px] font-bold uppercase text-slate-400">Ward Segregation</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200">
                  {resolvedCitizen.ward_name || `Ward ${resolvedCitizen.ward_number || 151}`}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartCollection}
                className="flex-1"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Waste Collection
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                title="Scan another citizen"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switch Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                Live Camera Scan
              </button>
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  setActiveTab('manual');
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4 text-purple-600" />
                Manual GreenPay ID
              </button>
            </div>

            {/* Error notifications */}
            {cameraError && activeTab === 'camera' && (
              <Alert type="warning" message={cameraError} />
            )}

            {resolveError && (
              <Alert
                type="error"
                message={resolveError}
                onClose={() => setResolveError(null)}
              />
            )}

            {/* Tab 1: Camera Scanner */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl border border-slate-700 min-h-[260px] flex flex-col items-center justify-center">
                  <div id={containerId} className="w-full max-w-[280px]" />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-emerald-300">
                        Verifying Citizen Identity...
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-center text-slate-500">
                  Point camera at the citizen's permanent GreenPay QR code.
                </p>
              </div>
            )}

            {/* Tab 2: Manual GreenPay ID fallback */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Enter Citizen GreenPay ID or Meter
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value.toUpperCase())}
                      placeholder="e.g. GP-000001 or BESCOM-IND-104928"
                      className="w-full py-2.5 pl-10 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      autoFocus
                    />
                    <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts permanent GreenPay ID (GP-XXXXXX) or electricity meter number.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={loading}
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  {loading ? 'Searching Citizen...' : 'Find Citizen'}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
