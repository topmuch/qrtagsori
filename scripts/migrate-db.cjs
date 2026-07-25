/**
 * QRTags — Script de migration SQL manuelle
 * 
 * Ajoute toutes les colonnes QRTags manquantes à la DB SQLite de production.
 * Exécuté par docker-entrypoint.sh avant le démarrage du serveur.
 * 
 * Utilise sqlite3 (installé dans l'image Docker) pour exécuter les ALTER TABLE.
 */

const { execSync } = require('child_process');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || '/app/data/qrtags.db';

if (!fs.existsSync(DB_PATH)) {
  console.log('ℹ️  DB n\'existe pas encore — prisma db push la créera');
  process.exit(0);
}

console.log('🔧 QRTags — Migration SQL manuelle...');
console.log(`   DB: ${DB_PATH}`);

// Toutes les colonnes QRTags à ajouter (si manquantes)
const migrations = [
  // Agency
  { table: 'Agency', column: 'agencyType', type: 'TEXT NOT NULL DEFAULT \'generic\'' },
  
  // Baggage
  { table: 'Baggage', column: 'customData', type: 'TEXT' },
  { table: 'Baggage', column: 'lotId', type: 'TEXT' },
  { table: 'Baggage', column: 'assignedToAgencyAt', type: 'DATETIME' },
  { table: 'Baggage', column: 'soldAt', type: 'DATETIME' },
  { table: 'Baggage', column: 'activatedAt', type: 'DATETIME' },
  { table: 'Baggage', column: 'ownerPin', type: 'TEXT' },
  { table: 'Baggage', column: 'ownerPinSetAt', type: 'DATETIME' },
];

let added = 0;
let skipped = 0;
let errors = 0;

for (const m of migrations) {
  try {
    // Vérifier si la colonne existe déjà
    const checkCmd = `sqlite3 "${DB_PATH}" "PRAGMA table_info(${m.table});" 2>/dev/null`;
    const result = execSync(checkCmd, { encoding: 'utf-8' });
    
    if (result.includes(m.column)) {
      skipped++;
      continue;
    }
    
    // La colonne n'existe pas → l'ajouter
    const alterCmd = `sqlite3 "${DB_PATH}" "ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type};" 2>&1`;
    const alterResult = execSync(alterCmd, { encoding: 'utf-8' });
    
    if (alterResult && alterResult.includes('Error')) {
      console.log(`  ⚠️  ${m.table}.${m.column}: ${alterResult.trim()}`);
      errors++;
    } else {
      console.log(`  ✅ ${m.table}.${m.column} ajoutée`);
      added++;
    }
  } catch (e) {
    // La table n'existe peut-être pas encore — pas grave
    console.log(`  ℹ️  ${m.table}.${m.column}: table inexistante (sera créée par prisma)`);
    skipped++;
  }
}

// Créer les tables TagLot et TagSale si elles n'existent pas
try {
  const checkTagLot = execSync(`sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='table' AND name='TagLot';"`, { encoding: 'utf-8' });
  if (!checkTagLot.trim()) {
    console.log('  📦 Création table TagLot...');
    execSync(`sqlite3 "${DB_PATH}" "
      CREATE TABLE IF NOT EXISTS TagLot (
        id TEXT PRIMARY KEY,
        lotNumber TEXT NOT NULL UNIQUE,
        generatedById TEXT,
        agencyId TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'generated',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        assignedAt DATETIME
      );
    "`, { encoding: 'utf-8' });
    console.log('  ✅ Table TagLot créée');
    added++;
  } else {
    skipped++;
  }
} catch (e) {
  console.log('  ℹ️  TagLot: table existe déjà ou erreur');
}

try {
  const checkTagSale = execSync(`sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='table' AND name='TagSale';"`, { encoding: 'utf-8' });
  if (!checkTagSale.trim()) {
    console.log('  📦 Création table TagSale...');
    execSync(`sqlite3 "${DB_PATH}" "
      CREATE TABLE IF NOT EXISTS TagSale (
        id TEXT PRIMARY KEY,
        baggageId TEXT NOT NULL,
        agencyId TEXT NOT NULL,
        buyerName TEXT,
        buyerPhone TEXT,
        salePrice REAL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        invoiceRef TEXT,
        soldAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    "`, { encoding: 'utf-8' });
    console.log('  ✅ Table TagSale créée');
    added++;
  } else {
    skipped++;
  }
} catch (e) {
  console.log('  ℹ️  TagSale: table existe déjà ou erreur');
}

// ─── Review — ajout des nouveaux champs pour avis postés depuis /track/[token] ───
// trackingToken, finderName, objectName, objectPhoto, objectCategory
// + changement de la valeur par défaut de isApproved (true → publication immédiate)
const reviewColumns = [
  { table: 'Review', column: 'trackingToken', type: 'TEXT' },
  { table: 'Review', column: 'finderName', type: 'TEXT' },
  { table: 'Review', column: 'objectName', type: 'TEXT' },
  { table: 'Review', column: 'objectPhoto', type: 'TEXT' },
  { table: 'Review', column: 'objectCategory', type: 'TEXT' },
];
for (const m of reviewColumns) {
  try {
    const exists = execSync(`sqlite3 "${DB_PATH}" "PRAGMA table_info(${m.table});"`, { encoding: 'utf-8' });
    if (!exists.includes(m.column)) {
      execSync(`sqlite3 "${DB_PATH}" "ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type};"`, { encoding: 'utf-8' });
      console.log(`  ✅ ${m.table}.${m.column} ajouté`);
      added++;
    } else {
      skipped++;
    }
  } catch (e) {
    console.log(`  ℹ️  ${m.table}.${m.column}: existe déjà ou erreur`);
  }
}

// Création d'index pour la nouvelle colonne trackingToken (si pas déjà présent)
try {
  execSync(`sqlite3 "${DB_PATH}" "CREATE INDEX IF NOT EXISTS Review_trackingToken_idx ON Review(trackingToken);"`, { encoding: 'utf-8' });
} catch (e) {
  // Index peut déjà exister
}

console.log(`\n📊 Migration terminée: ${added} ajoutée(s), ${skipped} existante(s), ${errors} erreur(s)`);
