'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Heart, Sparkles, Volume2 } from 'lucide-react';

// ─── Qrioo Emotion Pack ───
// Beautiful full-screen experience with gradient purple/pink background
// Animated envelope that opens when the page loads
// Audio player with waveform visualization or text message display

const QRIOO_PURPLE = '#7C3AED';

interface PackEmotionProps {
  reference: string;
  contentType: string | null;
  contentUrl: string | null;
  contentMetadata: Record<string, unknown> | null;
  travelerName: string | null;
}

// ─── Audio Player with waveform visualization ───
function AudioPlayer({ url, duration }: { url: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = 'metadata';

    const onLoaded = () => {
      setAudioDuration(audio.duration || duration || 0);
      setIsLoading(false);
    };
    const onEnded = () => setIsPlaying(false);
    const onError = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [url, duration]);

  const tickRef = useRef<() => void>(() => {});

  // Update tick function via effect to avoid ref-during-render lint error
  useEffect(() => {
    tickRef.current = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tickRef.current);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Generate pseudo-random waveform bars
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const seed = (i * 7 + 13) % 17;
    return 0.25 + (seed / 17) * 0.75;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-white/80" />
        <span className="text-white/80 text-sm font-medium">Message vocal</span>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-end gap-[2px] h-16 mb-4 px-1">
        {waveformBars.map((height, i) => {
          const barProgress = (i / waveformBars.length) * 100;
          const isActive = barProgress <= progress;
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-100"
              style={{
                height: `${height * 100}%`,
                backgroundColor: isActive ? '#FBBF24' : 'rgba(255,255,255,0.25)',
                minHeight: '4px',
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-purple-700" />
          ) : (
            <Play className="w-5 h-5 text-purple-700 ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-white/70 text-sm font-mono min-w-[80px] text-right">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main PackEmotion Component ───
export default function PackEmotion({ contentType, contentUrl, contentMetadata, travelerName }: PackEmotionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const message = (contentMetadata?.message as string) || null;
  const audioDuration = typeof contentMetadata?.duration === 'number' ? contentMetadata.duration : undefined;
  const isAudio = contentType === 'audio' && contentUrl;
  const isText = contentType === 'text' || (!isAudio && message);
  const senderName = travelerName || 'Quelqu\'un';

  // Open envelope after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Show content after envelope opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 30%, #EC4899 70%, #F472B6 100%)',
      }}
    >
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 text-4xl opacity-20"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-40 right-16 text-3xl opacity-20"
        >
          💫
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-32 left-20 text-2xl opacity-15"
        >
          🌟
        </motion.div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* ─── Animated Envelope ─── */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center mb-8"
        >
          {/* Envelope icon */}
          <motion.div
            animate={isOpen ? { rotateX: 180, y: -20 } : { rotateX: 0, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative"
            style={{ perspective: '600px' }}
          >
            <div className="w-24 h-16 rounded-t-lg bg-white/30 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
              <Heart className={`w-8 h-8 transition-colors duration-500 ${isOpen ? 'text-pink-500' : 'text-white/60'}`} />
            </div>
            {/* Envelope flap */}
            <motion.div
              animate={isOpen ? { rotateX: -180, y: -2 } : { rotateX: 0, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute top-0 left-0 right-0 h-8 origin-top"
              style={{
                borderBottom: '16px solid rgba(255,255,255,0.25)',
                borderLeft: '48px solid transparent',
                borderRight: '48px solid transparent',
                transformStyle: 'preserve-3d',
              }}
            />
          </motion.div>

          {/* Sparkles when opened */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex gap-2 mt-3"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <Sparkles className="w-4 h-4 text-pink-300" />
                <Sparkles className="w-5 h-5 text-amber-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Sender info ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {senderName} vous a envoyé
          </h1>
          <p className="text-lg text-white/90">
            un message spécial ✨
          </p>
        </motion.div>

        {/* ─── Content ─── */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Audio content */}
              {isAudio && contentUrl && (
                <AudioPlayer url={contentUrl} duration={audioDuration} />
              )}

              {/* Text content */}
              {isText && message && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="bg-white/10 rounded-xl p-5 relative">
                    {/* Decorative quote marks */}
                    <span className="absolute top-2 left-3 text-4xl text-white/20 font-serif leading-none">&ldquo;</span>
                    <span className="absolute bottom-2 right-3 text-4xl text-white/20 font-serif leading-none">&rdquo;</span>

                    <p className="text-white text-lg leading-relaxed font-medium italic pt-4 pb-2 px-2"
                       style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {message}
                    </p>
                  </div>
                </div>
              )}

              {/* No content fallback */}
              {!isAudio && !isText && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <p className="text-white/80 text-lg">
                    Un message spécial vous attend 💌
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Branding ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-white/50 text-sm">
            Propulsé par <span className="font-bold text-white/70">Qrioo</span>
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: QRIOO_PURPLE }} />
            <span className="text-white/40 text-xs">Messages qui comptent</span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
