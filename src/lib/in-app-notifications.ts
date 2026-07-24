/**
 * Helpers centralisés pour les notifications in-app (modèle Prisma `Notification`).
 *
 * Le modèle `Notification` est volontairement simple : pas de relation FK vers User/Agency,
 * `userId = null` signifie "broadcast à tous les superadmins". C'est suffisant pour le
 * NotificationBell admin (qui fetch `where: { read: false }`).
 *
 * Pour étendre aux agences, créer un endpoint `/api/agency/notifications` qui filtre
 * par `agencyId` et adapter NotificationBell pour qu'il prenne un `endpoint` en prop.
 */

import { db } from '@/lib/db';

export type NotificationType =
  | 'baggage_declared_lost'
  | 'baggage_found'
  | 'new_assistance_message'
  | 'urgent_scan'
  | 'new_message'
  | 'agency_message'
  | 'new_lead'
  | 'new_agency'
  // Nouveaux types (système de notifications étendu) :
  | 'new_blog_post'
  | 'admin_login'
  | 'new_registration'
  | 'new_user'
  | 'suspicious_login';

export interface CreateNotificationInput {
  type: NotificationType;
  message: string;
  userId?: string | null; // null = broadcast superadmins
  agencyId?: string | null;
  baggageId?: string | null;
  data?: Record<string, unknown> | null;
}

/**
 * Crée une notification in-app. Fire-and-forget friendly (n'échoue pas silencieusement le caller).
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        type: input.type,
        message: input.message,
        userId: input.userId ?? null,
        agencyId: input.agencyId ?? null,
        baggageId: input.baggageId ?? null,
        data: input.data ? JSON.stringify(input.data) : null,
        read: false,
      },
    });
  } catch (err) {
    // Ne pas planter le flux principal si la notif échoue (dégradé)
    console.error('[notifications] createNotification failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Notification broadcast à tous les superadmins (userId = null).
 */
export async function notifySuperAdmins(
  type: NotificationType,
  message: string,
  extra?: Omit<CreateNotificationInput, 'type' | 'message' | 'userId'>
): Promise<void> {
  return createNotification({ ...extra, type, message, userId: null });
}

// ─── Helpers spécialisés par événement ─────────────────────────────────

export async function notifyNewBlogPost(post: { id: string; title: string; slug: string; category?: string }): Promise<void> {
  return notifySuperAdmins('new_blog_post', `Nouvel article publié : ${post.title}`, {
    baggageId: null,
    data: { postId: post.id, slug: post.slug, category: post.category ?? null },
  });
}

export async function notifyAdminLogin(user: { id: string; email: string; name?: string | null; role: string }): Promise<void> {
  return notifySuperAdmins('admin_login', `Connexion admin : ${user.name || user.email} (${user.role})`, {
    data: { userId: user.id, role: user.role, at: new Date().toISOString() },
  });
}

export async function notifyNewRegistration(opts: { email: string; name?: string | null; reference?: string }): Promise<void> {
  return notifySuperAdmins('new_registration', `Nouvelle inscription voyageur : ${opts.name || opts.email}`, {
    data: { email: opts.email, reference: opts.reference ?? null },
  });
}

export async function notifyNewUser(user: { id: string; email: string; name?: string | null; role: string; agencyId?: string | null }): Promise<void> {
  return notifySuperAdmins('new_user', `Nouvel utilisateur créé : ${user.name || user.email} (${user.role})`, {
    agencyId: user.agencyId ?? null,
    data: { userId: user.id, role: user.role },
  });
}

export async function notifySuspiciousLogin(opts: { email: string; attempts: number; ip?: string }): Promise<void> {
  return notifySuperAdmins('suspicious_login', `Tentatives de connexion suspectes (${opts.attempts}x) sur ${opts.email}`, {
    data: { email: opts.email, attempts: opts.attempts, ip: opts.ip ?? null },
  });
}
