import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'AE-49-XX-001-SECURE-KEY-FOR-OFFLINE';

export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed', error);
    return '';
  }
};

export const decryptData = (encryptedText: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed', error);
    return null;
  }
};

export const saveOfflineData = (key: string, data: any) => {
  const encrypted = encryptData(data);
  if (encrypted) {
    localStorage.setItem(`encrypted_offline_${key}`, encrypted);
  }
};

export const getOfflineData = (key: string) => {
  const encrypted = localStorage.getItem(`encrypted_offline_${key}`);
  if (!encrypted) return null;
  return decryptData(encrypted);
};
