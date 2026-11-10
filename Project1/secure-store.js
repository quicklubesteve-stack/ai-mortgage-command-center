/**
 * Secure Storage Module for AI Mortgage Assistant
 * Uses Electron's native safeStorage (Windows DPAPI) to protect API keys & credentials.
 */

const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');

let storeFilePath = null;
let cachedSettings = null;

const DEFAULT_SETTINGS = {
  humanOfficerName: 'Steve',
  humanOfficerTitle: 'Lead Mortgage Underwriter',
  humanOfficerNmlsId: 'NMLS-1948210',
  humanOfficerEmail: 'steve@apexmortgage.com',
  conformingLoanLimit: 766550,
  maxConventionalDti: 43.0,
  maxFhaDti: 50.0,
  minConventionalFico: 620,
  minFhaFico: 580,
  // Encrypted credentials / optional external integrations
  optimalBlueApiKey: '',
  pollyMarketplaceApiKey: '',
  encompassClientId: '',
  encompassClientSecret: '',
  twilioAccountSid: '',
  twilioAuthToken: ''
};

function initSecureStore(userDataDir) {
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  storeFilePath = path.join(userDataDir, 'secure-vault.enc');

  // Attempt to load existing encrypted vault
  if (fs.existsSync(storeFilePath)) {
    try {
      const encryptedBuffer = fs.readFileSync(storeFilePath);
      let decryptedText = '';
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        decryptedText = safeStorage.decryptString(encryptedBuffer);
      } else {
        // Fallback for non-DPAPI environments
        decryptedText = Buffer.from(encryptedBuffer).toString('utf8');
      }
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(decryptedText) };
      return cachedSettings;
    } catch (err) {
      console.warn('[SecureStore] Could not decrypt vault, initializing defaults:', err.message);
    }
  }

  // First-time setup: initialize defaults from process.env if present
  cachedSettings = {
    ...DEFAULT_SETTINGS,
    humanOfficerName: process.env.HUMAN_OFFICER_NAME || DEFAULT_SETTINGS.humanOfficerName,
    humanOfficerNmlsId: process.env.HUMAN_OFFICER_NMLS_ID || DEFAULT_SETTINGS.humanOfficerNmlsId,
    humanOfficerEmail: process.env.HUMAN_OFFICER_EMAIL || DEFAULT_SETTINGS.humanOfficerEmail,
    conformingLoanLimit: Number(process.env.CONFORMING_LOAN_LIMIT) || DEFAULT_SETTINGS.conformingLoanLimit
  };

  saveSettings(cachedSettings);
  return cachedSettings;
}

function getSettings() {
  if (!cachedSettings) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...cachedSettings };
}

function saveSettings(newSettings) {
  cachedSettings = { ...cachedSettings, ...newSettings };
  if (!storeFilePath) return false;

  try {
    const rawJson = JSON.stringify(cachedSettings, null, 2);
    let bufferToWrite;
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      bufferToWrite = safeStorage.encryptString(rawJson);
    } else {
      bufferToWrite = Buffer.from(rawJson, 'utf8');
    }
    fs.writeFileSync(storeFilePath, bufferToWrite);
    return true;
  } catch (err) {
    console.error('[SecureStore] Failed to save settings to vault:', err.message);
    return false;
  }
}

function isEncryptionActive() {
  return safeStorage ? safeStorage.isEncryptionAvailable() : false;
}

module.exports = {
  initSecureStore,
  getSettings,
  saveSettings,
  isEncryptionActive,
  DEFAULT_SETTINGS
};
