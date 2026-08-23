/**
 * Génère 4 images cohérentes pour la section « Comment ça marche » de la home page QRTags.
 * Style : illustration vectorielle 2D moderne, palette jaune (#FDB900) / noir (#0d0d0f) / crème,
 * cohérente avec l'identité visuelle QRTags.
 * Format : 1152x864 (ratio 4:3 exact pour s'intégrer dans `aspect-[4/3]`).
 *
 * Les 4 étapes couvrent à la fois le parcours Trouveur et Propriétaire :
 *  1. Achat/Génération de l'étiquette QR
 *  2. Activation du QR code sur l'objet
 *  3. Scan par un trouveur + alerte WhatsApp
 *  4. Récupération de l'objet perdu
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/qrtagsori/public/images/how-it-works';

const STYLE =
  'modern flat vector illustration, clean geometric shapes, soft shadows, ' +
  'premium editorial style, 2D isometric perspective, color palette of warm cream background (#FAF6EE), ' +
  'deep black (#0d0d0f) and vibrant golden yellow (#FDB900) accents, no text, no words, no letters, ' +
  'minimalist, high quality, professional, cohesive visual identity';

const PROMPTS: Array<{ name: string; prompt: string }> = [
  {
    name: 'step-1-generation.png',
    prompt:
      'A close-up of a hand holding a brand new QR code tag sticker still on its peel-off backing, ' +
      'the QR pattern is golden yellow on a black round sticker, the sticker is attached to a luggage tag, ' +
      'a smartphone is nearby ready to scan, warm cream background, ' + STYLE,
  },
  {
    name: 'step-2-activation.png',
    prompt:
      'A person attaching a golden yellow QR code sticker onto a brown leather suitcase, ' +
      'the phone in their other hand shows a checkmark confirmation on screen, ' +
      'cozy home interior softly blurred, warm cream and yellow tones, ' + STYLE,
  },
  {
    name: 'step-3-scan-alert.png',
    prompt:
      'A finder scanning a golden yellow QR code on a lost black backpack with their smartphone, ' +
      'a WhatsApp-style chat bubble notification pops up above the phone in yellow and green, ' +
      'location pin icon floating nearby, warm cream background, ' + STYLE,
  },
  {
    name: 'step-4-recovered.png',
    prompt:
      'A joyful reunion scene: a smiling traveler receives their lost brown leather suitcase back from a helpful finder, ' +
      'both shaking hands, the golden yellow QR code visible on the suitcase, ' +
      'small heart icons floating above, warm cream and yellow palette, ' + STYLE,
  },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();

  for (const { name, prompt } of PROMPTS) {
    const outPath = path.join(OUTPUT_DIR, name);
    process.stdout.write(`Generating ${name} ... `);
    try {
      const response = await zai.images.generations.create({
        prompt,
        size: '1152x864', // ratio 4:3 exact
      });
      const b64 = response.data[0].base64;
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(outPath, buf);
      const kb = (buf.length / 1024).toFixed(1);
      console.log(`OK (${kb} KB)`);
    } catch (err) {
      console.error(`FAILED`);
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log('\nAll 4 images generated in:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
