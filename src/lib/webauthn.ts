/**
 * WebAuthn helpers for fingerprint registration and verification.
 * Uses the browser's built-in WebAuthn API to interact with laptop fingerprint scanners.
 */

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert base64url string to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function isWebAuthnSupported(): boolean {
  return !!(window.PublicKeyCredential && navigator.credentials);
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
}

/**
 * Register a new fingerprint credential for a user.
 */
export async function registerFingerprint(
  userId: string,
  userName: string,
  userDisplayName: string
): Promise<WebAuthnCredential> {
  const challenge = generateChallenge() as unknown as BufferSource;

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: "Kabejja Data Centre",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },   // ES256
      { alg: -257, type: "public-key" },  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "discouraged",
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: "none",
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error("Fingerprint registration was cancelled or failed");
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    credentialId: bufferToBase64url(credential.rawId),
    publicKey: bufferToBase64url(response.attestationObject),
    counter: 0,
  };
}

/**
 * Verify a fingerprint against stored credentials.
 * Returns the matched credential ID.
 */
export async function verifyFingerprint(
  allowedCredentials: { credentialId: string }[]
): Promise<{ credentialId: string; verified: boolean }> {
  if (allowedCredentials.length === 0) {
    throw new Error("No registered fingerprints found. Please register first.");
  }

  const challenge = generateChallenge() as unknown as BufferSource;

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: allowedCredentials.map((cred) => ({
      id: base64urlToBuffer(cred.credentialId) as unknown as BufferSource,
      type: "public-key" as const,
      transports: ["internal" as AuthenticatorTransport],
    })),
    userVerification: "required",
    timeout: 60000,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential;

  if (!assertion) {
    throw new Error("Fingerprint verification was cancelled or failed");
  }

  return {
    credentialId: bufferToBase64url(assertion.rawId),
    verified: true,
  };
}
