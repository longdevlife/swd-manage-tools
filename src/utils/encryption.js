// Encryption / Decryption Utility for Jira & GitHub Credentials (BR-08)
// Uses AES-256 symmetric encryption via crypto-js
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_32_byte_encryption_key_!";

/**
 * Encrypt a plain text string
 * @param {string} plainText
 * @returns {string} encrypted ciphertext
 */
export const encrypt = (plainText) => {
  return CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt an encrypted string back to plain text
 * @param {string} cipherText
 * @returns {string} decrypted plain text
 */
export const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
