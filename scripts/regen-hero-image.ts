/**
 * Regénère le hero image de la page d'accueil QRTags
 * Scène réelle : objets retrouvés / citoyen qui ramène un objet étiqueté QRTags
 *
 * Utilisation :
 *   bun /home/z/my-project/scripts/regen-hero-image.ts
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/qrtagsori/public/images/home';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hero-found-objects.png');
const BACKUP_FILE = path.join(OUTPUT_DIR, 'hero-black-woman.png.bak');

// Format paysage 1344x768 (identique à l'original)
const SIZE = '1344x768' as const;

// Prompt : scène réelle d'objets trouvés / retrouvés — cohérente avec la mission QRTags
// On veut : réaliste, émotion positive, objets identifiables (valise / sac / clés),
// tag QR visible, contexte urbain neutre, lumière chaleureuse.
const PROMPT = [
  'Realistic photograph of a heartwarming scene of found objects being returned',
  'a smiling African young woman in casual travel clothes receiving her lost suitcase from a friendly stranger',
  'the suitcase has a small bright yellow QR code sticker tag visible on its handle',
  'modern train station concourse softly blurred in the background, warm golden hour light',
  'shallow depth of field, candid authentic moment, eye contact',
  'natural skin tones, realistic textures, no text overlays, no logos',
  'photorealistic, 50mm lens, professional editorial photography',
  'warm inviting color palette with soft gold and cream tones',
  'high quality, detailed, sharp focus on the handover moment',
].join(', ');

async function main() {
  console.log('▶ Initialisation du SDK z-ai...');
  const zai = await ZAI.create();

  // Backup de l'ancien hero
  if (fs.existsSync(path.join(OUTPUT_DIR, 'hero-black-woman.png')) && !fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(path.join(OUTPUT_DIR, 'hero-black-woman.png'), BACKUP_FILE);
    console.log(`✓ Backup créé : ${BACKUP_FILE}`);
  }

  console.log(`▶ Génération de l'image (${SIZE})...`);
  console.log(`  Prompt: ${PROMPT.slice(0, 120)}...`);

  const response = await zai.images.generations.create({
    prompt: PROMPT,
    size: SIZE,
  });

  if (!response?.data?.[0]?.base64) {
    throw new Error('Réponse vide de l\'API de génération d\'images');
  }

  const base64 = response.data[0].base64;
  const buffer = Buffer.from(base64, 'base64');

  // Vérif rapide que c'est une image valide
  if (buffer.length < 10000) {
    throw new Error(`Buffer suspectement petit (${buffer.length} bytes) — génération probablement échouée`);
  }

  fs.writeFileSync(OUTPUT_FILE, buffer);
  console.log(`✓ Image sauvegardée : ${OUTPUT_FILE}`);
  console.log(`  Taille : ${(buffer.length / 1024).toFixed(1)} KB`);

  // Vérif dimension via PIL si dispo
  try {
    const { execSync } = require('child_process');
    const out = execSync(
      `python3 -c "from PIL import Image; im=Image.open('${OUTPUT_FILE}'); print(im.size, im.mode)"`,
    ).toString().trim();
    console.log(`  Dimensions vérifiées : ${out}`);
  } catch (_) {
    // ignore — PIL peut ne pas être dispo
  }

  console.log('\n✓ Terminé. Nouveau hero prêt à être utilisé :');
  console.log(`  /images/home/hero-found-objects.png`);
}

main().catch((err) => {
  console.error('✗ Échec :', err?.message || err);
  process.exit(1);
});
