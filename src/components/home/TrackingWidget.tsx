'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Regex de validation stricte — alignée sur isValidReferenceFormat() de src/lib/qr.ts
 * Accepte : QRT26-VABJZS (QRTags), VOL26-VABJZS (legacy), HAJJ25-ZG46J2 (legacy)
 * Refuse : vol26-vabjzs (mais auto-uppercase le corrige), RANDOM, VOL26-ABC, etc.
 */
const REFERENCE_REGEX = /^(QRT|HAJJ|VOL)\d{2}-[A-Z0-9]{6}$/;

// ─── Color tokens harmonisés avec la homepage ───
const COLORS = {
  bg: '#FFF8E7',
  accent: '#FDB900',
  accentDark: '#c89a00',
  green: '#22C55E',
  greenDark: '#16A34A',
  text: '#0d0d0f',
  textMuted: '#525252',
  card: '#ffffff',
  border: '#e5e5e5',
  borderAccent: 'rgba(253, 185, 0, 0.3)',
};

export default function TrackingWidget() {
  const router = useRouter();
  const { t, dir } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  const inputId = 'tracking-reference-input';
  const errorId = 'tracking-reference-error';

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();

    if (trimmed === '') {
      setError(t('home.tracking_empty'));
      return;
    }

    if (!REFERENCE_REGEX.test(trimmed)) {
      setError(t('home.tracking_error'));
      return;
    }

    router.push(`/suivi/${trimmed}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value.toUpperCase());
    if (error) setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section
      dir={dir}
      className="w-full py-10 sm:py-14"
      style={{ background: COLORS.bg }}
    >
      <div className="max-w-xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 sm:p-8 shadow-xl"
          style={{
            background: COLORS.card,
            border: `2px solid ${COLORS.borderAccent}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: COLORS.green, color: 'white' }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <label
              htmlFor={inputId}
              className="font-bold text-lg sm:text-xl"
              style={{ color: COLORS.text }}
            >
              {t('home.tracking_label')}
            </label>
          </div>
          <p className="text-sm mb-5" style={{ color: COLORS.textMuted }}>
            Entrez votre référence QRTags (ex : QRT26-XXXXXX) pour localiser votre objet.
          </p>

          {/* Input + Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div
              animate={{
                boxShadow: isFocused
                  ? `0 0 0 3px ${COLORS.green}33`
                  : '0 0 0 0px transparent',
              }}
              className="flex-1 w-full sm:w-auto rounded-xl"
            >
              <input
                id={inputId}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t('home.tracking_placeholder')}
                aria-label={t('home.tracking_label')}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error !== ''}
                autoComplete="off"
                spellCheck={false}
                maxLength={15}
                className={`
                  w-full px-5 py-4 rounded-xl text-base font-mono tracking-wider
                  transition-all duration-200 outline-none
                  ${error
                    ? `border-2 border-red-400 bg-red-50/30 text-red-700 placeholder:text-red-300`
                    : `border-2 bg-white text-gray-900 placeholder:text-gray-400`
                  }
                  ${!error ? (isFocused ? `border-[${COLORS.green}]` : `border-[${COLORS.border}]`) : ''}
                `}
                style={{
                  borderColor: error ? '#f87171' : (isFocused ? COLORS.green : COLORS.border),
                }}
              />
            </motion.div>

            <motion.button
              type="button"
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                flex items-center justify-center gap-2 px-7 py-4 rounded-xl
                font-bold text-base min-h-[52px]
                shadow-lg transition-all duration-200
              "
              style={{
                background: COLORS.green,
                color: 'white',
              }}
            >
              <Search className="w-4 h-4" />
              <span>{t('home.tracking_button')}</span>
            </motion.button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error !== '' && (
              <motion.p
                id={errorId}
                role="alert"
                aria-live="polite"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-sm mt-3 flex items-center gap-1.5 font-medium"
              >
                <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Helper hint */}
          <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
            <Sparkles className="w-3 h-3" style={{ color: COLORS.accent }} />
            <span>
              Format : QRT26-XXXXXX · HAJJ25-XXXXXX · VOL26-XXXXXX
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
