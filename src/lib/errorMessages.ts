// maps raw errors to user-friendly messages

const FIREBASE_AUTH_ERRORS: Record<string, string> = {

  'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.',


  'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/invalid-password': 'Invalid password. Please try a stronger one.',


  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',


  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  'auth/internal-error': 'Something went wrong. Please try again later.',
  'auth/unauthorized-domain': 'This domain is not authorized. Contact support.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
  'auth/timeout': 'Request timed out. Please check your connection and try again.',
};

const SUPABASE_ERRORS: Record<string, string> = {

  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'NetworkError': 'Network error. Please check your internet connection and try again.',
  'connection error': 'Unable to connect to the database. Please try again later.',


  'JWTExpired': 'Your session has expired. Please sign in again.',
  'JsonWebTokenError': 'Invalid session. Please sign in again.',
  'invalid claim': 'Your session is invalid. Please sign in again.',


  'duplicate key': 'This record already exists.',
  'violates foreign key constraint': 'Related record not found. It may have been deleted.',
  'violates check constraint': 'Invalid data provided. Please check your inputs.',
  'null value in column': 'A required field is missing. Please fill in all required fields.',
  'value too long': 'One of your inputs is too long. Please shorten it.',


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


export function getUserFriendlyError(error: unknown): string {
  // pull the raw error string out of whatever we got
  let raw = '';
  if (error instanceof Error) {
    raw = error.message || error.name || '';
  } else if (typeof error === 'string') {
    raw = error;
  } else if (error && typeof error === 'object') {
    // firebase errors use a .code property
    const code = (error as any).code || '';
    const msg = (error as any).message || '';
    raw = code || msg;
  }

  if (raw && typeof raw === 'string') {
    raw = raw.trim();
  } else if (raw !== undefined && raw !== null) {
    raw = String(raw).trim();
  }
  if (!raw) return 'Something went wrong. Please try again later.';


  if (FIREBASE_AUTH_ERRORS[raw]) {
    return FIREBASE_AUTH_ERRORS[raw];
  }

  // might be embedded in a longer message
  const firebaseCodeMatch = raw.match(/auth\/[\w-]+/);
  if (firebaseCodeMatch && FIREBASE_AUTH_ERRORS[firebaseCodeMatch[0]]) {
    return FIREBASE_AUTH_ERRORS[firebaseCodeMatch[0]];
  }

  // partial match against known error strings
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

  // pattern-based fallbacks
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

  // try to clean up and return something readable
  const cleaned = raw
    .replace(/^Firebase:\/?\s*/i, '')
    .replace(/^Error:\/?\s*/i, '');

  if (cleaned !== raw && cleaned.length < 120) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // too long/technical, just give up
  if (raw.length > 150) {
    return 'Something went wrong. Please try again later.';
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** wraps an async call and returns a friendly error on failure */
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
