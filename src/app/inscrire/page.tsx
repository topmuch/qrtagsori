'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  AlertCircle,
  Package,
  CheckCircle2,
  MapPin,
  Gift,
  MessageCircle,
  Camera,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { OBJECT_CATEGORIES, getObjectCategory } from '@/lib/agency-types';
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
              style={{ color: lang === l ? QRTAGS_INK : QRTAGS_ACCENT, background: lang === l ? QRTAGS_ACCENT : 'transparent' }}
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

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(),
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    objectName: '',
    objectDescription: '',
    city: '',
    country: '',
    reward: '',
    messageToFinder: '',
  });

  const [categoryData, setCategoryData] = useState<Record<string, string>>({});

  // Sauvegarde auto en localStorage
  useEffect(() => {
    const draft = localStorage.getItem('qrtags_draft');
    if (draft) {
      try {
        const saved = JSON.parse(draft);
        if (saved.reference === formData.reference) {
          setFormData(saved.formData || formData);
          setSelectedCategory(saved.selectedCategory || null);
          setCategoryData(saved.categoryData || {});
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (formData.reference) {
      localStorage.setItem('qrtags_draft', JSON.stringify({ formData, selectedCategory, categoryData }));
    }
  }, [formData, selectedCategory, categoryData]);

  const missingReference = !formData.reference;
  const selectedCat = selectedCategory ? getObjectCategory(selectedCategory) : null;

  const canSubmitStep1 = !!selectedCategory;
  const canSubmitStep2 =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.whatsapp.trim() &&
    formData.objectName.trim() &&
    formData.objectDescription.trim() &&
    acceptTerms &&
    acceptPrivacy;

  const doSubmit = async () => {
    if (!canSubmitStep2) return;
    setLoading(true);
    try {
      const customData = {
        ...categoryData,
        category: selectedCategory,
        category_label: selectedCat?.label,
        object_name: formData.objectName,
        object_description: formData.objectDescription,
        city: formData.city,
        country: formData.country,
        reward: formData.reward,
        message_to_finder: formData.messageToFinder,
        email: formData.email,
      };

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          customData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: formData.reference,
          firstName: formData.firstName,
          lastName: formData.lastName,
          whatsapp: formData.whatsapp,
          objectName: formData.objectName,
          category: selectedCat?.label,
          type: 'voyageur',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
          ownerPin: data.baggage?.ownerPin,
        }));
        localStorage.removeItem('qrtags_draft');
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
          className="relative max-w-2xl w-full rounded-2xl p-6 md:p-8 shadow-2xl"
          style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <QRTagsLogo size="md" variant="light" />
          </div>

          {/* Titre */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: QRTAGS_INK }}>
              🎯 Activez votre QR code
            </h1>
            <p className="text-sm" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
              Protégez vos objets en 2 minutes
            </p>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-2 rounded-full transition-all" style={{ background: step >= 1 ? QRTAGS_INK : 'rgba(17,17,17,0.2)' }} />
            <div className="flex-1 h-2 rounded-full transition-all" style={{ background: step >= 2 ? QRTAGS_INK : 'rgba(17,17,17,0.2)' }} />
          </div>
          <p className="text-center text-xs mb-6" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
            ÉTAPE {step} SUR 2 — {step === 1 ? 'QUEL OBJET ?' : 'VOS INFORMATIONS'}
          </p>

          {missingReference && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Référence QR manquante. Scannez votre QR code pour commencer.
            </div>
          )}

          {/* ═══ ÉTAPE 1 : CHOIX DE LA CATÉGORIE ═══ */}
          {step === 1 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {OBJECT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className="p-4 rounded-xl text-center transition-all hover:scale-105"
                    style={{
                      background: selectedCategory === cat.value ? QRTAGS_INK : 'rgba(17,17,17,0.05)',
                      color: selectedCategory === cat.value ? QRTAGS_ACCENT : QRTAGS_INK,
                      border: `2px solid ${selectedCategory === cat.value ? QRTAGS_INK : 'transparent'}`,
                    }}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-bold text-sm">{cat.label}</div>
                  </button>
                ))}
              </div>

              {/* Exemples de la catégorie sélectionnée */}
              {selectedCat && (
                <div className="mb-6 p-3 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)' }}>
                  <p className="text-xs" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
                    <strong>{selectedCat.icon} {selectedCat.label} :</strong> {selectedCat.examples}
                  </p>
                </div>
              )}

              <button
                onClick={() => canSubmitStep1 && setStep(2)}
                disabled={!canSubmitStep1}
                className="w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-50"
                style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT }}
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ ÉTAPE 2 : FORMULAIRE ═══ */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Référence */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Référence du tag</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-lg bg-transparent focus:outline-none border-2"
                  style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  readOnly={!!qrFromUrl}
                />
              </div>

              {/* Section 1 : Vos informations */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: QRTAGS_INK }}>👤 VOS INFORMATIONS DE CONTACT</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Prénom *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Marie"
                      className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                      style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Nom *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Dupont"
                      className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                      style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Numéro WhatsApp *</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                  <p className="text-xs mt-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                    ⚠️ Le numéro WhatsApp est essentiel pour être contacté en cas de perte.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Email (optionnel)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="marie@email.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                </div>
              </div>

              {/* Section 2 : Description de l'objet */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: QRTAGS_INK }}>
                  🏷️ DÉCRIRE VOTRE OBJET — {selectedCat?.icon} {selectedCat?.label}
                </h3>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Nom de l'objet *</label>
                  <input
                    type="text"
                    value={formData.objectName}
                    onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
                    placeholder="Ex: Mon iPhone 14"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                </div>

                {/* Champs spécifiques à la catégorie */}
                {selectedCat?.fields.map((field) => (
                  <div key={field.key} className="mb-3">
                    <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>{field.label}</label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={categoryData[field.key] || ''}
                      onChange={(e) => setCategoryData({ ...categoryData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                      style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                    />
                  </div>
                ))}

                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Description *</label>
                  <textarea
                    value={formData.objectDescription}
                    onChange={(e) => setFormData({ ...formData, objectDescription: e.target.value })}
                    placeholder="Caractéristiques distinctives, autocollants, rayures, contenu..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2 resize-none"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>📸 Photo de l'objet (optionnel)</label>
                  <button
                    type="button"
                    className="w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-sm"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  >
                    <Camera className="w-4 h-4" />
                    Ajouter une photo
                  </button>
                </div>
              </div>

              {/* Section 3 : Localisation */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: QRTAGS_INK }}>📍 VOTRE LOCALISATION</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Dakar"
                      className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                      style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Sénégal"
                      className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                      style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>
                    <Gift className="w-3 h-3 inline mr-1" /> Récompense proposée (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                    placeholder="Ex: 5000 FCFA"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: QRTAGS_INK }}>
                    <MessageCircle className="w-3 h-3 inline mr-1" /> Message au trouveur (optionnel)
                  </label>
                  <textarea
                    value={formData.messageToFinder}
                    onChange={(e) => setFormData({ ...formData, messageToFinder: e.target.value })}
                    placeholder="Merci de me contacter, je récompenserai généreusement !"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent focus:outline-none border-2 resize-none"
                    style={{ borderColor: QRTAGS_INK, color: QRTAGS_INK }}
                  />
                </div>
              </div>

              {/* Section 4 : Confirmation */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.05)' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: QRTAGS_INK }}>✅ CONFIRMATION</h3>
                <label className="flex items-start gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-xs" style={{ color: QRTAGS_INK }}>J'accepte les conditions d'utilisation</span>
                </label>
                <label className="flex items-start gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-xs" style={{ color: QRTAGS_INK }}>
                    Je comprends que mes informations seront visibles uniquement par la personne qui trouve mon objet
                  </span>
                </label>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl font-bold flex items-center gap-2"
                  style={{ border: `2px solid ${QRTAGS_INK}`, color: QRTAGS_INK }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Précédent
                </button>
                <button
                  onClick={doSubmit}
                  disabled={loading || !canSubmitStep2}
                  className="flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
                      Activer mon QR code
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-center mt-6" style={{ color: QRTAGS_INK, opacity: 0.5 }}>
            Propulsé par QRTags
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
