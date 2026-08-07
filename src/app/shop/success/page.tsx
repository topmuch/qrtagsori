import { Suspense } from 'react';
import SuccessContent from './SuccessContent';

// ════════════════════════════════════════════════════════════════
// Server component wrapper — Suspense boundary obligatoire
// pour useSearchParams() dans le prerendering Next.js
// ════════════════════════════════════════════════════════════════

function SuccessFallback() {
  return (
    <div style={{ background: '#111111', minHeight: '100vh' }} className="flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full" style={{ background: '#E3B23C' }} />
        <p className="text-lg font-bold" style={{ color: '#E3B23C' }}>Chargement...</p>
      </div>
    </div>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
