'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Globe,
  AlertCircle,
  Package,
} from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';
import DynamicTagForm from '@/components/qrtags/DynamicTagForm';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { PRODUCT_TYPES, getAgencyTypeDef } from '@/lib/agency-types';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

const QRTAGS_BG = '#111111';
const QRTAGS_ACCENT = '#E3B23C';
const QRTAGS_INK = '#111111';

function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-transparent border-2 rounded-full text-sm font-medium"
        style={{ borderColor: QRTAGS_ACCENT, color: QRTAGS_ACCENT }}
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-[#111] border-2 rounded-xl overflow-hidden z-50 min-w-[140px]" style={{ borderColor: QRTAGS_ACCENT }}>
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm"
              style={{
                color: lang === l ? QRTAGS_INK : QRTAGS_ACCENT,
                background: lang === l ? QRTAGS_ACCENT : 'transparent',
              }}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';
  const { t, lang, setLang } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('FR');
  const [agencyType, setAgencyType] = useState<string | null>(null);
  const [productType, setProductType] = useState('laptop');
  const [customData, setCustomData] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(),
    firstName: '',
    lastName: '',
    whatsapp: '',
  });

  // Récupérer l'agencyType du tag
  useEffect(() => {
    if (!qrFromUrl) return;
    (async () => {
      try {
        const res = await fetch(`/api/baggage/${qrFromUrl.toUpperCase()}/status`);
        if (res.ok) {
          const data = await res.json();
          setAgencyType(data.tag?.agency?.agencyType || null);
        }
      } catch {}
    })();
  }, [qrFromUrl]);

  const missingReference = !formData.reference;

  const doSubmit = async () => {
    if (missingReference) return;
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.whatsapp.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          customData: {
            ...customData,
            product_type: productType,
            product_label: PRODUCT_TYPES.find((p) => p.value === productType)?.label || productType,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: formData.reference,
          firstName: formData.firstName,
          lastName: formData.lastName,
          whatsapp: formData.whatsapp,
          type: 'voyageur',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
          ownerPin: data.baggage?.ownerPin,
        }));
        router.push('/success?type=voyageur');
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen page-dark-theme" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="flex items-center justify-center p-5 md:p-8 min-h-screen">
        <div
          className="relative max-w-md w-full rounded-2xl p-6 md:p-8 shadow-2xl"
          style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <QRTagsLogo size="md" variant="light" />
          </div>

          <div className="text-center mb-6">
            <div className="inline-block w-16 h-16 bg-white border-2 border-[#111111] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-[#111111]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#111111] mb-1">
              {t('common.welcome')}
            </h1>
            <p className="text-[#111111]/70 text-sm md:text-base">
              Activez votre tag QRTags pour protéger votre objet
            </p>
          </div>

          {missingReference && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Référence QR manquante. Scannez votre QR code pour commencer.
            </div>
          )}

          {/* Référence */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-[#111111]">
              Référence du tag *
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
              placeholder="QRT26-XXXXXX"
              className="w-full px-4 py-3 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none border-2 border-[#111111]"
              readOnly={!!qrFromUrl}
            />
          </div>

          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-[#111111]">Prénom *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Marie"
                className="w-full px-3 py-2.5 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none border-2 border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-[#111111]">Nom *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                className="w-full px-3 py-2.5 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none border-2 border-[#111111]"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-[#111111]">
              Numéro WhatsApp *
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-3 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none border-2 border-[#111111]"
            />
            <p className="text-xs text-[#111111]/60 mt-1">
              Ce numéro recevra le message WhatsApp si votre objet est trouvé
            </p>
          </div>

          {/* Objet à protéger */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1 text-[#111111]">
              Objet à protéger *
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-transparent text-[#111111] focus:outline-none border-2 border-[#111111]"
            >
              {PRODUCT_TYPES.map((p) => (
                <option key={p.value} value={p.value} className="bg-white text-black">
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Champs dynamiques par métier */}
          {agencyType && agencyType !== 'generic' && (
            <div className="mb-4 p-4 bg-[#111111]/5 rounded-xl border border-[#111111]/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🏢</span>
                <div className="flex-1">
                  <div className="font-bold text-sm text-[#111111]">
                    {getAgencyTypeDef(agencyType)?.label || 'Informations'}
                  </div>
                  <div className="text-xs text-[#111111]/60">
                    {getAgencyTypeDef(agencyType)?.description}
                  </div>
                </div>
              </div>
              <DynamicTagForm
                agencyType={agencyType}
                values={customData}
                onChange={setCustomData}
                compact
              />
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={doSubmit}
            disabled={loading || missingReference}
            className="w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-50"
            style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#E3B23C]/30 border-t-[#E3B23C] rounded-full animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Activer mon tag
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-xs text-center mt-4 text-[#111111]/60">
            En activant ce tag, vous acceptez d'être contacté via WhatsApp
            si votre objet est trouvé.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <InscrireContent />
    </Suspense>
  );
}
