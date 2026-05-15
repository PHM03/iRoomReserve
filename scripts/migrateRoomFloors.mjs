/**
 * migrateRoomFloors.mjs
 *
 * Migrates all Firestore room documents so their `floor` field matches the
 * canonical floor-name strings defined in lib/buildings/floorLabels.ts.
 *
 * Canonical floor names per building:
 *   sdca-digital-campus : Ground Floor | 2nd Floor | 3rd Floor | 4th Floor
 *   gd1                 : Basement | Ground Floor | 2nd–8th Floor
 *   gd2                 : Ground Floor | 2nd–10th Floor
 *   gd3                 : Ground Floor | 2nd–11th Floor
 *
 * Usage (from project root):
 *   node scripts/migrateRoomFloors.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

// ── Read env vars ─────────────────────────────────────────────────────────────
const require = createRequire(import.meta.url);
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually (no dotenv dependency needed)
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const eqIdx = line.indexOf('=');
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return [key, value];
    })
);

const privateKey = env['FIREBASE_ADMIN_PRIVATE_KEY']?.replace(/\\n/g, '\n');
const clientEmail = env['FIREBASE_ADMIN_CLIENT_EMAIL'];
const projectId = env['FIREBASE_ADMIN_PROJECT_ID'];

if (!privateKey || !clientEmail || !projectId) {
  console.error('❌  Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey
  }),
});

const db = getFirestore();

// ── Migration map ─────────────────────────────────────────────────────────────
// Keys: old stored value  →  Value: new canonical value
const DIGITAL_CAMPUS_FLOOR_MAP = {
  // The old code stored "1st Floor", "2nd Floor", "3rd Floor" as DB values
  // while displaying "2nd Floor", "3rd Floor", "4th Floor" in the UI.
  // The new code aligns label === value, so we shift everything up.
  'Ground Floor': 'Ground Floor', // no change
  '1st Floor': '2nd Floor',
  '2nd Floor': '3rd Floor',
  '3rd Floor': '4th Floor',
  // Also fix any rooms that already had the display label stored by accident:
  '4th Floor': '4th Floor', // idempotent – already correct
};

// GD1: rename "Basement Floor" → "Basement"
const GD1_FLOOR_MAP = {
  'Basement Floor': 'Basement',
  'Basement': 'Basement',       // idempotent
  'Ground Floor': 'Ground Floor',
};

// ── Migration logic ───────────────────────────────────────────────────────────
async function migrateRooms() {
  const snapshot = await db.collection('rooms').get();
  console.log(`\n🔍  Found ${snapshot.size} room documents.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const buildingId = data.buildingId ?? '';
    const currentFloor = data.floor ?? '';
    let newFloor = null;

    if (buildingId === 'sdca-digital-campus') {
      const mapped = DIGITAL_CAMPUS_FLOOR_MAP[currentFloor];
      if (mapped !== undefined && mapped !== currentFloor) {
        newFloor = mapped;
      }
    } else if (buildingId === 'gd1') {
      const mapped = GD1_FLOOR_MAP[currentFloor];
      if (mapped !== undefined && mapped !== currentFloor) {
        newFloor = mapped;
      }
    }
    // gd2 / gd3 already store correct values ("Ground Floor", "2nd Floor" … etc)

    if (newFloor !== null) {
      console.log(
        `  ✏️   [${buildingId}] "${data.name}" · floor: "${currentFloor}" → "${newFloor}"`
      );
      batch.update(doc.ref, {
        floor: newFloor
      });
      updatedCount++;
      batchCount++;

      // Firestore batches are limited to 500 writes
      if (batchCount === 499) {
        await batch.commit();
        console.log(`  ✅  Committed batch of ${batchCount} updates.`);
        batchCount = 0;
      }
    } else {
      skippedCount++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`  ✅  Committed final batch of ${batchCount} updates.`);
  }

  console.log(`\n✅  Migration complete!`);
  console.log(`   Updated : ${updatedCount} room(s)`);
  console.log(`   Skipped : ${skippedCount} room(s) (already correct or no mapping needed)`);
}

migrateRooms().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
