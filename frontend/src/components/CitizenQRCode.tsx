import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Check, Copy, ShieldCheck } from 'lucide-react';
import { Badge, Button } from './ui';

interface CitizenQRCodeProps {
  greenpayId: string;
  userName?: string;
  meterNumber?: string;
  size?: number;
  showCardWrapper?: boolean;
}

export const CitizenQRCode: React.FC<CitizenQRCodeProps> = ({
  greenpayId,
  userName,
  meterNumber,
  size = 240,
  showCardWrapper = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);

  // Canonical QR payload: GREENPAY:GP-XXXXXX
  const qrPayload = `GREENPAY:${greenpayId.toUpperCase()}`;

  useEffect(() => {
    let isMounted = true;
    setGenerating(true);

    QRCode.toDataURL(qrPayload, {
      width: size * 2, // 2x for sharp rendering on retina screens
      margin: 1.5,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate Citizen QR:', err);
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload, size]);

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(greenpayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const content = (
    <div className="flex flex-col items-center text-center space-y-4">
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="emerald" size="sm" dot>
          <QrCode className="w-3.5 h-3.5 mr-1 text-emerald-700" />
          MY GREENPAY QR
        </Badge>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          CIVIC-ID
        </span>
      </div>

      {userName && (
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {userName}
        </h3>
      )}

      {/* QR Display Frame */}
      <div className="relative p-3 sm:p-4 bg-white rounded-3xl border-2 border-emerald-500/20 shadow-md flex items-center justify-center">
        {generating ? (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse"
          >
            <QrCode className="w-12 h-12 text-slate-300 animate-spin" />
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`GreenPay QR for ${greenpayId}`}
            style={{ width: size, height: size }}
            className="rounded-2xl select-none"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 rounded-2xl text-xs text-rose-500 font-semibold"
          >
            QR Generation Error
          </div>
        )}

        <div className="absolute -bottom-2.5 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-200" />
          Permanent Civic ID
        </div>
      </div>

      {/* GreenPay ID with Copy */}
      <div className="pt-1 flex flex-col items-center gap-1.5 w-full">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          GreenPay ID
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-mono font-black text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-800 tracking-wider">
            {greenpayId}
          </span>
          <button
            onClick={handleCopyId}
            title="Copy GreenPay ID"
            className="p-2 text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {meterNumber && (
          <span className="text-xs font-mono text-slate-500">
            Meter: {meterNumber}
          </span>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
        Show this QR code to the municipal collector when handing over clean dry recyclables to automatically record your collection.
      </p>

      {/* Download Action */}
      {qrDataUrl && (
        <a
          href={qrDataUrl}
          download={`greenpay-qr-${greenpayId}.png`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all w-full max-w-xs"
        >
          <Download className="w-4 h-4" />
          Download Permanent QR
        </a>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
      {content}
    </div>
  );
};
