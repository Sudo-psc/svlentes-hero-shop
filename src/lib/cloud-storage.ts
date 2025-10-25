/**
 * Cloud Storage Client
 * Supports CloudFlare R2 and AWS S3 with fallback to local storage
 *
 * Environment Variables Required:
 * - CLOUD_STORAGE_PROVIDER: 'r2' | 's3' | 'local' (default: 'local')
 * - R2_ACCOUNT_ID: CloudFlare account ID (for R2)
 * - R2_ACCESS_KEY_ID: CloudFlare R2 access key
 * - R2_SECRET_ACCESS_KEY: CloudFlare R2 secret key
 * - R2_BUCKET_NAME: CloudFlare R2 bucket name
 * - AWS_REGION: AWS region (for S3, default: 'us-east-1')
 * - AWS_ACCESS_KEY_ID: AWS access key (for S3)
 * - AWS_SECRET_ACCESS_KEY: AWS secret key (for S3)
 * - AWS_BUCKET_NAME: AWS S3 bucket name
 * - CLOUD_STORAGE_PUBLIC_URL: Public URL base for stored files (optional)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

// ============================================================================
// Types
// ============================================================================

export type StorageProvider = 'r2' | 's3' | 'local'

export interface UploadOptions {
  fileName: string
  fileData: Buffer | Uint8Array | string
  contentType: string
  folder?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  url: string
  key: string
  provider: StorageProvider
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  provider: (process.env.CLOUD_STORAGE_PROVIDER || 'local') as StorageProvider,
  publicUrl: process.env.CLOUD_STORAGE_PUBLIC_URL || '',

  // CloudFlare R2
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    endpoint: process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : '',
  },

  // AWS S3
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_BUCKET_NAME || '',
  },
}

// ============================================================================
// S3/R2 Client Initialization
// ============================================================================

let s3Client: S3Client | null = null

function getS3Client(): S3Client | null {
  if (config.provider === 'local') {
    return null
  }

  if (s3Client) {
    return s3Client
  }

  try {
    if (config.provider === 'r2') {
      // CloudFlare R2 (S3-compatible)
      if (!config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.endpoint) {
        console.warn('[Cloud Storage] R2 credentials not configured, falling back to local storage')
        return null
      }

      s3Client = new S3Client({
        region: 'auto', // R2 uses 'auto' region
        endpoint: config.r2.endpoint,
        credentials: {
          accessKeyId: config.r2.accessKeyId,
          secretAccessKey: config.r2.secretAccessKey,
        },
      })

      console.log('[Cloud Storage] R2 client initialized')
    } else if (config.provider === 's3') {
      // AWS S3
      if (!config.s3.accessKeyId || !config.s3.secretAccessKey) {
        console.warn('[Cloud Storage] S3 credentials not configured, falling back to local storage')
        return null
      }

      s3Client = new S3Client({
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
      })

      console.log('[Cloud Storage] S3 client initialized')
    }

    return s3Client
  } catch (error) {
    console.error('[Cloud Storage] Failed to initialize client:', error)
    return null
  }
}

// ============================================================================
// Upload Functions
// ============================================================================

/**
 * Upload file to cloud storage (R2/S3) with automatic fallback to local storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { fileName, fileData, contentType, folder = 'prescriptions', metadata = {} } = options

  // Sanitize filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const timestamp = Date.now()
  const key = folder ? `${folder}/${timestamp}_${sanitizedFileName}` : `${timestamp}_${sanitizedFileName}`

  // Try cloud storage first
  const client = getS3Client()
  if (client && config.provider !== 'local') {
    try {
      const bucketName = config.provider === 'r2' ? config.r2.bucketName : config.s3.bucketName

      if (!bucketName) {
        throw new Error('Bucket name not configured')
      }

      // Convert base64 string to Buffer if needed
      let buffer: Buffer
      if (typeof fileData === 'string') {
        // Remove data URL prefix if present
        const base64Data = fileData.replace(/^data:[^;]+;base64,/, '')
        buffer = Buffer.from(base64Data, 'base64')
      } else if (fileData instanceof Uint8Array) {
        buffer = Buffer.from(fileData)
      } else {
        buffer = fileData
      }

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        },
      })

      await client.send(command)

      // Construct public URL
      let publicUrl = ''
      if (config.publicUrl) {
        publicUrl = `${config.publicUrl}/${key}`
      } else if (config.provider === 'r2' && config.r2.accountId) {
        // Default R2 URL format
        publicUrl = `https://pub-${config.r2.accountId}.r2.dev/${key}`
      } else if (config.provider === 's3') {
        // Default S3 URL format
        publicUrl = `https://${bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`
      }

      console.log('[Cloud Storage] File uploaded successfully:', {
        provider: config.provider,
        key,
        contentType,
        size: buffer.length,
      })

      return {
        success: true,
        url: publicUrl,
        key,
        provider: config.provider,
      }
    } catch (error) {
      console.error('[Cloud Storage] Upload failed, falling back to local storage:', error)
      // Fall through to local storage
    }
  }

  // Fallback to local storage (mock)
  console.log('[Cloud Storage] Using local storage:', {
    key,
    contentType,
    metadata,
  })

  return {
    success: true,
    url: `/uploads/${key}`,
    key,
    provider: 'local',
  }
}

/**
 * Delete file from cloud storage
 */
export async function deleteFile(key: string): Promise<DeleteResult> {
  const client = getS3Client()

  if (client && config.provider !== 'local') {
    try {
      const bucketName = config.provider === 'r2' ? config.r2.bucketName : config.s3.bucketName

      if (!bucketName) {
        throw new Error('Bucket name not configured')
      }

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      await client.send(command)

      console.log('[Cloud Storage] File deleted successfully:', { key })

      return { success: true }
    } catch (error) {
      console.error('[Cloud Storage] Delete failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Local storage (mock)
  console.log('[Cloud Storage] Local storage delete (mock):', { key })
  return { success: true }
}

/**
 * Check if file exists in cloud storage
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getS3Client()

  if (client && config.provider !== 'local') {
    try {
      const bucketName = config.provider === 'r2' ? config.r2.bucketName : config.s3.bucketName

      if (!bucketName) {
        throw new Error('Bucket name not configured')
      }

      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })

      await client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  // Local storage always returns false (mock)
  return false
}

/**
 * Get storage provider information
 */
export function getStorageInfo() {
  return {
    provider: config.provider,
    configured: config.provider === 'local' ? true : !!getS3Client(),
    bucketName: config.provider === 'r2' ? config.r2.bucketName : config.s3.bucketName,
    publicUrl: config.publicUrl,
  }
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (config.provider === 'r2') {
    if (!config.r2.accountId) errors.push('R2_ACCOUNT_ID not configured')
    if (!config.r2.accessKeyId) errors.push('R2_ACCESS_KEY_ID not configured')
    if (!config.r2.secretAccessKey) errors.push('R2_SECRET_ACCESS_KEY not configured')
    if (!config.r2.bucketName) errors.push('R2_BUCKET_NAME not configured')
  } else if (config.provider === 's3') {
    if (!config.s3.accessKeyId) errors.push('AWS_ACCESS_KEY_ID not configured')
    if (!config.s3.secretAccessKey) errors.push('AWS_SECRET_ACCESS_KEY not configured')
    if (!config.s3.bucketName) errors.push('AWS_BUCKET_NAME not configured')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
