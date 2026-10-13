'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

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

interface OwnerChatProps {
  token: string;
}

/**
 * Chat anonyme — côté PROPRIÉTAIRE (page /track/[token]).
 * Répond au trouveur sans exposer de numéro. Polling léger :
 * 10 s au repos, accéléré à 5 s dès qu'un message non lu arrive.
 */
export default function OwnerChat({ token }: OwnerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const fetchThread = useCallback(async () => {
    try {
      // read=1 uniquement si l'onglet est visible : le badge « non lus »
      // persiste tant que le propriétaire n'a pas réellement regardé.
      const read = document.visibilityState === 'visible' ? '1' : '0';
      const res = await fetch(
        `/api/track/${encodeURIComponent(token)}/chat?read=${read}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        setUnread(typeof data.unread === 'number' ? data.unread : 0);
      }
    } catch {
      // silencieux — le polling retentera
    }
  }, [token]);

  useEffect(() => {
    fetchThread();
    const schedule = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(fetchThread, 8000);
    };
    schedule();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchThread]);

  // Scroll auto quand le fil grandit
  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setDraft('');
        setError(null);
        await fetchThread();
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
    <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-black/10" style={{ backgroundColor: `${QRTAGS_BG}22` }}>
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-4 h-4 shrink-0" style={{ color: QRTAGS_INK }} />
          <span className="font-bold text-sm text-black truncate">
            Discussion avec le trouveur
          </span>
        </div>
        {unread > 0 && (
          <span
            className="shrink-0 text-[11px] font-black px-2 py-1 rounded-full text-black"
            style={{ backgroundColor: QRTAGS_BG }}
            aria-label={`${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}`}
          >
            {unread} non lu{unread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Fil */}
      <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-neutral-50 chat-scroll">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1 px-6">
            <MessageCircle className="w-8 h-8 text-black/20" />
            <p className="text-xs text-black/50 font-medium">
              Aucun message du trouveur.
            </p>
            <p className="text-[11px] text-black/40">
              Quand quelqu'un scanne votre tag et vous écrit, la discussion apparaît ici.
            </p>
          </div>
        ) : (
          messages.map((m) =>
            m.sender === 'finder' ? (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border-2 border-black bg-black px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: QRTAGS_BG }}>
                    Trouveur{m.senderLabel ? ` · ${m.senderLabel}` : ' (anonyme)'}
                  </p>
                  <p className="text-sm text-white break-words">{m.body}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-2xl rounded-br-sm border-2 border-black px-3 py-2"
                  style={{ backgroundColor: QRTAGS_BG }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: QRTAGS_INK }}>
                    Vous
                  </p>
                  <p className="text-sm text-black break-words">{m.body}</p>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Composer */}
      <div className="p-3 flex items-center gap-2 border-t border-black/10">
        <label htmlFor={`owner-chat-${token}`} className="sr-only">
          Votre réponse
        </label>
        <input
          id={`owner-chat-${token}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Répondre au trouveur…"
          className="flex-1 min-h-[44px] px-3 text-sm rounded-lg border-2 border-black/15 bg-white focus:outline-none focus:border-black"
          maxLength={1000}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Envoyer la réponse"
          className="w-11 h-11 shrink-0 rounded-lg border-2 border-black flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
          style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
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
