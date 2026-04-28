/**
 * Centralized error message mapper.
 * Converts technical Firebase / Supabase / network errors into user-friendly strings.
 */

const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  // Credential / login errors
  'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.',

  // Registration errors
  'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/invalid-password': 'Invalid password. Please try a stronger one.',

  // Google / OAuth errors
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',

  // General auth
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  'auth/internal-error': 'Something went wrong. Please try again later.',
  'auth/unauthorized-domain': 'This domain is not authorized. Contact support.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
  'auth/timeout': 'Request timed out. Please check your connection and try again.',
};

const SUPABASE_ERRORS: Record<string, string> = {
  // Connection
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'NetworkError': 'Network error. Please check your internet connection and try again.',
  'connection error': 'Unable to connect to the database. Please try again later.',

  // Auth / RLS
  'JWTExpired': 'Your session has expired. Please sign in again.',
  'JsonWebTokenError': 'Invalid session. Please sign in again.',
  'invalid claim': 'Your session is invalid. Please sign in again.',

  // Constraints
  'duplicate key': 'This record already exists.',
  'violates foreign key constraint': 'Related record not found. It may have been deleted.',
  'violates check constraint': 'Invalid data provided. Please check your inputs.',
  'null value in column': 'A required field is missing. Please fill in all required fields.',
  'value too long': 'One of your inputs is too long. Please shorten it.',

  // Common table-specific
  'cross_ngo_alerts': 'Alert system error. Please try again.',
  'issues': 'Issue data error. Please try again.',
  'ngos': 'NGO data error. Please try again.',
  'users': 'User data error. Please try again.',
  'volunteers': 'Volunteer data error. Please try again.',
};

const GENERIC_ERRORS: Record<string, string> = {
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'Network Error': 'Network error. Please check your internet connection and try again.',
  'timeout': 'Request timed out. Please try again.',
  'DUPLICATE': 'A similar report already exists nearby.',
  'Unauthorized': 'You are not authorized to perform this action. Please sign in.',
  'Forbidden': 'You do not have permission to perform this action.',
  'Not Found': 'The requested resource was not found.',
};

/**
 * Maps a raw error (Error object, string, or Firebase error code) to a user-friendly message.
 */
export function getUserFriendlyError(error: unknown): string {
  // 1. Extract the raw message / code
  let raw = '';
  if (error instanceof Error) {
    raw = error.message || error.name || '';
  } else if (typeof error === 'string') {
    raw = error;
  } else if (error && typeof error === 'object') {
    // Firebase errors often have a .code property
    const code = (error as any).code || '';
    const msg = (error as any).message || '';
    raw = code || msg;
  }

  raw = raw.trim();
  if (!raw) return 'Something went wrong. Please try again later.';

  // 2. Check Firebase auth errors (exact code match)
  if (FIREBASE_AUTH_ERRORS[raw]) {
    return FIREBASE_AUTH_ERRORS[raw];
  }

  // 3. Check for Firebase error code embedded in message
  const firebaseCodeMatch = raw.match(/auth\/[\w-]+/);
  if (firebaseCodeMatch && FIREBASE_AUTH_ERRORS[firebaseCodeMatch[0]]) {
    return FIREBASE_AUTH_ERRORS[firebaseCodeMatch[0]];
  }

  // 4. Check Supabase / generic errors (partial match)
  for (const [key, message] of Object.entries(SUPABASE_ERRORS)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  for (const [key, message] of Object.entries(GENERIC_ERRORS)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  // 5. Fallbacks for common patterns
  const lower = raw.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('internet')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (lower.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (lower.includes('forbidden') || lower.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'The requested resource was not found.';
  }
  if (lower.includes('already exists') || lower.includes('duplicate')) {
    return 'This record already exists.';
  }
  if (lower.includes('required') || lower.includes('missing')) {
    return 'A required field is missing. Please fill in all required fields.';
  }
  if (lower.includes('invalid')) {
    return 'Invalid input. Please check your information and try again.';
  }

  // 6. Final fallback — strip technical prefixes but keep the gist
  const cleaned = raw
    .replace(/^Firebase:\/?\s*/i, '')
    .replace(/^Error:\/?\s*/i, '');

  if (cleaned !== raw && cleaned.length < 120) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 7. Ultra-generic fallback for very long / technical messages
  if (raw.length > 150) {
    return 'Something went wrong. Please try again later.';
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Wraps an async function and returns a user-friendly error message on failure.
 */
export async function withFriendlyError<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: getUserFriendlyError(err) };
  }
}
