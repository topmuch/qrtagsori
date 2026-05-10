/**
 * VALIDATION SCRIPT — WhatsApp Harmonized Multi-Transport
 *
 * Tests exhaustifs : 4 modes × 4 contextes × 3 langues = 48 combinaisons
 *
 * Vérifie :
 *   ✅ Message généré sans crash
 *   ✅ Longueur ≤ 400 caractères
 *   ✅ Présence du formatage WhatsApp (*gras*, `monospace`)
 *   ✅ Lien de suivi qrbags.com/suivi/[REF] présent
 *   ✅ Icône du mode de transport présente
 *   ✅ Icône du contexte présente
 *   ✅ Signature QRBag présente
 *
 * Usage : bun run scripts/validate-whatsapp.ts
 */

// ─── Direct imports (bypass Next.js for script execution) ───
import { generatePreFilledMessage, buildWhatsAppUrl } from '../src/lib/whatsapp-message';

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════

const MODES = ['flight', 'train', 'boat', 'bus'] as const;
const MODES_ICONS: Record<string, string> = { flight: '✈️', train: '🚆', boat: '🚢', bus: '🚌' };

const CONTEXTS = [
  'departure_airport_urgent',
  'arrival_airport',
  'in_transit',
  'static_location',
] as const;

const LOCALES = ['fr', 'en', 'ar'] as const;

