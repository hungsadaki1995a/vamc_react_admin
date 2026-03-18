/**
 * SHA-512 hash using Web Crypto API (SubtleCrypto).
 * Returns lowercase hex string (128 chars).
 */
export async function sha512(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-512', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * RSA-OAEP password encryption using Web Crypto API (no external library).
 *
 * Flow:
 *  1. Fetch backend public key (SPKI/Base64) → GET /api/auth/public-key
 *  2. Import key via SubtleCrypto
 *  3. Encrypt plaintext password with RSA-OAEP/SHA-256
 *  4. Base64-encode encrypted bytes → send to backend
 */

async function importSpkiKey(spkiBase64: string): Promise<CryptoKey> {
  const binaryStr = atob(spkiBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Encrypt a plaintext password with the given RSA public key (SPKI/Base64).
 * Returns Base64-encoded ciphertext.
 */
export async function encryptPassword(publicKeyBase64: string, password: string): Promise<string> {
  const cryptoKey = await importSpkiKey(publicKeyBase64);
  const encoded = new TextEncoder().encode(password);
  const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cryptoKey, encoded);
  return arrayBufferToBase64(encrypted);
}
