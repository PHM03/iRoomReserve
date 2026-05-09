import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function clearInvalidProxyEnv() {
  const proxyKeys = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"] as const;

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

function getPrivateKey() {
  const rawValue = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

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
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      getPrivateKey()
  );
}

function getAdminApp() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      "Firebase Admin SDK is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
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
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
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