const CONTEXT_EMOJIS: Record<string, string> = {
  departure_airport_urgent: '🚨',
  arrival_airport: '✅',
  in_transit: '🚕',
  static_location: '📍',
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

interface TestResult {
  mode: string;
  context: string;
  locale: string;
  message: string;
  length: number;
  checks: string[];
  errors: string[];
}

function buildBaggage(mode: string) {
  const base = {
    reference: 'VOL26-TEST99',
    bagType: 'soute',
    transportMode: mode as 'flight' | 'train' | 'boat' | 'bus',
    destination: 'Paris',
  };

  switch (mode) {
    case 'flight':
      return { ...base, airlineName: 'Air France', flightNumber: 'AF1234' };
    case 'train':
      return { ...base, trainCompany: 'SNCF', trainNumber: 'TGV 6123' };
    case 'boat':
      return { ...base, shipName: 'MSC Fantasia', shipCabin: 'Pont 4', bagType: 'cabine' };
    case 'bus':
      return { ...base, busCompany: 'CTM', busLineNumber: 'Casablanca → Marrakech' };
    default:
      return base;
  }
}

function runTest(mode: string, context: string, locale: string): TestResult {
  const errors: string[] = [];
  const checks: string[] = [];

  const message = generatePreFilledMessage({
    baggage: buildBaggage(mode),
    scanData: { city: 'Dakar', address: 'Aéroport DKR', context },
    finder: { name: 'Ousmane Diallo', whatsapp: '+221784858226' },
    locale: locale as 'fr' | 'en' | 'ar',
    ownerName: 'Marie Dupont',
  });

  // CHECK 1: No crash
  checks.push('✅ Généré sans crash');

  // CHECK 2: Length ≤ 400
  if (message.length <= 400) {
    checks.push(`✅ Longueur OK (${message.length} ≤ 400)`);
  } else {
    errors.push(`❌ Longueur ${message.length} > 400`);
  }

  // CHECK 3: WhatsApp bold formatting (*...*)
  if (message.includes('*')) {
    checks.push('✅ Formatage *gras* présent');
  } else {
    errors.push('❌ Pas de formatage *gras*');
  }

  // CHECK 4: WhatsApp monospace formatting (`...`)
  if (message.includes('`')) {
    checks.push('✅ Formatage `monospace` présent');
  } else {
    errors.push('❌ Pas de formatage `monospace`');
  }

  // CHECK 5: Tracking link
  if (message.includes('qrbags.com/suivi/VOL26-TEST99')) {
    checks.push('✅ Lien suivi présent');
  } else {
    errors.push('❌ Lien suivi manquant');
  }

  // CHECK 6: Transport icon
  const modeIcon = MODES_ICONS[mode];
  if (message.includes(modeIcon)) {
    checks.push(`✅ Icône transport ${modeIcon} présente`);
  } else {
    errors.push(`❌ Icône transport ${modeIcon} manquante`);
  }

  // CHECK 7: Context emoji
  const ctxEmoji = CONTEXT_EMOJIS[context];
  if (message.includes(ctxEmoji)) {
    checks.push(`✅ Icône contexte ${ctxEmoji} présente`);
  } else {
    errors.push(`❌ Icône contexte ${ctxEmoji} manquante`);
  }

  // CHECK 8: QRBag signature
  if (message.includes('QRBag')) {
    checks.push('✅ Signature QRBag présente');
  } else {
    errors.push('❌ Signature QRBag manquante');
  }

  // CHECK 9: buildWhatsAppUrl works
  const url = buildWhatsAppUrl('221784858226', message);
  if (url.startsWith('https://wa.me/') && url.includes('text=')) {
    checks.push('✅ URL WhatsApp valide');
  } else {
    errors.push('❌ URL WhatsApp invalide');
  }

  // CHECK 10: Carrier info present
  if (mode === 'flight' && message.includes('Air France')) {
    checks.push('✅ Compagnie présente');
  } else if (mode === 'train' && message.includes('SNCF')) {
    checks.push('✅ Compagnie présente');
  } else if (mode === 'boat' && message.includes('MSC Fantasia')) {
    checks.push('✅ Navire présent');
  } else if (mode === 'bus' && message.includes('CTM')) {
    checks.push('✅ Compagnie présente');
  } else if (mode === 'flight') {
    errors.push('❌ Compagnie Air France manquante');
  }

  return { mode, context, locale, message, length: message.length, checks, errors };
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════');
console.log('  VALIDATION — WhatsApp Harmonized Multi-Transport');
console.log('  4 modes × 4 contextes × 3 langues = 48 tests');
console.log('═══════════════════════════════════════════════════════\n');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const failures: TestResult[] = [];

for (const mode of MODES) {
  console.log(`\n━━━ MODE: ${mode.toUpperCase()} ${MODES_ICONS[mode]} ━━━`);

  for (const context of CONTEXTS) {
    for (const locale of LOCALES) {
      totalTests++;
      const result = runTest(mode, context, locale);

      if (result.errors.length === 0) {
        totalPassed++;
        console.log(
          `  ✅ ${context.padEnd(28)} / ${locale.padEnd(3)} → ${String(result.length).padStart(3)} chars`
        );
      } else {
        totalFailed++;
        failures.push(result);
        console.log(
          `  ❌ ${context.padEnd(28)} / ${locale.padEnd(3)} → ${result.errors.join(' | ')}`
        );
      }
    }
  }
}

// ─── Sample output (1 full message) ───
console.log('\n\n━━━ EXEMPLE COMPLET (flight/departure_urgent/fr) ━━━');
const sample = runTest('flight', 'departure_airport_urgent', 'fr');
console.log(`┌─────────────────────────────────────────────────────`);
sample.message.split('\n').forEach((line) => {
  console.log(`│ ${line}`);
});
console.log(`└─────────────────────────────────────────────────────`);
console.log(`  Longueur: ${sample.length} chars`);

// ─── Summary ───
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  RÉSULTATS: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);
console.log('═══════════════════════════════════════════════════════\n');

if (failures.length > 0) {
  console.log('❌ FAILURES DETAIL:');
  failures.forEach((f) => {
    console.log(`  ${f.mode}/${f.context}/${f.locale}: ${f.errors.join(', ')}`);
  });
  process.exit(1);
} else {
  console.log('✅ ALL 48 TESTS PASSED!');
  process.exit(0);
}
