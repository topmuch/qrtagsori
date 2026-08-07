'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Clock, Shield, Sparkles, Loader2 } from 'lucide-react';
import PackPratique from '@/components/scan/PackPratique';
import PackEmotion from '@/components/scan/PackEmotion';
import PackImmobilier from '@/components/scan/PackImmobilier';
import PackEvenementiel from '@/components/scan/PackEvenementiel';

// ─── Design tokens ───
const QRTAGS_BG   = '#E3B23C';
const QRTAGS_RED  = '#DC2626';
const QRIOO_PURPLE = '#7C3AED';
const CARD_CLASS  = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

// ─── Types ───
interface ObjectInfo {
  category?: string | null;
  category_label?: string | null;
  object_name?: string | null;
  object_description?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  reward?: string | null;
  message_to_finder?: string | null;
  city?: string | null;
  country?: string | null;
  photo?: string | null;
}

interface BaggageData {
  reference: string;
  type: string;
  travelerName: string;
  travelerFirstName?: string | null;
  status: string;
  agency?: string | null;
  whatsappOwner?: string | null;
  declaredLostAt?: string | null;
  foundAt?: string | null;
  createdAt?: string | null;
  isLost?: boolean;
  objectInfo?: ObjectInfo | null;
  contentType?: string | null;
  contentUrl?: string | null;
  contentMetadata?: Record<string, unknown> | null;
}

interface GuestMessageData {
  id: string;
  authorName: string;
  content: string;
  contentType: string | null;
  contentUrl: string | null;
  createdAt: string;
}

interface ScanData {
  status: string;
  message?: string;
  theme?: string;
  type?: string;
  packType?: string;
  agency?: string | null;
  baggage?: BaggageData;
  guestMessages?: GuestMessageData[];
}

const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

// ─── Main Page Component ───
export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const [tagData, setTagData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch tag data ───
  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${reference}`, { cache: 'no-store' });
        const data: ScanData = await res.json();
        setTagData(data);
      } catch (err) {
        console.error('Erreur fetch tag:', err);
        setTagData({ status: 'not_found' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  // ─── Redirect to inscription if pending activation (pratique pack only) ───
  useEffect(() => {
    if (tagData && PENDING_STATUSES.has(tagData.status) && tagData.packType === 'pratique') {
      router.push(`/inscrire?qr=${reference}`);
    }
  }, [tagData, reference, router]);

  // ─── Loading state ───
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: QRIOO_PURPLE }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-white" />
          <p className="text-lg font-bold text-white">Chargement...</p>
        </div>
      </main>
    );
  }

  // ─── Not found ───
  if (tagData?.status === 'not_found') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRIOO_PURPLE }}>
        <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-gray-900 mb-3">Code QR non valide</h1>
          <p className="text-gray-600 mb-6">Ce code QR n&apos;existe pas dans notre système.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: QRIOO_PURPLE }}>
            Retour à l&apos;accueil
          </a>
        </div>
      </main>
    );
  }

  // ─── Expired ───
  if (tagData?.status === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRIOO_PURPLE }}>
        <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-gray-900 mb-3">Contenu expiré</h1>
          <p className="text-gray-600 mb-6">Ce contenu n&apos;est plus disponible.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: QRIOO_PURPLE }}>
            Retour
          </a>
        </div>
      </main>
    );
  }

  // ─── Blocked ───
  if (tagData?.status === 'blocked') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRIOO_PURPLE }}>
        <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-gray-900 mb-3">Contenu bloqué</h1>
          <a href="/" className="inline-block px-6 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: QRIOO_PURPLE }}>
            Retour
          </a>
        </div>
      </main>
    );
  }

  // ─── Pending activation (pratique pack, redirecting) ───
  if (tagData && PENDING_STATUSES.has(tagData.status) && tagData.packType === 'pratique') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#111' }} />
          <h1 className="text-2xl font-black text-black mb-3">Redirection...</h1>
          <p className="text-black/70">Ce tag doit être activé. Vous allez être redirigé.</p>
        </div>
      </main>
    );
  }

  // ─── No baggage data ───
  if (!tagData?.baggage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRIOO_PURPLE }}>
        <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-gray-900 mb-3">Données indisponibles</h1>
          <a href="/" className="inline-block px-6 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: QRIOO_PURPLE }}>
            Retour
          </a>
        </div>
      </main>
    );
  }

  // ─── Switch on packType ───
  const packType = tagData.packType || 'pratique';
  const baggage = tagData.baggage;

  switch (packType) {
    case 'emotion':
      return (
        <PackEmotion
          reference={reference}
          contentType={baggage.contentType || null}
          contentUrl={baggage.contentUrl || null}
          contentMetadata={baggage.contentMetadata || null}
          travelerName={baggage.travelerName || null}
        />
      );

    case 'immobilier':
      return (
        <PackImmobilier
          reference={reference}
          contentMetadata={baggage.contentMetadata || null}
          travelerName={baggage.travelerName || null}
        />
      );

    case 'evenementiel':
      return (
        <PackEvenementiel
          reference={reference}
          contentMetadata={baggage.contentMetadata || null}
          travelerName={baggage.travelerName || null}
          initialMessages={tagData.guestMessages || []}
        />
      );

    case 'pratique':
    default:
      return (
        <PackPratique
          reference={reference}
          baggage={baggage}
        />
      );
  }
}
