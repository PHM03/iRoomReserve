import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Allowed Email Domain ───────────────────────────────────────
const ALLOWED_DOMAIN = "sdca.edu.ph";

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

// ─── Email / Password Login ─────────────────────────────────────
export async function loginWithEmail(email: string, password: string) {
  if (!isAllowedEmail(email)) {
    throw { code: "auth/unauthorized-domain" };
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Block login if email is not verified
  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw { code: "auth/email-not-verified" };
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
  if (!isAllowedEmail(email)) {
    throw { code: "auth/unauthorized-domain" };
  }

  // 1. Create the Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // 2. Set display name on the Auth profile
  await updateProfile(credential.user, {
    displayName: `${firstName} ${lastName}`,
  });

  // 3. Save additional profile data to Firestore (including role)
  await saveUserProfile(credential.user.uid, { firstName, lastName, email, role });

  // 4. Send email verification
  await sendEmailVerification(credential.user);

  // 5. Sign out until they verify their email
  await signOut(auth);

  return credential;
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
  await saveUserProfile(uid, {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: email || "",
    role: existingProfile?.role || role,
  });

  return result;
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
    };
  }
  return null;
}

// ─── Logout ─────────────────────────────────────────────────────
export async function logout() {
  return signOut(auth);
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
  data: { firstName: string; lastName: string; email: string; role?: string }
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

// ─── Friendly Error Messages ────────────────────────────────────
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/unauthorized-domain":
      return "Please use your official SDCA email address to Continue.";
    case "auth/email-not-verified":
      return "Please verify your email address first. Check your inbox for the verification link.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}
