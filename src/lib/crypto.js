// ============================================
// VaultKey Crypto Module
// Uses Web Crypto API (AES-256-GCM + PBKDF2)
// ============================================

// Convert string to ArrayBuffer
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function bufferToStr(buf) {
  return new TextDecoder().decode(buf);
}

// Convert ArrayBuffer to base64
function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// Convert base64 to ArrayBuffer
function base64ToBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Generate random bytes
function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Derive a key from password + salt using PBKDF2
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuffer(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data with AES-256-GCM
async function encrypt(data, key, iv) {
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    strToBuffer(data)
  );
  return bufferToBase64(encrypted);
}

// Decrypt data with AES-256-GCM
async function decrypt(encryptedB64, key, iv) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBuffer(encryptedB64)
  );
  return bufferToStr(decrypted);
}

// ============================================
// Recovery Key Generation (24 words)
// ============================================

const WORDLIST = [
  "alba", "azul", "bajo", "bien", "cabo", "café", "dato", "edad",
  "faro", "gato", "hilo", "isla", "jugo", "kilo", "lago", "luna",
  "mesa", "nido", "onda", "pato", "ramo", "sala", "taza", "uvas",
  "vela", "yoga", "zinc", "arco", "boca", "cima", "duna", "euro",
  "flor", "gris", "humo", "iris", "joya", "lava", "miel", "nave",
  "ocho", "piel", "risa", "seda", "trio", "urna", "vida", "zona",
  "alma", "beso", "cola", "dedo", "filo", "gema", "hora", "idea",
  "jazz", "leon", "mapa", "nota", "oleo", "peso", "raiz", "solo",
  "tela", "urea", "vals", "yodo", "alfa", "bola", "cubo", "dama",
  "foca", "giro", "hada", "iman", "jade", "lira", "modo", "nube",
  "opas", "polo", "reja", "seta", "tubo", "ulna", "vino", "zeta",
  "ante", "buho", "cero", "dios", "ente", "fuga", "gala", "heno",
  "inca", "jefe", "lodo", "mimo", "neon", "obra", "puma", "reno",
  "surf", "toro", "udon", "vaso", "agua", "bala", "capa", "dona",
  "ella", "fama", "gota", "hielo", "ibis", "judo", "lupa", "mora",
  "nata", "ogro", "pino", "ruta", "silo", "tuna", "unir", "vela",
];

export function generateRecoveryKey() {
  const words = [];
  const indices = randomBytes(24);
  for (let i = 0; i < 24; i++) {
    words.push(WORDLIST[indices[i] % WORDLIST.length]);
  }
  return words.join(" ");
}

// ============================================
// Registration: generate master encryption key,
// encrypt it with both master password & recovery key
// ============================================

export async function setupEncryption(masterPassword, recoveryKey) {
  // Generate the actual encryption key (random 256-bit)
  const rawEncryptionKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedKey = await crypto.subtle.exportKey("raw", rawEncryptionKey);
  const keyAsBase64 = bufferToBase64(exportedKey);

  // Encrypt the key with master password
  const masterSalt = randomBytes(16);
  const masterIv = randomBytes(12);
  const masterDerivedKey = await deriveKey(masterPassword, masterSalt);
  const encryptedKeyByMaster = await encrypt(keyAsBase64, masterDerivedKey, masterIv);

  // Encrypt the key with recovery key
  const recoverySalt = randomBytes(16);
  const recoveryIv = randomBytes(12);
  const recoveryDerivedKey = await deriveKey(recoveryKey, recoverySalt);
  const encryptedKeyByRecovery = await encrypt(keyAsBase64, recoveryDerivedKey, recoveryIv);

  return {
    encryptedKeyByMaster,
    encryptedKeyByRecovery,
    masterSalt: bufferToBase64(masterSalt),
    recoverySalt: bufferToBase64(recoverySalt),
    masterIv: bufferToBase64(masterIv),
    recoveryIv: bufferToBase64(recoveryIv),
  };
}

// ============================================
// Unlock vault with master password
// ============================================

export async function unlockWithMaster(masterPassword, profile) {
  const salt = new Uint8Array(base64ToBuffer(profile.master_salt));
  const iv = new Uint8Array(base64ToBuffer(profile.master_iv));
  const derivedKey = await deriveKey(masterPassword, salt);
  const keyBase64 = await decrypt(profile.encrypted_key_by_master, derivedKey, iv);

  const rawKey = base64ToBuffer(keyBase64);
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// ============================================
// Unlock vault with recovery key
// ============================================

export async function unlockWithRecovery(recoveryKey, profile) {
  const salt = new Uint8Array(base64ToBuffer(profile.recovery_salt));
  const iv = new Uint8Array(base64ToBuffer(profile.recovery_iv));
  const derivedKey = await deriveKey(recoveryKey, salt);
  const keyBase64 = await decrypt(profile.encrypted_key_by_recovery, derivedKey, iv);

  const rawKey = base64ToBuffer(keyBase64);
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// ============================================
// Re-encrypt vault key with new master password
// (used during password reset via recovery key)
// ============================================

export async function reEncryptWithNewMaster(newMasterPassword, encryptionKey) {
  const exported = await crypto.subtle.exportKey("raw", encryptionKey);
  const keyAsBase64 = bufferToBase64(exported);

  const masterSalt = randomBytes(16);
  const masterIv = randomBytes(12);
  const masterDerivedKey = await deriveKey(newMasterPassword, masterSalt);
  const encryptedKeyByMaster = await encrypt(keyAsBase64, masterDerivedKey, masterIv);

  return {
    encryptedKeyByMaster,
    masterSalt: bufferToBase64(masterSalt),
    masterIv: bufferToBase64(masterIv),
  };
}

// ============================================
// Encrypt/decrypt individual password entries
// ============================================

export async function encryptField(text, encryptionKey) {
  if (!text) return null;
  const iv = randomBytes(12);
  const encrypted = await encrypt(text, encryptionKey, iv);
  return bufferToBase64(iv) + ":" + encrypted;
}

export async function decryptField(stored, encryptionKey) {
  if (!stored) return "";
  const [ivB64, encryptedB64] = stored.split(":");
  const iv = new Uint8Array(base64ToBuffer(ivB64));
  return decrypt(encryptedB64, encryptionKey, iv);
}

// ============================================
// Password generator
// ============================================

export function generatePassword(length = 20, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = "";
  if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (numbers) chars += "0123456789";
  if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const array = randomBytes(length);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}
