import "server-only";

import admin from "firebase-admin";

const FIREBASE_ADMIN_ENV_ALIASES = {
  FIREBASE_PROJECT_ID: [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_ADMIN_PROJECT_ID",
  ],
  FIREBASE_CLIENT_EMAIL: [
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
  ],
  FIREBASE_PRIVATE_KEY: [
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ],
} as const;

function clearInvalidProxyEnv() {
  const proxyKeys = [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
  ] as const;

  proxyKeys.forEach((key) => {
    const value = process.env[key]?.trim();

    if (
      value === "http://127.0.0.1:9" ||
      value === "https://127.0.0.1:9"
    ) {
      delete process.env[key];
    }
  });
}

function getFirebaseAdminEnvPresence() {
  return {
    FIREBASE_PROJECT_ID: FIREBASE_ADMIN_ENV_ALIASES.FIREBASE_PROJECT_ID.some(
      (key) => Boolean(process.env[key]?.trim())
    ),
    FIREBASE_CLIENT_EMAIL: FIREBASE_ADMIN_ENV_ALIASES.FIREBASE_CLIENT_EMAIL.some(
      (key) => Boolean(process.env[key]?.trim())
    ),
    FIREBASE_PRIVATE_KEY: FIREBASE_ADMIN_ENV_ALIASES.FIREBASE_PRIVATE_KEY.some(
      (key) => Boolean(process.env[key]?.trim())
    ),
  };
}

function getRequiredEnvValue(
  key: keyof typeof FIREBASE_ADMIN_ENV_ALIASES
) {
  const matchedKey = FIREBASE_ADMIN_ENV_ALIASES[key].find(
    (envKey) => process.env[envKey]?.trim()
  );

  if (!matchedKey) {
    throw new Error(
      `Firebase Admin SDK requires one of these env vars: ${FIREBASE_ADMIN_ENV_ALIASES[
        key
      ].join(", ")}. Missing: ${key}.`
    );
  }

  const rawValue = process.env[matchedKey]?.trim() ?? "";

  if (key !== "FIREBASE_PRIVATE_KEY") {
    return rawValue;
  }

  const unwrappedValue =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ? rawValue.slice(1, -1)
      : rawValue;

  return unwrappedValue;
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
  clearInvalidProxyEnv();

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
