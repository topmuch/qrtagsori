'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, ShieldCheck, X } from 'lucide-react';

// ─── Design tokens QRTags (or moutarde + noir) ───
const QRTAGS_BG = '#E3B23C';
const QRTAGS_INK = '#111111';

interface ChatMessage {
  id: string;
  sender: 'finder' | 'owner';
  senderLabel: string | null;
  body: string;
  createdAt: string;
}

interface FinderChatProps {
  reference: string;
  /** Nom saisi dans le formulaire du trouveur (utilisé comme pseudo, jamais de téléphone) */
  defaultName?: string;
}

/**
 * Chat anonyme trouveur ↔ propriétaire.
 * Le trouveur discute via la référence scannée — son numéro n'est JAMAIS
 * transmis (pas de champ téléphone ici). Le pseudo est optionnel et éditable.
 */
export default function FinderChat({ reference, defaultName }: FinderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [label, setLabel] = useState(defaultName || '');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(reference)}/chat`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError(null);
      }
    } catch {
      // silencieux — le polling retentera
    } finally {
      setLoading(false);
    }
  }, [reference]);

  // Chargement initial + polling 5 s
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(scrollToBottom, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(reference)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, senderLabel: label.trim() || undefined }),
      });
      if (res.ok) {
        setDraft('');
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Envoi impossible, réessayez.');
      }
    } catch {
      setError('Envoi impossible, vérifiez votre connexion.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="rounded-2xl border-2 border-black overflow-hidden bg-white shadow-[3px_3px_0_0_#111]"
      role="region"
      aria-label="Discussion anonyme avec le propriétaire"
    >
      {/* Bandeau or */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-black"
        style={{ backgroundColor: QRTAGS_BG }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-5 h-5 shrink-0" style={{ color: QRTAGS_INK }} />
          <span className="font-black text-sm uppercase tracking-wide" style={{ color: QRTAGS_INK }}>
            Discussion anonyme
          </span>
        </div>
        <span
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/70 whitespace-nowrap"
          style={{ color: QRTAGS_INK }}
          title="Votre numéro n'est jamais transmis"
        >
          <ShieldCheck className="w-3 h-3" />
          Coordonnées masquées
        </span>
      </div>

      {/* Fil de discussion */}
      <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-neutral-50 chat-scroll">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-black/40">
            Chargement de la discussion…
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1 px-6">
            <MessageCircle className="w-8 h-8 text-black/20" />
            <p className="text-xs text-black/50 font-medium">
              Aucun message pour le moment.
            </p>
            <p className="text-[11px] text-black/40">
              Écrivez au propriétaire sans donner votre numéro : il vous répondra ici.
            </p>
          </div>
        ) : (
          messages.map((m) =>
            m.sender === 'finder' ? (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-2xl rounded-br-sm border-2 border-black px-3 py-2"
                  style={{ backgroundColor: QRTAGS_BG }}
                >
                  <p className="text-xs font-bold mb-0.5" style={{ color: QRTAGS_INK }}>
                    {m.senderLabel || 'Vous'}
                  </p>
                  <p className="text-sm text-black break-words">{m.body}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border-2 border-black bg-black px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: QRTAGS_BG }}>
                    Propriétaire
                  </p>
                  <p className="text-sm text-white break-words">{m.body}</p>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Pseudo optionnel */}
      <div className="px-3 pt-2">
        <label htmlFor={`chat-label-${reference}`} className="sr-only">
          Votre prénom (optionnel)
        </label>
        <input
          id={`chat-label-${reference}`}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value.slice(0, 40))}
          placeholder="Votre prénom (optionnel)"
          className="w-full min-h-[40px] px-3 text-sm rounded-lg border border-black/20 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
          maxLength={40}
        />
      </div>

      {/* Composer */}
      <div className="p-3 flex items-center gap-2">
        <label htmlFor={`chat-input-${reference}`} className="sr-only">
          Votre message
        </label>
        <input
          id={`chat-input-${reference}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez votre message…"
          className="flex-1 min-h-[44px] px-3 text-sm rounded-lg border-2 border-black/15 bg-white focus:outline-none focus:border-black"
          maxLength={1000}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Envoyer le message"
          className="w-11 h-11 shrink-0 rounded-lg border-2 border-black flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
          style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="px-3 pb-2 text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
