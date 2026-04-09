import crypto from 'crypto';
import { Buffer } from 'buffer';

const ALGORITHM = 'aes-256-cbc';
// Ensure we have a key. In production this comes from env.
// For local dev safety, if missing, we generate one (session ephemeral).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
  console.warn("⚠️  WARNING: ENCRYPTION_KEY not set in .env. Using ephemeral key (API keys will be lost on restart).");
}

export const cryptoUtils = {
  encrypt: (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    // If key provided in env is string, handle padding or hashing if needed, 
    // but assuming 32-byte hex string for strict security
    // Fallback if key length is wrong (simple hash to fix length)
    const validKey = key.length === 32 ? key : crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

    const cipher = crypto.createCipheriv(ALGORITHM, validKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },

  decrypt: (text: string): string => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const validKey = key.length === 32 ? key : crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, validKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
};