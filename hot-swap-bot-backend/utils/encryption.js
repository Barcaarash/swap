const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('Invalid encryption key. Please set a secure ENCRYPTION_KEY in .env file (at least 32 characters)');
}

/**
 * Encrypt a string using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = CryptoJS.lib.WordArray.random(16); // Generate random IV
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combine IV and encrypted data
    const result = iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.toString();
    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Text to decrypt
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encrypted = parts[1];
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

module.exports = {
  encrypt,
  decrypt
}; 