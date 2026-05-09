/**
 * Client utilitaire Groq — AI Inference API
 *
 * Ce module contient:
 * - callGroqAI() : appel bas niveau au modèle Groq
 * - generateWhatsAppMessage() : génère un message WhatsApp multilingue via IA
 *
 * Priorité des clés API: DB (Setting table) > process.env
 */

import type { GroqRequest, GroqMessage, GroqResult } from '@/types/ai';
import {
  API_RETRY_COUNT,
  FALLBACK_MESSAGES,
  getServiceConfig,
} from './config';
import type { GroqServiceConfig } from './config';
import { fetchWithRetry } from './fetch-util';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** Timeout max pour la génération de message WhatsApp (3s) */
const WHATSAPP_MSG_TIMEOUT_MS = 3000;

// ═══════════════════════════════════════════════════════
//  FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════

/**
 * Appelle le modèle Groq pour de l'inférence IA.
 * Lit la configuration depuis la DB (priorité) puis les env vars.
 *
 * @param request - La requête Groq (model, messages, temperature, max_tokens)
 * @returns GroqResult — jamais lance d'exception
 */
export async function callGroqAI(request: GroqRequest): Promise<GroqResult> {
  const startTime = Date.now();

  // ─── Charger la config (DB + env) ───
  let config: GroqServiceConfig;
  try {
    config = await getServiceConfig('groq');
  } catch (error) {
    console.warn('[Groq] Erreur lecture config → fallback:', error);
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Guard: API key non configurée → fallback ───
  if (!config.apiKey) {
    console.warn('[Groq] Clé API non configurée (DB + env) → fallback.');
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Validation ───
  if (!request.messages || request.messages.length === 0) {
    console.warn('[Groq] Messages vides.');
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.invalidRequest,
      fallback: false,
      latencyMs: Date.now() - startTime,
    };
  }

  const model = request.model || config.modelChat;

  // ─── Appel API ───
  console.log(
    `[Groq] Appel modèle "${model}" — ${request.messages.length} message(s), temp=${request.temperature ?? 0.3}`
  );

  const body: Record<string, unknown> = {
    model,
    messages: request.messages,
    temperature: request.temperature ?? 0.3,
    max_tokens: request.max_tokens ?? 1024,
  };

  const result = await fetchWithRetry(
    config.baseUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    config.timeoutMs,
    API_RETRY_COUNT,
    'Groq'
  );

  const latencyMs = Date.now() - startTime;

  if (result.ok) {
    const data = result.data as Record<string, unknown>;
    const choices = data?.choices as Array<Record<string, unknown>> | undefined;
    const usage = data?.usage as Record<string, number> | undefined;
    const message = choices?.[0]?.message as Record<string, unknown> | undefined;
    const content = message?.content as string | undefined;

    if (content) {
      console.log(`[Groq] ✓ Réponse obtenue en ${latencyMs}ms — ${content.length} caractères`);
      return {
        success: true,
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens ?? 0,
              completionTokens: usage.completion_tokens ?? 0,
              totalTokens: usage.total_tokens ?? 0,
            }
          : undefined,
        latencyMs,
        fallback: false,
      };
    }

    // Réponse OK mais pas de contenu
    console.warn('[Groq] Réponse OK mais contenu vide.');
    return {
      success: false,
      error: 'Réponse vide du modèle.',
      fallback: true,
      latencyMs,
    };
  }

  // ─── Échec → fallback (ne bloque jamais le flux) ───
  console.warn(`[Groq] ✗ Échec après ${API_RETRY_COUNT + 1} tentatives (${latencyMs}ms) → fallback.`);
  return {
    success: false,
    error: FALLBACK_MESSAGES.groq.genericError,
    fallback: true,
    latencyMs,
  };
}

// ═══════════════════════════════════════════════════════
//  WHATSAPP MESSAGE GENERATOR
// ═══════════════════════════════════════════════════════

/** Paramètres pour la génération du message WhatsApp */
export interface WhatsAppMessageParams {
  /** Référence du bagage (ex: "VOL26-ZG46J2") */
  reference: string;
  /** Localisation du scan */
  location: { city: string; country: string };
  /** Heure du scan (ex: "18h45") */
  time: string;
  /** URL de suivi */
  link: string;
  /** Langue du message */
  language: 'fr' | 'en' | 'ar';
}

/** Résultat de la génération */
export interface WhatsAppMessageResult {
  /** Message généré (ou fallback) */
  message: string;
  /** true si le message vient de Groq, false si fallback */
  generated: boolean;
  /** Temps de réponse en ms */
  latencyMs: number;
}

/** Messages fallback statiques par langue */
const FALLBACK_WHATSAPP_MESSAGES: Record<string, (p: WhatsAppMessageParams) => string> = {
  fr: (p) =>
    `🚨 Alerte QRBag\nVotre bagage ${p.reference} a été scanné à ${p.location.city}, ${p.location.country} à ${p.time}.\nSuivez son statut : ${p.link}`,
  en: (p) =>
    `🚨 QRBag Alert\nYour bag ${p.reference} was scanned in ${p.location.city}, ${p.location.country} at ${p.time}.\nTrack it: ${p.link}`,
  ar: (p) =>
    `🚨 تنبيه QRBag\nتم مسح أمتعتك ${p.reference} في ${p.location.city}، ${p.location.country} الساعة ${p.time}.\nتابع حالتها: ${p.link}`,
};

