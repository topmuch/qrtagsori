'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RotateCcw, Tag } from 'lucide-react';

// ─── Design tokens QRTags (or moutarde + noir) ───
const QRTAGS_BG  = '#E3B23C';
const QRTAGS_INK = '#111111';

type Lang = 'fr' | 'en' | 'ar';

interface GuideTexts {
  title: string;
  subtitle: string;
  cta: string;
  hint: string;
  replay: string;
}

const TEXTS: Record<'finder' | 'owner', Record<Lang, GuideTexts>> = {
  finder: {
    fr: {
      title: 'Objet trouvé !',
      subtitle:
        "Appuyez sur le bouton ci-dessous : les instructions audio vous guident pour contacter le propriétaire.",
      cta: 'Appuyez pour contacter',
      hint: 'Instructions audio · 15 s',
      replay: 'Réécouter les instructions',
    },
    en: {
      title: 'Item found!',
      subtitle:
        'Tap the button below: audio instructions will guide you to contact the owner.',
      cta: 'Tap to contact',
      hint: 'Audio instructions · 15 s',
      replay: 'Replay instructions',
    },
    ar: {
      title: 'تم العثور على الشيء!',
      subtitle: 'اضغط على الزر أدناه: سترشدك التعليمات الصوتية للتواصل مع المالك.',
      cta: 'اضغط للتواصل',
      hint: 'تعليمات صوتية · 20 ث',
      replay: 'إعادة تشغيل التعليمات',
    },
  },
  owner: {
    fr: {
      title: 'Bienvenue à bord ! ✨',
      subtitle:
        'Appuyez sur le bouton : un guide audio vous explique le fonctionnement de la protection de votre objet.',
      cta: 'Écouter le guide',
      hint: 'Guide audio · 25 s',
      replay: 'Réécouter le guide',
    },
    en: {
      title: 'Welcome aboard! ✨',
      subtitle:
        'Tap the button: an audio guide explains how your item protection works.',
      cta: 'Listen to the guide',
      hint: 'Audio guide · 25 s',
      replay: 'Play the guide again',
    },
    ar: {
      title: 'أهلاً بك على متن الرحلة! ✨',
      subtitle: 'اضغط على الزر: يشرح لك الدليل الصوتي كيف تعمل حماية الشيء الخاص بك.',
      cta: 'استمع إلى الدليل',
      hint: 'دليل صوتي · 25 ثانية',
      replay: 'إعادة تشغيل الدليل',
    },
  },
};

/** Detect the browser language, restricted to fr / en / ar (default fr). */
function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'fr';
  const raw =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    'fr';
  const nav = raw.toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('en')) return 'en';
  return 'fr';
}

interface VoiceGuideOverlayProps {
  /** 'finder' = page trouveur (/audio/scan-guide-XX.mp3) · 'owner' = confirmation d'activation (/audio/confirm-guide-XX.mp3) */
  variant: 'finder' | 'owner';
  /** Référence affichée dans la pilule (optionnel) */
  reference?: string | null;
}

/**
 * Guide vocal QRTags — même pattern que QRBags, habillé or/noir :
 * overlay d'accueil plein écran (le premier tap débloque l'autoplay),
 * puis bouton flottant « réécouter » avec anneau pendant la lecture.
 */
export default function VoiceGuideOverlay({ variant, reference }: VoiceGuideOverlayProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lang, setLang] = useState<Lang>('fr');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Langue du navigateur (résolue côté client uniquement — pas de mismatch SSR)
  useEffect(() => {
    setLang(detectLang());
  }, []);

  // Stoppe le son si la page est quittée
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playGuideAudio = useCallback(() => {
    const src = `/audio/${variant === 'finder' ? 'scan-guide' : 'confirm-guide'}-${lang}.mp3`;
    if (audioRef.current) {
      // Réécouter : rembobine et rejoue
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = src;
      audioRef.current.play().catch(() => {});
      return;
    }
    const audio = new Audio(src);
    audio.addEventListener('play', () => setIsAudioPlaying(true));
    audio.addEventListener('pause', () => setIsAudioPlaying(false));
    audio.addEventListener('ended', () => setIsAudioPlaying(false));
    audio.addEventListener('error', () => setIsAudioPlaying(false));
    audioRef.current = audio;
    audio.play().catch(() => {});
  }, [variant, lang]);

  const handleWelcomeStart = () => {
    setShowWelcome(false);
    playGuideAudio();
  };

  const t = TEXTS[variant][lang];
  const isRtl = lang === 'ar';

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="voice-guide-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
          >
            <motion.div
              initial={{ scale: 0.9, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="bg-white rounded-2xl border-2 border-black shadow-2xl max-w-sm w-full overflow-hidden"
            >
              {/* Bandeau or signature */}
              <div
                className="flex items-center justify-center gap-2 py-3 border-b-2 border-black"
                style={{ backgroundColor: QRTAGS_BG }}
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                >
                  <Volume2 className="w-5 h-5" style={{ color: QRTAGS_INK }} />
                </motion.span>
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: QRTAGS_INK }}
                >
                  QRTags
                </span>
              </div>

              <div className="p-6 text-center">
                {reference && (
                  <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-black">
                    <Tag className="w-3 h-3" style={{ color: QRTAGS_BG }} />
                    <span
                      className="font-mono text-xs font-bold tracking-wider"
                      style={{ color: QRTAGS_BG }}
                    >
                      {reference}
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-black text-black mb-2">{t.title}</h2>
                <p className="text-sm text-black/70 mb-5 leading-relaxed">{t.subtitle}</p>

                <button
                  type="button"
                  onClick={handleWelcomeStart}
                  className="w-full min-h-[52px] px-6 rounded-xl font-black text-base text-black border-2 border-black shadow-[3px_3px_0_0_#111] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#111] active:translate-y-1 active:shadow-[1px_1px_0_0_#111] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: QRTAGS_BG }}
                >
                  <Volume2 className="w-5 h-5" />
                  {t.cta}
                </button>

                <p className="text-[11px] text-black/50 mt-3">{t.hint}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant réécouter (après fermeture de l'overlay) */}
      {!showWelcome && (
        <button
          type="button"
          onClick={playGuideAudio}
          aria-label={t.replay}
          title={t.replay}
          className={`fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-black shadow-xl border-2 border-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
            isAudioPlaying ? 'ring-2 ring-offset-2 animate-pulse' : ''
          }`}
          style={
            {
              color: QRTAGS_BG,
              '--tw-ring-color': QRTAGS_BG,
              ...(isAudioPlaying ? { '--tw-ring-offset-color': '#000000' } : {}),
            } as React.CSSProperties
          }
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
