/**
 * Encryption Module for Medical Data (LGPD Compliance)
 *
 * Encrypts sensitive medical data (prescriptions) before storage
 * Uses AES-256 encryption with crypto-js
 *
 * ⚠️ SECURITY REQUIREMENTS:
 * - ENCRYPTION_KEY must be stored in environment variable
 * - Key should be 256-bit (32 bytes) minimum
 * - Rotate key periodically (recommended: annually)
 * - Never commit key to version control
 */

import CryptoJS from 'crypto-js';

/**
 * Get encryption key from environment
 * Falls back to default key in development ONLY
 */
function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'ENCRYPTION_KEY environment variable is required in production. ' +
                'Generate a secure key: openssl rand -base64 32'
            );
        }

        // Development fallback - NOT FOR PRODUCTION
        console.warn('⚠️ Using default encryption key in development. Set ENCRYPTION_KEY in production!');
        return 'dev-key-DO-NOT-USE-IN-PRODUCTION-32chars-minimum';
    }

    // Validate key length
    if (key.length < 32) {
        throw new Error(
            'ENCRYPTION_KEY must be at least 32 characters for AES-256. ' +
            'Current length: ' + key.length
        );
    }

    return key;
}

/**
 * Encrypt sensitive data using AES-256
 *
 * @param data - Plain text data to encrypt (will be JSON stringified)
 * @returns Base64 encoded encrypted string
 *
 * @example
 * ```typescript
 * const lensData = {
 *   rightEye: { sphere: -2.5 },
 *   leftEye: { sphere: -2.0 },
 *   prescriptionDate: '2024-01-15'
 * };
 * const encrypted = encrypt(lensData);
 * // Returns: "U2FsdGVkX1+..."
 * ```
 */
export function encrypt(data: any): string {
    try {
        // Convert data to JSON string
        const jsonString = JSON.stringify(data);

        // Encrypt using AES with key
        const encrypted = CryptoJS.AES.encrypt(
            jsonString,
            getEncryptionKey()
        ).toString();

        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data. Check encryption key configuration.');
    }
}

/**
 * Decrypt encrypted data
 *
 * @param encryptedData - Base64 encoded encrypted string
 * @returns Decrypted data (parsed from JSON)
 *
 * @example
 * ```typescript
 * const encrypted = "U2FsdGVkX1+...";
 * const lensData = decrypt(encrypted);
 * // Returns: { rightEye: { sphere: -2.5 }, ... }
 * ```
 */
export function decrypt(encryptedData: string): any {
    try {
        // Decrypt using AES with key
        const decryptedBytes = CryptoJS.AES.decrypt(
            encryptedData,
            getEncryptionKey()
        );

        // Convert bytes to string
        const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            throw new Error('Decryption resulted in empty string. Wrong key or corrupted data.');
        }

        // Parse JSON
        const data = JSON.parse(decryptedString);

        return data;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data. Data may be corrupted or key is incorrect.');
    }
}

/**
 * Encrypt medical prescription data specifically
 *
 * @param prescriptionData - Lens prescription data
 * @returns Encrypted prescription string
 */
export function encryptPrescription(prescriptionData: {
    type: string;
    brand?: string;
    rightEye: any;
    leftEye: any;
    prescriptionDate?: string | Date;
    doctorCRM?: string;
    doctorName?: string;
}): string {
    // Sanitize data before encryption (remove undefined values)
    const sanitized = {
        type: prescriptionData.type,
        ...(prescriptionData.brand && { brand: prescriptionData.brand }),
        rightEye: prescriptionData.rightEye,
        leftEye: prescriptionData.leftEye,
        ...(prescriptionData.prescriptionDate && {
            prescriptionDate: prescriptionData.prescriptionDate
        }),
        ...(prescriptionData.doctorCRM && { doctorCRM: prescriptionData.doctorCRM }),
        ...(prescriptionData.doctorName && { doctorName: prescriptionData.doctorName })
    };

    return encrypt(sanitized);
}

/**
 * Decrypt medical prescription data
 *
 * @param encryptedPrescription - Encrypted prescription string
 * @returns Decrypted prescription data
 */
export function decryptPrescription(encryptedPrescription: string): any {
    return decrypt(encryptedPrescription);
}

/**
 * Hash sensitive data for comparison without revealing original value
 * Useful for validating CPF/CNPJ without storing plain text
 *
 * @param data - Data to hash
 * @returns SHA-256 hash (hex string)
 */
export function hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
}

/**
 * Verify hashed data matches original
 *
 * @param data - Original data
 * @param hash - Hash to compare against
 * @returns True if data matches hash
 */
export function verifyHash(data: string, hash: string): boolean {
    return hashData(data) === hash;
}

/**
 * Generate a secure random encryption key
 * For use in generating ENCRYPTION_KEY value
 *
 * @returns 256-bit random key in base64
 *
 * @example
 * ```typescript
 * // Run this once to generate a key for your .env file
 * console.log('ENCRYPTION_KEY=' + generateKey());
 * ```
 */
export function generateKey(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(32); // 256 bits
    return CryptoJS.enc.Base64.stringify(randomBytes);
}

/**
 * Utility: Check if encryption is properly configured
 *
 * @returns Configuration status
 */
export function checkEncryptionConfig(): {
    configured: boolean;
    keyLength: number;
    environment: string;
    warnings: string[];
} {
    const warnings: string[] = [];
    let keyLength = 0;

    try {
        const key = process.env.ENCRYPTION_KEY;
        keyLength = key?.length || 0;

        if (!key) {
            warnings.push('ENCRYPTION_KEY not set');
        } else if (keyLength < 32) {
            warnings.push(`Key too short (${keyLength} chars, need 32+)`);
        }

        if (process.env.NODE_ENV === 'production' && !key) {
            warnings.push('⚠️ CRITICAL: No encryption key in production!');
        }

        return {
            configured: warnings.length === 0,
            keyLength,
            environment: process.env.NODE_ENV || 'unknown',
            warnings
        };
    } catch (error) {
        warnings.push('Failed to check configuration: ' + error);
        return {
            configured: false,
            keyLength: 0,
            environment: process.env.NODE_ENV || 'unknown',
            warnings
        };
    }
}

/**
 * Test encryption/decryption roundtrip
 * Used for validation during setup
 *
 * @returns True if encryption is working correctly
 */
export function testEncryption(): boolean {
    try {
        const testData = {
            test: 'medical data',
            sensitive: true,
            timestamp: new Date().toISOString()
        };

        const encrypted = encrypt(testData);
        const decrypted = decrypt(encrypted);

        return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
        console.error('Encryption test failed:', error);
        return false;
    }
}
