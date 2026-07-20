'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Download, Home, QrCode } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const QRTAGS_BG = '#111111';
const QRTAGS_ACCENT = '#E3B23C';
const QRTAGS_INK = '#111111';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activationData, setActivationData] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('activationData');
    if (stored) {
      setActivationData(JSON.parse(stored));
    }
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <main className="min-h-screen page-dark-theme flex items-center justify-center p-5" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
      <div
        className="relative max-w-md w-full rounded-2xl p-8 shadow-2xl text-center"
        style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <QRTagsLogo size="md" variant="light" />
        </div>

        {/* Icône succès */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: QRTAGS_INK, border: `3px dashed ${QRTAGS_ACCENT}` }}
        >
          <CheckCircle2 className="w-12 h-12" style={{ color: QRTAGS_ACCENT }} />
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: QRTAGS_INK }}>
          🎉 Votre QR code est activé !
        </h1>

        {activationData?.objectName && (
          <p className="text-base mb-2" style={{ color: QRTAGS_INK, opacity: 0.8 }}>
            Votre <strong>{activationData.objectName}</strong> est maintenant protégé.
          </p>
        )}

        <p className="text-sm mb-6" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
          Si vous le perdez, le trouveur pourra vous contacter directement sur WhatsApp
          {activationData?.whatsapp ? ` au ${activationData.whatsapp}` : ''}.
        </p>

        {/* Référence + PIN */}
        {activationData && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)', border: `2px dashed ${QRTAGS_INK}40` }}>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <div className="text-xs font-bold opacity-60" style={{ color: QRTAGS_INK }}>RÉFÉRENCE</div>
                <div className="font-mono font-bold text-sm" style={{ color: QRTAGS_INK }}>{activationData.reference}</div>
              </div>
              {activationData.expiresAt && (
                <div className="col-span-2">
                  <div className="text-xs font-bold opacity-60" style={{ color: QRTAGS_INK }}>EXPIRE LE</div>
                  <div className="text-sm" style={{ color: QRTAGS_INK }}>{formatDate(activationData.expiresAt)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}
          >
            <Download className="w-5 h-5" />
            Télécharger mon QR code
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ border: `2px dashed ${QRTAGS_INK}`, color: QRTAGS_INK }}
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>

        <p className="text-xs mt-6" style={{ color: QRTAGS_INK, opacity: 0.5 }}>
          Propulsé par QRTags
        </p>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <SuccessContent />
    </Suspense>
  );
}
