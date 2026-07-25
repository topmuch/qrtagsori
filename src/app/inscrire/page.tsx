'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  AlertCircle,
  Camera,
  Gift,
  MessageCircle,
  Loader2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  WifiOff,
  ShieldCheck,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { OBJECT_CATEGORIES, getObjectCategory } from '@/lib/agency-types';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// ─── Design tokens QRTags (CONSERVÉS TELS QUELS) ─────────────────────
const QRTAGS_BG       = '#E3B23C';   // fond de page jaune moutarde
const QRTAGS_CARD     = '#FFFFFF';   // cartes blanches
const QRTAGS_INK      = '#111111';   // texte noir
const QRTAGS_INPUT_BG = '#F9FAFB';   // gris très clair pour inputs
const QRTAGS_PLACE    = '#9CA3AF';   // placeholder gris moyen
const QRTAGS_RED      = '#DC2626';   // messages d'alerte
const QRTAGS_GREEN    = '#16A34A';   // succès

// Classes Tailwind réutilisables (style "cartes blanches sur jaune")
const INPUT_CLASS =
  'w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]';
const CARD_CLASS =
  'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-black rounded-full text-sm font-bold text-black hover:bg-gray-50 transition"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border-2 border-black rounded-xl overflow-hidden z-50 min-w-[140px] shadow-xl">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLang(l); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-gray-100"
              style={{ color: lang === l ? '#E3B23C' : '#111111', background: lang === l ? '#111111' : 'transparent' }}
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
  const { lang, setLang } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── NOUVEAU : toggle pour afficher/masquer les détails optionnels ───
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ─── NOUVEAU (Étape 2) : suivi des champs « touchés » pour validation inline ───
  // On ne montre l'erreur qu'après que l'utilisateur a interagi avec le champ.
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // ─── NOUVEAU (Étape 3) : méta-données photo (tailles avant/après compression) ───
  const [photoMeta, setPhotoMeta] = useState<{
    originalSizeKB: number;
    compressedSizeKB: number;
    isProcessing: boolean;
  } | null>(null);

  // ─── NOUVEAU (Étape 3) : indicateur « brouillon restauré » ───
  const [draftRestored, setDraftRestored] = useState(false);

  // ─── NOUVEAU (Étape 4) : erreur de soumission (affichée inline, plus de alert) ───
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── NOUVEAU (Étape 4) : phase de soumission pour affiner le loader ───
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'sending' | 'redirecting'>('idle');

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

  // ─── Restauration brouillon (localStorage) — ÉTENDU (Étape 3) ───
  // Restaure désormais : formData, selectedCategory, categoryData, touched,
  // showAdvanced, acceptTerms, acceptPrivacy, photoPreview.
  useEffect(() => {
    const draft = localStorage.getItem('qrtags_draft');
    if (draft) {
      try {
        const saved = JSON.parse(draft);
        if (saved.formData?.reference === formData.reference) {
          setFormData(saved.formData);
          setSelectedCategory(saved.selectedCategory || null);
          setCategoryData(saved.categoryData || {});
          if (saved.touched) setTouched(saved.touched);
          if (typeof saved.showAdvanced === 'boolean') setShowAdvanced(saved.showAdvanced);
          if (typeof saved.acceptTerms === 'boolean') setAcceptTerms(saved.acceptTerms);
          if (typeof saved.acceptPrivacy === 'boolean') setAcceptPrivacy(saved.acceptPrivacy);
          if (typeof saved.photoPreview === 'string') setPhotoPreview(saved.photoPreview);
          setDraftRestored(true);
          // Masquer la bannière « brouillon restauré » après 6 s
          setTimeout(() => setDraftRestored(false), 6000);
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sauvegarde auto (localStorage) — ÉTENDU (Étape 3) ───
  // On persiste tout l'état pertinent pour pouvoir reprendre plus tard.
  useEffect(() => {
    if (formData.reference) {
      try {
        localStorage.setItem(
          'qrtags_draft',
          JSON.stringify({
            formData,
            selectedCategory,
            categoryData,
            touched,
            showAdvanced,
            acceptTerms,
            acceptPrivacy,
            photoPreview, // data URL déjà compressée — peu volumineuse
            savedAt: Date.now(),
          })
        );
      } catch {
        // localStorage peut être plein (photo trop grosse) — on ignore silencieusement
      }
    }
  }, [formData, selectedCategory, categoryData, touched, showAdvanced, acceptTerms, acceptPrivacy, photoPreview]);

  // ─── NOUVEAU (Étape 3) : effacer le brouillon manuellement ───
  const clearDraft = () => {
    localStorage.removeItem('qrtags_draft');
    setFormData({
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
    setCategoryData({});
    setSelectedCategory(null);
    setTouched({});
    setShowAdvanced(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setPhotoPreview(null);
    setPhotoMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setDraftRestored(false);
  };

  const missingReference = !formData.reference;
  const selectedCat = selectedCategory ? getObjectCategory(selectedCategory) : null;

  // ─── NOUVEAU (Étape 2) : fonctions de validation par champ ───
  // Regex WhatsApp : + optionnel, puis 9 à 15 chiffres (espaces/tirets autorisés en saisie).
  const WHATSAPP_REGEX = /^\+?[0-9][0-9\s\-]{8,18}[0-9]$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Nettoie un numéro WhatsApp pour extraire uniquement les chiffres + le « + » éventuel.
  function cleanWhatsapp(raw: string): string {
    const trimmed = raw.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    return hasPlus ? `+${digits}` : digits;
  }

  function validateFirstName(v: string): string | null {
    if (!v.trim()) return 'Le prénom est requis';
    if (v.trim().length < 2) return 'Au moins 2 caractères';
    return null;
  }
  function validateLastName(v: string): string | null {
    if (!v.trim()) return 'Le nom est requis';
    if (v.trim().length < 2) return 'Au moins 2 caractères';
    return null;
  }
  function validateWhatsapp(v: string): string | null {
    const cleaned = cleanWhatsapp(v);
    if (!cleaned) return 'Le numéro WhatsApp est requis';
    if (!WHATSAPP_REGEX.test(cleaned)) {
      return 'Format attendu : +221 77 123 45 67 (9 à 15 chiffres)';
    }
    return null;
  }
  function validateObjectName(v: string): string | null {
    if (!v.trim()) return 'Le nom de l\'objet est requis';
    if (v.trim().length < 2) return 'Au moins 2 caractères';
    return null;
  }
  function validateObjectDescription(v: string): string | null {
    if (!v.trim()) return 'La description est requise';
    if (v.trim().length < 10) return 'Au moins 10 caractères pour aider le trouveur';
    return null;
  }
  function validateEmail(v: string): string | null {
    if (!v.trim()) return null; // optionnel
    if (!EMAIL_REGEX.test(v.trim())) return 'Adresse email invalide';
    return null;
  }

  // ─── NOUVEAU : erreurs calculées (pour désactiver bouton + afficher inline) ───
  const errors = {
    firstName: validateFirstName(formData.firstName),
    lastName: validateLastName(formData.lastName),
    whatsapp: validateWhatsapp(formData.whatsapp),
    objectName: validateObjectName(formData.objectName),
    objectDescription: validateObjectDescription(formData.objectDescription),
    email: validateEmail(formData.email),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  // ─── Compteur des champs essentiels valides (pas juste remplis) ───
  // Essentiels : firstName, lastName, whatsapp, objectName, objectDescription
  const essentialValidFlags = [
    !errors.firstName,
    !errors.lastName,
    !errors.whatsapp,
    !errors.objectName,
    !errors.objectDescription,
  ];
  const essentialFilled = essentialValidFlags.filter(Boolean).length;
  const essentialTotal = essentialValidFlags.length;

  // ─── Validations — AMÉLIORÉES (basées sur erreurs et non plus juste « rempli ») ───
  const canSubmitStep1 = !!selectedCategory;
  const canSubmitStep2 =
    !hasErrors && acceptTerms && acceptPrivacy;

  // Helper pour afficher conditionnellement un message d'erreur inline
  function fieldError(field: keyof typeof errors): string | null {
    if (!touched[field]) return null;
    return errors[field];
  }

  // Helper : classes Tailwind dynamiques selon l'état du champ
  function inputClass(field: keyof typeof errors): string {
    const err = fieldError(field);
    if (err) {
      return 'w-full px-4 py-3 border-2 rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition text-base border-red-500 focus:border-red-500 focus:ring-red-200';
    }
    if (touched[field] && !errors[field]) {
      return 'w-full px-4 py-3 border-2 rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition text-base border-green-500 focus:border-green-500 focus:ring-green-200';
    }
    return INPUT_CLASS;
  }

  // ─── NOUVEAU (Étape 3) : compression d'image côté client ───
  // Redimensionne l'image à max 1024px de large et applique une qualité JPEG 0.8.
  // Objectif : réduire le payload envoyé à l'API activate et éviter de saturer localStorage.
  const MAX_PHOTO_WIDTH = 1024;
  const JPEG_QUALITY = 0.8;

  function compressImage(file: File): Promise<{ dataUrl: string; originalSizeKB: number; compressedSizeKB: number }> {
    return new Promise((resolve, reject) => {
      const originalSizeKB = Math.round(file.size / 1024);
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image invalide'));
        img.onload = () => {
          // Calculer les nouvelles dimensions (conserver le ratio)
          let { width, height } = img;
          if (width > MAX_PHOTO_WIDTH) {
            height = Math.round((height * MAX_PHOTO_WIDTH) / width);
            width = MAX_PHOTO_WIDTH;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas non supporté'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Toujours exporter en JPEG (plus léger que PNG pour les photos)
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          // Estimer la taille compressée (approx : base64 ~ 4/3 de la taille binaire)
          const base64Len = dataUrl.split(',')[1]?.length || 0;
          const compressedSizeKB = Math.round((base64Len * 3) / 4 / 1024);
          resolve({ dataUrl, originalSizeKB, compressedSizeKB });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validation : type image + max 5 MB
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop volumineuse (max 5 MB). Choisissez une image plus légère.');
      return;
    }
    setPhotoMeta({ originalSizeKB: 0, compressedSizeKB: 0, isProcessing: true });
    try {
      const { dataUrl, originalSizeKB, compressedSizeKB } = await compressImage(file);
      setPhotoPreview(dataUrl);
      setPhotoMeta({ originalSizeKB, compressedSizeKB, isProcessing: false });
    } catch (err) {
      console.error('Erreur compression image:', err);
      alert('Impossible de traiter cette image. Essayez-en une autre.');
      setPhotoMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const doSubmit = async () => {
    if (loading) return; // garde anti double-clic
    setSubmitError(null);

    // Marquer tous les champs comme touchés pour révéler toute erreur résiduelle
    setTouched({
      firstName: true,
      lastName: true,
      whatsapp: true,
      objectName: true,
      objectDescription: true,
      email: true,
    });
    if (hasErrors) {
      setSubmitError('Veuillez corriger les champs en rouge avant de continuer.');
      // Scroll vers la première erreur
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-error="true"]');
        if (firstErrorField) {
          (firstErrorField as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setSubmitError('Veuillez accepter les conditions et la politique de confidentialité.');
      return;
    }

    setLoading(true);
    setSubmitPhase('sending');

    try {
      // ─── Construire customData avec tous les champs du formulaire ───
      // On normalise le numéro WhatsApp en format international propre (+221771234567)
      const cleanedWhatsapp = cleanWhatsapp(formData.whatsapp);
      const customData = {
        ...categoryData,
        category: selectedCategory,
        category_label: selectedCat?.label,
        object_name: formData.objectName.trim(),
        object_description: formData.objectDescription.trim(),
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        reward: formData.reward.trim() || undefined,
        message_to_finder: formData.messageToFinder.trim() || undefined,
        email: formData.email.trim() || undefined,
        photo: photoPreview || undefined,
      };

      // ─── Timeout de sécurité : 30 s max ───
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          reference: formData.reference.trim().toUpperCase(),
          travelerFirstName: formData.firstName.trim(),
          travelerLastName: formData.lastName.trim(),
          whatsappOwner: cleanedWhatsapp,
          customData,
        }),
      });

      clearTimeout(timeoutId);

      // ─── Gestion fine des erreurs HTTP ───
      if (!response.ok) {
        let serverMessage = 'Erreur lors de l\'activation';
        try {
          const err = await response.json();
          serverMessage = err.error || err.message || serverMessage;
        } catch {}

        if (response.status === 404) {
          setSubmitError(`Tag introuvable. Vérifiez votre référence : ${formData.reference}.`);
        } else if (response.status === 400 && serverMessage.toLowerCase().includes('déjà activé')) {
          setSubmitError('Ce QR code a déjà été activé. Contactez le support si nécessaire.');
        } else if (response.status >= 500) {
          setSubmitError('Le serveur QRTags rencontre un problème temporaire. Réessayez dans quelques instants.');
        } else {
          setSubmitError(serverMessage);
        }
        setLoading(false);
        setSubmitPhase('idle');
        return;
      }

      // ─── Succès : préparer les données pour /success ───
      const data = await response.json();
      setSubmitPhase('redirecting');

      try {
        sessionStorage.setItem(
          'activationData',
          JSON.stringify({
            reference: formData.reference,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            whatsapp: cleanedWhatsapp,
            objectName: formData.objectName.trim(),
            category: selectedCat?.label,
            type: 'voyageur',
            expiresAt: data.baggage?.expiresAt,
            trackingToken: data.baggage?.trackingToken,
          })
        );
      } catch {}

      // ─── Enrichir qrbag_my_references pour /mes-bagages ───
      // Permet à l'utilisateur de retrouver ses objets activés sans compte.
      if (typeof window !== 'undefined') {
        try {
          const KEY = 'qrbag_my_references';
          const refs: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
          if (!refs.includes(formData.reference)) {
            refs.push(formData.reference);
            localStorage.setItem(KEY, JSON.stringify(refs));
          }
          // ─── Stocker aussi un résumé par référence (utile pour /mes-bagages) ───
          const summaryKey = `qrbag_summary_${formData.reference}`;
          localStorage.setItem(
            summaryKey,
            JSON.stringify({
              reference: formData.reference,
              objectName: formData.objectName.trim(),
              category: selectedCat?.label || selectedCategory,
              activatedAt: new Date().toISOString(),
              expiresAt: data.baggage?.expiresAt,
              trackingToken: data.baggage?.trackingToken,
            })
          );
        } catch {}
      }

      // ─── Nettoyage final du brouillon ( succès = on ne veut pas le restaurer ) ───
      try {
        localStorage.removeItem('qrtags_draft');
      } catch {}

      // ─── Redirection vers /success ───
      // Petit délai pour laisser l'utilisateur voir le checkmark de succès
      setTimeout(() => {
        router.push('/success?type=voyageur');
      }, 400);
    } catch (error: unknown) {
      console.error('[activate] Erreur:', error);
      // Distinguer timeout/abort vs autre erreur réseau
      const isAbort =
        error instanceof DOMException && error.name === 'AbortError';
      const isNetwork =
        error instanceof TypeError && error.message.includes('fetch');
      if (isAbort) {
        setSubmitError(
          'La requête a expiré (plus de 30 s). Vérifiez votre connexion internet et réessayez.'
        );
      } else if (isNetwork) {
        setSubmitError(
          'Impossible de contacter le serveur QRTags. Vérifiez votre connexion internet.'
        );
      } else {
        setSubmitError('Une erreur inattendue est survenue. Réessayez ou contactez le support.');
      }
      setLoading(false);
      setSubmitPhase('idle');
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      {/* ─── NOUVEAU (Étape 4) : keyframes pour l'animation pulse du loader ─── */}
      <style>{`
        @keyframes qrtags-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-20%); }
          50% { opacity: 1; transform: translateX(60%); }
        }
      `}</style>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header — CONSERVÉ */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-3xl font-black text-black mb-2">🎯 Activez votre QR code</h1>
          <p className="text-black/80">Protégez vos objets en 2 minutes</p>

          {/* Barre de progression principale — CONSERVÉE */}
          <div className="mt-4 flex gap-2 justify-center">
            <div
              className="h-2 w-20 rounded-full transition-all"
              style={{ backgroundColor: step >= 1 ? '#111' : 'rgba(17,17,17,0.2)' }}
            />
            <div
              className="h-2 w-20 rounded-full transition-all"
              style={{ backgroundColor: step >= 2 ? '#111' : 'rgba(17,17,17,0.2)' }}
            />
          </div>
          <p className="text-sm text-black/70 mt-2">
            ÉTAPE {step} SUR 2 — {step === 1 ? 'QUEL OBJET ?' : 'VOS INFORMATIONS'}
          </p>
        </div>

        {missingReference && (
          <div
            className="mb-6 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: '#FEE2E2', color: QRTAGS_RED, border: `2px solid ${QRTAGS_RED}` }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Référence QR manquante. Scannez votre QR code.</span>
          </div>
        )}

        {/* ─── ÉTAPE 1 : Catégorie d'objet — CONSERVÉE ─────────────── */}
        {step === 1 && (
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-bold text-black mb-4">Quel type d'objet voulez-vous protéger ?</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {OBJECT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="p-4 rounded-xl text-center transition-all hover:scale-105"
                    style={{
                      backgroundColor: isSelected ? '#111' : '#F9FAFB',
                      color: isSelected ? '#E3B23C' : '#111',
                      border: `2px solid ${isSelected ? '#111' : '#111'}`,
                    }}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-bold text-sm">{cat.label}</div>
                  </button>
                );
              })}
            </div>

            {selectedCat && (
              <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                <p className="text-xs text-black/70">
                  <strong>{selectedCat.icon} {selectedCat.label} :</strong> {selectedCat.examples}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => canSubmitStep1 && setStep(2)}
              disabled={!canSubmitStep1}
              className="w-full py-4 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                backgroundColor: '#111',
                color: '#E3B23C',
                border: '2px solid #111',
              }}
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ─── ÉTAPE 2 : Formulaire restructuré en 4 sections ─────── */}
        {step === 2 && (
          <div className="space-y-6">

            {/* ─── NOUVEAU : Progress bar champs essentiels ─── */}
            <div
              className="rounded-xl p-4 border-2 border-black"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-black">
                  Étape 2/2 — {essentialFilled}/{essentialTotal} champs essentiels remplis
                </span>
                {essentialFilled === essentialTotal && (
                  <CheckCircle2 className="w-5 h-5" style={{ color: QRTAGS_GREEN }} />
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(essentialFilled / essentialTotal) * 100}%`,
                    backgroundColor: essentialFilled === essentialTotal ? QRTAGS_GREEN : '#111111',
                  }}
                />
              </div>
            </div>

            {/* Référence du tag — CONSERVÉ */}
            <div className={CARD_CLASS}>
              <label className="block text-sm font-bold text-black mb-1">Référence du tag</label>
              <input
                type="text"
                value={formData.reference}
                readOnly={!!qrFromUrl}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                className={INPUT_CLASS}
              />
            </div>

            {/* ═══ SECTION 1 : CONTACT (essentiel — toujours visible) ═══ */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-1">👤 VOS INFORMATIONS DE CONTACT</h3>
              <p className="text-xs text-black/60 mb-4">
                Indispensable pour être contacté en cas de perte
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prénom */}
                <div data-error={fieldError('firstName') ? 'true' : undefined}>
                  <label className="block text-sm font-bold text-black mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    placeholder="Marie"
                    onBlur={() => markTouched('firstName')}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={inputClass('firstName')}
                  />
                  {fieldError('firstName') && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                      <XCircle className="w-3 h-3" /> {fieldError('firstName')}
                    </p>
                  )}
                  {touched.firstName && !errors.firstName && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </p>
                  )}
                </div>
                {/* Nom */}
                <div data-error={fieldError('lastName') ? 'true' : undefined}>
                  <label className="block text-sm font-bold text-black mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    placeholder="Dupont"
                    onBlur={() => markTouched('lastName')}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={inputClass('lastName')}
                  />
                  {fieldError('lastName') && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                      <XCircle className="w-3 h-3" /> {fieldError('lastName')}
                    </p>
                  )}
                  {touched.lastName && !errors.lastName && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </p>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="mt-4" data-error={fieldError('whatsapp') ? 'true' : undefined}>
                <label className="block text-sm font-bold text-black mb-1">Numéro WhatsApp *</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  placeholder="+221 77 123 45 67"
                  onBlur={() => markTouched('whatsapp')}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className={inputClass('whatsapp')}
                />
                {fieldError('whatsapp') ? (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                    <XCircle className="w-3 h-3" /> {fieldError('whatsapp')}
                  </p>
                ) : touched.whatsapp && !errors.whatsapp ? (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                    <CheckCircle2 className="w-3 h-3" /> Numéro valide
                  </p>
                ) : (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                    <AlertCircle className="w-3 h-3" />
                    Le numéro WhatsApp est essentiel pour être contacté en cas de perte.
                  </p>
                )}
              </div>
            </div>

            {/* ═══ SECTION 2 : OBJET (essentiel — toujours visible) ═══ */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-1">
                🏷️ DÉCRIRE VOTRE OBJET — {selectedCat?.icon} {selectedCat?.label}
              </h3>
              <p className="text-xs text-black/60 mb-4">
                Aidez le trouveur à identifier votre bien
              </p>

              <div className="space-y-4">
                <div data-error={fieldError('objectName') ? 'true' : undefined}>
                  <label className="block text-sm font-bold text-black mb-1">Nom de l'objet *</label>
                  <input
                    type="text"
                    value={formData.objectName}
                    placeholder="Ex: Mon iPhone 14"
                    onBlur={() => markTouched('objectName')}
                    onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
                    className={inputClass('objectName')}
                  />
                  {fieldError('objectName') && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                      <XCircle className="w-3 h-3" /> {fieldError('objectName')}
                    </p>
                  )}
                  {touched.objectName && !errors.objectName && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </p>
                  )}
                </div>

                {/* Champs dynamiques selon la catégorie — CONSERVÉS */}
                {selectedCat?.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-bold text-black mb-1">{field.label}</label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={categoryData[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setCategoryData({ ...categoryData, [field.key]: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>
                ))}

                <div data-error={fieldError('objectDescription') ? 'true' : undefined}>
                  <label className="block text-sm font-bold text-black mb-1">Description *</label>
                  <textarea
                    value={formData.objectDescription}
                    placeholder="Caractéristiques distinctives, autocollants, rayures, contenu..."
                    rows={4}
                    onBlur={() => markTouched('objectDescription')}
                    onChange={(e) => setFormData({ ...formData, objectDescription: e.target.value })}
                    className={`${inputClass('objectDescription')} resize-none`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span>
                      {fieldError('objectDescription') ? (
                        <p className="text-xs flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                          <XCircle className="w-3 h-3" /> {fieldError('objectDescription')}
                        </p>
                      ) : touched.objectDescription && !errors.objectDescription ? (
                        <p className="text-xs flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                          <CheckCircle2 className="w-3 h-3" /> Description suffisante
                        </p>
                      ) : null}
                    </span>
                    <span className="text-xs text-black/50">
                      {formData.objectDescription.trim().length} caractères
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ NOUVEAU : Toggle "Afficher les détails optionnels" ═══ */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full bg-white border-2 border-black rounded-xl p-4 flex items-center justify-between shadow-md hover:bg-gray-50 transition"
            >
              <span className="font-bold text-black flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#E3B23C' }} />
                {showAdvanced ? 'Masquer les détails optionnels' : 'Afficher les détails optionnels'}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-black transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ═══ SECTION 3 + 4 : masquées par défaut (toggle) ═══ */}
            {showAdvanced && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">

                {/* ─── SECTION 3 : LOCALISATION & OPTIONS ─── */}
                <div className={CARD_CLASS}>
                  <h3 className="text-lg font-bold text-black mb-1">📍 LOCALISATION & OPTIONS</h3>
                  <p className="text-xs text-black/60 mb-4">
                    Facultatif — augmente les chances de récupération
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">Ville</label>
                      <input
                        type="text"
                        value={formData.city}
                        placeholder="Dakar"
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">Pays</label>
                      <input
                        type="text"
                        value={formData.country}
                        placeholder="Sénégal"
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-black mb-1">
                      <Gift className="w-3 h-3 inline mr-1" />
                      Récompense proposée (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.reward}
                      placeholder="Ex: 5000 FCFA"
                      onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-1">
                      <MessageCircle className="w-3 h-3 inline mr-1" />
                      Message au trouveur (optionnel)
                    </label>
                    <textarea
                      value={formData.messageToFinder}
                      placeholder="Merci de me contacter, je récompenserai généreusement !"
                      rows={3}
                      onChange={(e) => setFormData({ ...formData, messageToFinder: e.target.value })}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </div>

                  {/* Email — déplacé ici (optionnel) */}
                  <div className="mt-4" data-error={fieldError('email') ? 'true' : undefined}>
                    <label className="block text-sm font-bold text-black mb-1">Email (optionnel)</label>
                    <input
                      type="email"
                      value={formData.email}
                      placeholder="marie@email.com"
                      onBlur={() => markTouched('email')}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass('email')}
                    />
                    {fieldError('email') && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                        <XCircle className="w-3 h-3" /> {fieldError('email')}
                      </p>
                    )}
                    {touched.email && !errors.email && formData.email.trim() && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_GREEN }}>
                        <CheckCircle2 className="w-3 h-3" /> Email valide
                      </p>
                    )}
                  </div>
                </div>

                {/* ─── SECTION 4 : PHOTO UPLOAD (Étape 3 enrichie) ─── */}
                <div className={CARD_CLASS}>
                  <h3 className="text-lg font-bold text-black mb-1">📸 PHOTO DE L'OBJET</h3>
                  <p className="text-xs text-black/60 mb-4">
                    Facultatif — facilite l'identification par le trouveur
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Aperçu"
                          className="w-full h-48 object-cover rounded-lg border-2 border-black"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoMeta(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition"
                          aria-label="Supprimer la photo"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Méta-données compression (taille avant / après) */}
                      {photoMeta && !photoMeta.isProcessing && (
                        <div
                          className="flex items-center gap-2 text-xs p-2 rounded-lg"
                          style={{ backgroundColor: '#F0FDF4', color: QRTAGS_GREEN, border: '1px solid #BBF7D0' }}
                        >
                          <ImageIcon className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Image compressée :{' '}
                            <strong>{photoMeta.originalSizeKB} KB</strong> →{' '}
                            <strong>{photoMeta.compressedSizeKB} KB</strong>
                            {photoMeta.originalSizeKB > 0 && (
                              <span className="ml-1">
                                (−{Math.round(
                                  ((photoMeta.originalSizeKB - photoMeta.compressedSizeKB) /
                                    Math.max(photoMeta.originalSizeKB, 1)) *
                                    100
                                )}%)
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Bouton remplacer */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-4 border-2 border-black rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Remplacer la photo
                      </button>
                    </div>
                  ) : photoMeta?.isProcessing ? (
                    <div className="border-2 border-dashed border-black rounded-lg p-6 text-center bg-gray-50">
                      <Loader2 className="w-6 h-6 mx-auto mb-2 text-black animate-spin" />
                      <p className="text-black font-semibold">Compression en cours...</p>
                      <p className="text-xs text-gray-600 mt-1">Optimisation de l'image</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <Camera className="w-6 h-6 mx-auto mb-2 text-black" />
                      <p className="text-black font-semibold">Ajouter une photo</p>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG (max 5MB) — compression automatique</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ SECTION 5 : CONFIRMATION — toujours visible ═══ */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-4">✅ CONFIRMATION</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-black border-2 border-black rounded"
                  />
                  <span className="text-black text-sm">J'accepte les conditions d'utilisation</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-black border-2 border-black rounded"
                  />
                  <span className="text-black text-sm">
                    Je comprends que mes informations seront visibles uniquement par la personne qui trouve mon objet
                  </span>
                </label>
              </div>
            </div>

            {/* Boutons d'action — enrichis (Étape 4) */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 px-6 py-4 border-2 border-black rounded-lg bg-white text-black font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" /> Précédent
              </button>

              <button
                type="button"
                onClick={doSubmit}
                disabled={loading || !canSubmitStep2}
                className="flex-[2] px-8 py-4 rounded-lg bg-black text-[#E3B23C] font-bold text-base hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {submitPhase === 'redirecting' ? 'Redirection...' : 'Activation...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Activer mon QR code
                  </>
                )}
              </button>
            </div>

            {/* ─── NOUVEAU (Étape 4) : message d'erreur de soumission inline ─── */}
            {submitError && (
              <div
                className="rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
                style={{
                  backgroundColor: '#FEE2E2',
                  color: QRTAGS_RED,
                  border: `2px solid ${QRTAGS_RED}`,
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Erreur</p>
                  <p className="text-sm mt-0.5">{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="flex-shrink-0 text-sm font-bold hover:opacity-70 transition"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── NOUVEAU (Étape 4) : overlay loader plein écran pendant la soumission ─── */}
        {loading && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(17, 17, 17, 0.75)' }}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-sm w-[calc(100%-2rem)] text-center shadow-2xl border-2 border-black"
            >
              <div className="mb-4">
                {submitPhase === 'redirecting' ? (
                  <CheckCircle2
                    className="w-16 h-16 mx-auto animate-in zoom-in duration-300"
                    style={{ color: QRTAGS_GREEN }}
                  />
                ) : (
                  <Loader2 className="w-16 h-16 mx-auto animate-spin text-black" />
                )}
              </div>
              <h3 className="text-xl font-black text-black mb-1">
                {submitPhase === 'redirecting'
                  ? 'QR code activé !'
                  : 'Activation en cours...'}
              </h3>
              <p className="text-sm text-black/60">
                {submitPhase === 'redirecting'
                  ? 'Redirection vers votre confirmation...'
                  : 'Nous protégeons votre objet. Patientez quelques instants.'}
              </p>

              {/* Petit indicateur de progression visuelle */}
              {submitPhase === 'sending' && (
                <div className="mt-4 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '60%',
                      backgroundColor: '#E3B23C',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              )}

              {/* Sécurité : rappel que la donnée est chiffrée */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-black/50">
                <ShieldCheck className="w-3 h-3" />
                <span>Connexion sécurisée</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── NOUVEAU (Étape 4) : bannière réseau offline (si hors ligne) ─── */}
        {typeof navigator !== 'undefined' && !navigator.onLine && step === 2 && (
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] rounded-xl p-3 shadow-2xl border-2 flex items-center gap-3"
            style={{ backgroundColor: '#FEE2E2', borderColor: QRTAGS_RED }}
          >
            <WifiOff className="w-5 h-5 flex-shrink-0" style={{ color: QRTAGS_RED }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: QRTAGS_RED }}>Hors ligne</p>
              <p className="text-xs" style={{ color: QRTAGS_RED }}>
                Vous êtes actuellement hors ligne. Vos saisies sont sauvegardées localement.
              </p>
            </div>
          </div>
        )}

        {/* ─── NOUVEAU (Étape 3) : bannière « brouillon restauré » ─── */}
        {draftRestored && (
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] rounded-xl p-3 shadow-2xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#111111' }}
          >
            <RefreshCw className="w-5 h-5 flex-shrink-0" style={{ color: '#E3B23C' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black">Brouillon restauré</p>
              <p className="text-xs text-black/60">Vos saisies précédentes ont été récupérées.</p>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-black text-[#E3B23C] hover:bg-gray-900 transition"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        )}

        {/* Footer — CONSERVÉ */}
        <div className="text-center mt-8">
          <p className="text-black/70 text-sm">
            Propulsé par <span className="font-bold">QRTags</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#E3B23C' }} />}>
      <InscrireContent />
    </Suspense>
  );
}
