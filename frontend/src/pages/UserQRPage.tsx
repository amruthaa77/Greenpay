import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CitizenQRCode } from '../components/CitizenQRCode';
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../components/ui';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const UserQRPage: React.FC = () => {
  const { session } = useAuth();
  const greenpayId = session?.greenpay_id || 'GP-000001';

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="My Permanent GreenPay QR"
        subtitle="Your unique civic identifier for dry recyclable waste weighment and automated Green Points rewards"
        badge={<Badge variant="emerald" dot>OFFICIAL BBMP CIVIC-ID</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Main QR Card */}
        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-sm">
            <CitizenQRCode
              greenpayId={greenpayId}
              userName={session?.name}
              meterNumber={session?.meter_number}
              size={260}
            />
          </div>
        </div>

        {/* How It Works & Civic Instructions */}
        <div className="md:col-span-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How Civic Collection Works</CardTitle>
              <CardDescription>
                Zero-friction handoff to door-to-door municipal collection workers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">Segregate Dry Recyclables</h4>
                  <p>Keep clean paper, cardboard, plastic bottles, packaging, and metal cans clean and free of food scraps.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">Show Your GreenPay QR</h4>
                  <p>The field collector scans your permanent QR from their terminal or phone to link the collection to your wallet.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">Instant Green Points Credit</h4>
                  <p>Certified weighment calculates transparent Green Points credited directly to your municipal wallet.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 rounded-3xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Privacy & Cryptographic Security
            </div>
            <p className="text-[11px] text-purple-700/90 dark:text-purple-400 leading-relaxed">
              Your GreenPay QR contains only your safe public civic ID. It contains no passwords, bank details, or private credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