/** Prompts système par langue */
const SYSTEM_PROMPTS: Record<string, string> = {
  fr: `Tu es un assistant QRBag. Génère UN SEUL message WhatsApp d'alerte de scan de bagage.
RÈGLES STRICTES:
- Maximum 280 caractères
- Ton urgent mais rassurant
- Utilise des emojis pertinents
- Formate comme un message WhatsApp (sauts de ligne avec \\n)
- Commence par "🚨 Alerte QRBag"
- Inclus: référence, lieu, heure, lien de suivi
- RETOURNE UNIQUEMENT LE MESSAGE, aucun commentaire ni explication`,

  en: `You are a QRBag assistant. Generate a SINGLE WhatsApp baggage scan alert message.
STRICT RULES:
- Maximum 280 characters
- Urgent but reassuring tone
- Use relevant emojis
- Format as a WhatsApp message (newlines with \\n)
- Start with "🚨 QRBag Alert"
- Include: reference, location, time, tracking link
- RETURN ONLY THE MESSAGE, no comments or explanation`,

  ar: `أنت مساعد QRBag. قم بتوليد رسالة تنبيه مسح أمتعة واحدة عبر واتساب.
قواعد صارمة:
- بحد أقصى 280 حرفًا
- نبرة عاجلة ولكن مطمئنة
- استخدم رموز تعبيرية مناسبة
- صيغة كرسالة واتساب (أسطر جديدة مع \\n)
- ابدأ بـ "🚨 تنبيه QRBag"
- ضمّن: المرجع، الموقع، الوقت، رابط التتبع
- أعد الرسالة فقط، بدون تعليقات أو شرح`,
};

/**
 * Génère un message WhatsApp d'alerte de scan via Groq AI.
 * Si Groq échoue ou dépasse le timeout de 3s, retourne un message statique par défaut.
 *
 * @param params - Données du scan (référence, localisation, heure, lien, langue)
 * @returns WhatsAppMessageResult — contient le message + métadonnées
 *
 * @example
 * ```ts
 * const result = await generateWhatsAppMessage({
 *   reference: 'VOL26-ZG46J2',
 *   location: { city: 'Dakar', country: 'Sénégal' },
 *   time: '18h45',
 *   link: 'https://qrbags.com/suivi/VOL26-ZG46J2',
 *   language: 'fr',
 * });
 * console.log(result.message); // "🚨 Alerte QRBag..."
 * console.log(result.generated); // true si IA, false si fallback
 * ```
 */
export async function generateWhatsAppMessage(
  params: WhatsAppMessageParams
): Promise<WhatsAppMessageResult> {
  const startTime = Date.now();

  // ─── Guard rapide : fallback immédiat si params invalides ───
  if (!params.reference || !params.location?.city || !params.link) {
    const fb = FALLBACK_WHATSAPP_MESSAGES[params.language] ?? FALLBACK_WHATSAPP_MESSAGES.fr;
    return {
      message: fb(params),
      generated: false,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Appel Groq avec timeout 3s ───
  try {
    const result = await Promise.race([
      callGroqAI({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[params.language] },
          {
            role: 'user',
            content: [
              `Référence: ${params.reference}`,
              `Ville: ${params.location.city}`,
              `Pays: ${params.location.country}`,
              `Heure: ${params.time}`,
              `Lien: ${params.link}`,
            ].join('\n'),
          },
        ],
        temperature: 0.4,
        max_tokens: 100,
      }),
      // Timeout 3s — ne bloque jamais le flux de scan
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), WHATSAPP_MSG_TIMEOUT_MS)
      ),
    ]);

    const latencyMs = Date.now() - startTime;

    if (result.success && result.content) {
      // Nettoyer : supprimer les guillemets et les backticks éventuels
      const cleaned = result.content
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      // Valider la longueur
      if (cleaned.length > 0 && cleaned.length <= 350) {
        console.log(`[Groq/WhatsApp] ✓ Message généré en ${latencyMs}ms (${cleaned.length} chars, lang=${params.language})`);
        return { message: cleaned, generated: true, latencyMs };
      }

      // Trop long → fallback silencieux
      console.warn(`[Groq/WhatsApp] Message trop long (${cleaned.length} chars) → fallback`);
    }

    // Échec Groq → fallback statique
    return {
      message: FALLBACK_WHATSAPP_MESSAGES[params.language]?.(params) ?? FALLBACK_WHATSAPP_MESSAGES.fr(params),
      generated: false,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Logging discret — pas de stack trace
    if (error instanceof Error && error.message === 'TIMEOUT') {
      console.warn(`[Groq/WhatsApp] Timeout ${WHATSAPP_MSG_TIMEOUT_MS}ms → fallback`);
    } else {
      console.warn(`[Groq/WhatsApp] Erreur → fallback`);
    }

    return {
      message: FALLBACK_WHATSAPP_MESSAGES[params.language]?.(params) ?? FALLBACK_WHATSAPP_MESSAGES.fr(params),
      generated: false,
      latencyMs,
    };
  }
}
