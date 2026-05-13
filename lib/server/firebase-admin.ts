import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const FIREBASE_ADMIN_ENV_ALIASES = {
  projectId: ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_PROJECT_ID"],
  clientEmail: ["FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_CLIENT_EMAIL"],
  privateKey: ["FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_PRIVATE_KEY"],
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

function getEnvValue(key: keyof typeof FIREBASE_ADMIN_ENV_ALIASES) {
  const matchedKey = FIREBASE_ADMIN_ENV_ALIASES[key].find(
    (envKey) => process.env[envKey]?.trim()
  );

  return matchedKey ? process.env[matchedKey]?.trim() : undefined;
}

function getPrivateKey() {
  const rawValue = getEnvValue("privateKey");

  if (!rawValue) {
    return undefined;
  }

  const unwrappedValue =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ? rawValue.slice(1, -1)
      : rawValue;

  return unwrappedValue.replace(/\\n/g, "\n");
}

export function hasFirebaseAdminConfig() {
  return Boolean(
    getEnvValue("projectId") && getEnvValue("clientEmail") && getPrivateKey()
  );
}

function getAdminApp() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      "Firebase Admin SDK is not configured. Set FIREBASE_ADMIN_PROJECT_ID/FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY/FIREBASE_PRIVATE_KEY."
    );
  }

  clearInvalidProxyEnv();

  const existing = getApps().find((app) => app.name === "firebase-admin-server");
  if (existing) {
    return existing;
  }

  return initializeApp(
    {
      credential: cert({
        projectId: getEnvValue("projectId"),
        clientEmail: getEnvValue("clientEmail"),
        privateKey: getPrivateKey(),
      }),
    },
    "firebase-admin-server"
  );
}

export function getOptionalAdminAuth() {
  if (!hasFirebaseAdminConfig()) {
    return null;
  }

  return getAuth(getAdminApp());
}

export function getOptionalAdminDb() {
  if (!hasFirebaseAdminConfig()) {
    return null;
  }

  return getFirestore(getAdminApp());
}
