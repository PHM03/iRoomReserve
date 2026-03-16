import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Allowed Email Domain ───────────────────────────────────────
const ALLOWED_DOMAIN = "sdca.edu.ph";

// ─── Superadmin Credentials ─────────────────────────────────────
const SUPERADMIN_EMAIL = "johncyrus.agoncillo@sdca.edu.ph";

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

// ─── Email / Password Login ─────────────────────────────────────
export async function loginWithEmail(email: string, password: string) {
  // Don't enforce SDCA email upfront — Utility Staff use non-SDCA emails.
  // Domain validation happens based on the user's stored role after login.
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Block login if email is not verified
  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw { code: "auth/email-not-verified" };
  }

  // Auto-detect Super Admin — if the email matches, set the role automatically
  if (credential.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    await saveUserProfile(credential.user.uid, {
      firstName: credential.user.displayName?.split(" ")[0] || "Super",
      lastName: credential.user.displayName?.split(" ").slice(1).join(" ") || "Admin",
      email: credential.user.email,
      role: "Super Admin",
      status: "approved",
    });
    return credential;
  }

  // Check approval status for Faculty, Utility Staff, and Administrator
  const profile = await getUserProfile(credential.user.uid);
  if (profile && (profile.role === "Faculty" || profile.role === "Administrator" || profile.role === "Utility Staff")) {
    if (profile.status === "pending") {
      await signOut(auth);
      throw { code: "auth/account-pending" };
    }
    if (profile.status === "rejected") {
      await signOut(auth);
      throw { code: "auth/account-rejected" };
    }
  }

  return credential;
}

// ─── Email / Password Registration ──────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string = "Student"
) {
  // Auto-detect Utility Staff: if registering as Faculty with a non-SDCA email,
  // the user is a Utility Staff member.
  const actualRole = (role === "Faculty" && !isAllowedEmail(email))
    ? "Utility Staff"
    : role;

  // Enforce SDCA email for all roles except Utility Staff
  if (actualRole !== "Utility Staff" && !isAllowedEmail(email)) {
    throw { code: "auth/unauthorized-domain" };
  }

  // 1. Create the Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // 2. Set display name on the Auth profile
  await updateProfile(credential.user, {
    displayName: `${firstName} ${lastName}`,
  });

  // 3. Determine approval status based on role
  const status = actualRole === "Student" ? "approved" : "pending";

  // 4. Save additional profile data to Firestore (including role and status)
  await saveUserProfile(credential.user.uid, { firstName, lastName, email, role: actualRole, status });

  // 5. Send email verification
  await sendEmailVerification(credential.user);

  // 6. Sign out until they verify their email
  await signOut(auth);

  return { credential, actualRole };
}

// ─── Google Sign-In ─────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
// Restrict Google popup to only show SDCA accounts
googleProvider.setCustomParameters({ hd: ALLOWED_DOMAIN });

export async function loginWithGoogle(role: string = "Student") {
  const result = await signInWithPopup(auth, googleProvider);

  // Double-check the domain (user could bypass the popup hint)
  if (!result.user.email || !isAllowedEmail(result.user.email)) {
    // Sign out the unauthorized user immediately
    await signOut(auth);
    throw { code: "auth/unauthorized-domain" };
  }

  // Save profile to Firestore on first Google login
  const { uid, displayName, email } = result.user;
  const nameParts = (displayName ?? "").split(" ");

  // Check if user already has a profile with a role; if not, use the provided role
  const existingProfile = await getUserProfile(uid);
  const finalRole = existingProfile?.role || role;
  const status = existingProfile?.status || (finalRole === "Student" ? "approved" : "pending");

  await saveUserProfile(uid, {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: email || "",
    role: finalRole,
    status,
  });

  // Check approval status for Faculty, Utility Staff, and Administrator
  if (finalRole === "Faculty" || finalRole === "Administrator" || finalRole === "Utility Staff") {
    if (status === "pending") {
      await signOut(auth);
      throw { code: "auth/account-pending" };
    }
    if (status === "rejected") {
      await signOut(auth);
      throw { code: "auth/account-rejected" };
    }
  }

  return result;
}

