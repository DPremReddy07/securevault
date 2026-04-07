// lib/encryptionService.js
// All AES-256 encryption/decryption runs CLIENT-SIDE ONLY.
// Import this only in "use client" components.

import CryptoJS from "crypto-js";

// ⚠️  Demo key — replace with PBKDF2-derived key in production
const DEMO_KEY = "DEMO_SECRET_KEY_CHANGE_ME";

/**
 * Encrypt any string (or base64 data URL) with AES-256.
 * @param {string} plaintext
 * @param {string} [key]  optional — defaults to DEMO_KEY
 * @returns {string} ciphertext
 */
export function encrypt(plaintext, key = DEMO_KEY) {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

/**
 * Decrypt AES-256 ciphertext back to a UTF-8 string.
 * @param {string} ciphertext
 * @param {string} [key]
 * @returns {string} plaintext, or throws if decryption fails
 */
export function decrypt(ciphertext, key = DEMO_KEY) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const plain = bytes.toString(CryptoJS.enc.Utf8);
  if (!plain) throw new Error("Decryption failed — check your key.");
  return plain;
}

/**
 * Read a File object into a base64 data URL (browser only).
 * @param {File} file
 * @returns {Promise<string>} data URL
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Encrypt a File object → returns the AES ciphertext string.
 * @param {File} file
 * @param {string} [key]
 */
export async function encryptFile(file, key = DEMO_KEY) {
  const dataUrl = await fileToDataUrl(file);
  return encrypt(dataUrl, key);
}

/**
 * Decrypt ciphertext → triggers a browser download of the original file.
 * @param {string} ciphertext
 * @param {string} filename
 * @param {string} [key]
 */
export function decryptAndDownload(ciphertext, filename, key = DEMO_KEY) {
  const dataUrl = decrypt(ciphertext, key);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// ── PBKDF2 key derivation (production-ready, not yet wired up) ──────────────
/**
 * Derive a strong AES key from a master password + user-unique salt.
 * Call this after login. Keep the result in memory only — never store it.
 * @param {string} masterPassword
 * @param {string} salt  use user.id
 * @returns {string} hex key
 */
export function deriveKey(masterPassword, salt) {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 8,         // 256-bit
    iterations: 100_000,
  }).toString();
}
