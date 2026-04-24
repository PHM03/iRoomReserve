import "server-only";

import admin from "firebase-admin";

// Required in .env.local for all backend API routes:
// FIREBASE_PROJECT_ID
// FIREBASE_CLIENT_EMAIL
// FIREBASE_PRIVATE_KEY
const REQUIRED_FIREBASE_ADMIN_ENV_KEYS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

function getFirebaseAdminEnvPresence() {
  return {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID?.trim()),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim()),
  };
}

function getRequiredEnvValue(
  key: (typeof REQUIRED_FIREBASE_ADMIN_ENV_KEYS)[number]
) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `Firebase Admin SDK requires ${REQUIRED_FIREBASE_ADMIN_ENV_KEYS.join(
        ", "
      )} in .env.local. Missing: ${key}.`
    );
  }

  return value;
}

function getFirebaseAdminConfig() {
  return {
    projectId: getRequiredEnvValue("FIREBASE_PROJECT_ID"),
    clientEmail: getRequiredEnvValue("FIREBASE_CLIENT_EMAIL"),
    privateKey: getRequiredEnvValue("FIREBASE_PRIVATE_KEY").replace(
      /\\n/g,
      "\n"
    ),
  };
}

if (!admin.apps.length) {
  console.info(
    "[firebase-admin] Environment variable presence",
    getFirebaseAdminEnvPresence()
  );

  const { projectId, clientEmail, privateKey } = getFirebaseAdminConfig();

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    const errorWithCode =
      error instanceof Error ? (error as Error & { code?: unknown }) : null;

    console.error("[firebase-admin] Failed to initialize Firebase Admin SDK", {
      error,
      message: error instanceof Error ? error.message : String(error),
      code: errorWithCode?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;

export function deleteField() {
  return admin.firestore.FieldValue.delete();
}

export function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}