// ─── Superadmin Login ───────────────────────────────────────────
export async function loginSuperAdmin(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // If the email matches the designated superadmin email, ensure the profile is correct
  if (credential.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    await saveUserProfile(credential.user.uid, {
      firstName: "Super",
      lastName: "Admin",
      email: credential.user.email,
      role: "Super Admin",
      status: "approved",
    });
    return credential;
  }

  // For any other email, verify they have Super Admin role
  const profile = await getUserProfile(credential.user.uid);
  if (!profile || profile.role !== "Super Admin") {
    await signOut(auth);
    throw { code: "auth/not-superadmin" };
  }

  return credential;
}

// ─── Seed Superadmin Account ────────────────────────────────────
// Call this once to create the superadmin account in Firebase
export async function seedSuperAdmin() {
  try {
    // Try to create the account (will fail if already exists)
    const credential = await createUserWithEmailAndPassword(
      auth,
      SUPERADMIN_EMAIL,
      "AnimeVanguards1500"
    );

    await updateProfile(credential.user, {
      displayName: "Super Admin",
    });

    await saveUserProfile(credential.user.uid, {
      firstName: "Super",
      lastName: "Admin",
      email: SUPERADMIN_EMAIL,
      role: "Super Admin",
      status: "approved",
    });

    // Send email verification
    await sendEmailVerification(credential.user);

    // Sign out after seeding
    await signOut(auth);

    return { success: true, message: "Super Admin account created. Please verify the email." };
  } catch (err: unknown) {
    const firebaseError = err as { code?: string };
    if (firebaseError.code === "auth/email-already-in-use") {
      // Account already exists — ensure Firestore profile is set
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          SUPERADMIN_EMAIL,
          "AnimeVanguards1500"
        );
        await saveUserProfile(credential.user.uid, {
          firstName: "Super",
          lastName: "Admin",
          email: SUPERADMIN_EMAIL,
          role: "Super Admin",
          status: "approved",
        });
        await signOut(auth);
        return { success: true, message: "Super Admin profile updated." };
      } catch {
        return { success: false, message: "Super Admin account exists but could not update profile." };
      }
    }
    return { success: false, message: `Failed to create Super Admin: ${firebaseError.code}` };
  }
}

// ─── Get User Profile from Firestore ────────────────────────────
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    return snap.data() as {
      firstName: string;
      lastName: string;
      email: string;
      role?: string;
      status?: string;
    };
  }
  return null;
}

// ─── Logout ─────────────────────────────────────────────────────
export async function logout() {
  return signOut(auth);
}

// ─── Forgot Password (Reset via Email) ──────────────────────────
export async function resetPassword(email: string) {
  if (!isAllowedEmail(email)) {
    throw { code: "auth/unauthorized-domain" };
  }
  await sendPasswordResetEmail(auth, email);
}

// ─── Resend Verification Email ──────────────────────────────────
export async function resendVerificationEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user.emailVerified) {
    await sendEmailVerification(credential.user);
    await signOut(auth);
  }
}

// ─── Save User Profile to Firestore ─────────────────────────────
export async function saveUserProfile(
  uid: string,
  data: { firstName: string; lastName: string; email: string; role?: string; status?: string }
) {
  await setDoc(
    doc(db, "users", uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Approval Management (Superadmin) ───────────────────────────

export interface ManagedUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  updatedAt?: { seconds: number; nanoseconds: number };
}

// Get users by status with real-time updates
export function onPendingUsers(callback: (users: ManagedUser[]) => void): Unsubscribe {
  const q = query(
    collection(db, "users"),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snapshot) => {
    const users: ManagedUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        role: data.role || "",
        status: data.status || "pending",
        updatedAt: data.updatedAt,
      });
    });
    callback(users);
  });
}

export function onUsersByStatus(
  status: string,
  callback: (users: ManagedUser[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    where("status", "==", status),
    where("role", "in", ["Faculty", "Administrator", "Utility Staff"])
  );
  return onSnapshot(q, (snapshot) => {
    const users: ManagedUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        role: data.role || "",
        status: data.status || "",
        updatedAt: data.updatedAt,
      });
    });
    callback(users);
  });
}

export async function approveUser(uid: string) {
  await updateDoc(doc(db, "users", uid), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
}

export async function rejectUser(uid: string) {
  await updateDoc(doc(db, "users", uid), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
}

// ─── Friendly Error Messages ────────────────────────────────────
export function getAuthErrorMessage(code: string): string {
  console.warn("Auth error:", code);

  const safeMessages: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
  };

  return safeMessages[code] ?? "Invalid email or password.";
}
