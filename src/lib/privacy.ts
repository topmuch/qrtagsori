/**
 * Utilitaires de confidentialité pour noms et téléphones — QRTags
 *
 * Règles RGPD : sur les pages publiques (trouveur, suivi partagé),
 * on masque partiellement le nom du propriétaire et le téléphone
 * pour qu'un trouveur puisse identifier/contact SANS exposer l'identité
 * complète du propriétaire.
 */

/**
 * Masque partiellement un nom complet.
 *
 * @example
 *   maskName("Amina Diop")        → "Amina D."
 *   maskName("Amina")             → "Amina"
 *   maskName("")                  → "Propriétaire"
 *   maskName("Jean-Pierre Dupont") → "Jean-Pierre D."
 *   maskName("Mariama Sow Ndiaye") → "Mariama S."   (n'utilise que le 1er nom de famille)
 *
 * @param fullName Nom complet (ex: "Amina Diop")
 * @returns Nom masqué (prénom + initiale du nom de famille + ".")
 *          ou "Propriétaire" si vide/null
 */
export function maskName(fullName: string | null | undefined): string {
  if (!fullName) return 'Propriétaire';

  const trimmed = fullName.trim();
  if (!trimmed) return 'Propriétaire';

  // Découpe sur les espaces (gère les noms composés avec tiret)
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    // Un seul mot → on le garde tel quel (ex: "Amina" → "Amina")
    return parts[0];
  }

  const firstName = parts[0];
  const lastName = parts[parts.length - 1]; // dernier segment comme nom de famille

  // Initiale du nom de famille + "."
  if (!lastName) return firstName;
  const initial = lastName.charAt(0).toUpperCase();
  return `${firstName} ${initial}.`;
}

/**
 * Masque partiellement un numéro de téléphone pour affichage public.
 * Conserve l'indicatif pays et les 2-3 derniers chiffres.
 *
 * @example
 *   maskPhone("+221784858226")  → "+221 ••• •• 26"
 *   maskPhone("784858226")      → "••• •• 26"
 *   maskPhone(null)             → "—"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•'.repeat(phone.length);

  // Pour les numéros avec indicatif (+221, +33, etc.), on garde l'indicatif visible
  const hasPlus = phone.trim().startsWith('+');
  const lastTwo = digits.slice(-2);
  const maskedMiddle = '•'.repeat(Math.max(4, digits.length - 4));

  if (hasPlus) {
    // Trouver l'indicatif (les 3-4 premiers chiffres après +)
    const match = phone.match(/^\+(\d{1,4})/);
    const countryCode = match ? match[1] : digits.slice(0, 3);
    return `+${countryCode} ${maskedMiddle.slice(0, 6)} •• ${lastTwo}`;
  }

  return `${maskedMiddle.slice(0, 6)} •• ${lastTwo}`;
}

/**
 * Nettoie un numéro de téléphone pour construire une URL wa.me ou tel:.
 * Supprime tous les caractères non numériques (espaces, parenthèses, tirets).
 * Conserve le + initial si présent (wa.me accepte le format international sans +).
 *
 * @example
 *   normalizePhoneForUrl("+221 78 485 82 26") → "221784858226"
 *   normalizePhoneForUrl("+221784858226")     → "221784858226"
 *   normalizePhoneForUrl("0784858226")        → "0784858226"
 */
export function normalizePhoneForUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  return digits || null;
}
