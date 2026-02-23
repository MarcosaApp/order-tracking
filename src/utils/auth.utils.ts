// Auth utilities with session signing to prevent tampering

const SECRET_KEY = "your-secret-key-change-this-in-production"; // In production, this should be env variable

interface SessionData {
  role: "admin" | "driver";
  username: string;
  expiresAt: number;
}

interface SignedSession {
  data: SessionData;
  signature: string;
}

/**
 * Creates a simple hash signature for session data
 * This prevents users from tampering with the role in localStorage
 */
async function createSignature(data: SessionData): Promise<string> {
  const payload = JSON.stringify({
    role: data.role,
    username: data.username,
    expiresAt: data.expiresAt,
    secret: SECRET_KEY,
  });

  // Use Web Crypto API to create a hash
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

/**
 * Verifies that the session data hasn't been tampered with
 */
async function verifySignature(
  data: SessionData,
  signature: string
): Promise<boolean> {
  const expectedSignature = await createSignature(data);
  return signature === expectedSignature;
}

/**
 * Creates a signed session that can be stored in localStorage
 */
export async function createSession(
  role: "admin" | "driver",
  username: string,
  expiresAt: number
): Promise<string> {
  const sessionData: SessionData = {
    role,
    username,
    expiresAt,
  };

  const signature = await createSignature(sessionData);

  const signedSession: SignedSession = {
    data: sessionData,
    signature,
  };

  return JSON.stringify(signedSession);
}

/**
 * Validates and retrieves session data from localStorage
 * Returns null if session is invalid, expired, or tampered with
 */
export async function validateSession(
  sessionString: string | null
): Promise<SessionData | null> {
  if (!sessionString) {
    return null;
  }

  try {
    const signedSession: SignedSession = JSON.parse(sessionString);

    // Verify signature to prevent tampering
    const isValid = await verifySignature(
      signedSession.data,
      signedSession.signature
    );

    if (!isValid) {
      console.warn("⚠️ Session signature invalid - possible tampering detected!");
      return null;
    }

    // Check expiration
    const now = Date.now();
    if (signedSession.data.expiresAt <= now) {
      return null; // Expired
    }

    return signedSession.data;
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
}

/**
 * User credentials for authentication
 * In production, this should be handled by a backend API
 */
export const USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
  },
  driver: {
    username: "driver",
    password: "driver123",
    role: "driver" as const,
  },
};

/**
 * Authenticates a user with username and password
 * Returns the user's role if successful, null otherwise
 */
export function authenticateUser(
  username: string,
  password: string
): { role: "admin" | "driver"; username: string } | null {
  // Check admin credentials
  if (
    username === USERS.admin.username &&
    password === USERS.admin.password
  ) {
    return {
      role: USERS.admin.role,
      username: USERS.admin.username,
    };
  }

  // Check driver credentials
  if (
    username === USERS.driver.username &&
    password === USERS.driver.password
  ) {
    return {
      role: USERS.driver.role,
      username: USERS.driver.username,
    };
  }

  return null;
}
