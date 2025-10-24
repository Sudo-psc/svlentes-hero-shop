# 📄 Prescription Management Guide

> **Complete medical compliance and prescription lifecycle management**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-24
> **Version**: 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Medical Compliance](#medical-compliance)
- [File Upload System](#file-upload-system)
- [Validation Rules](#validation-rules)
- [Storage Architecture](#storage-architecture)
- [Security Considerations](#security-considerations)
- [API Reference](#api-reference)
- [Error Scenarios](#error-scenarios)
- [Component Guide](#component-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Prescription Management system provides comprehensive medical compliance for contact lens prescriptions, ensuring adherence to Brazilian healthcare regulations (CFM) and LGPD data protection laws.

### Key Features

- 📄 **Multi-format upload**: PDF, JPG, PNG (max 5MB)
- ✅ **Medical validation**: Sphere, cylinder, axis, addition ranges
- 📅 **Expiry tracking**: Automatic 1-year validity (CFM compliance)
- 🔔 **Proactive alerts**: 30-day expiry warnings
- 📜 **Complete history**: All previous prescriptions accessible
- 🔐 **Secure storage**: Encrypted at rest and in transit
- 👁️ **Visual preview**: Prescription image display
- 📱 **Mobile-optimized**: Responsive design for all devices

### User Benefits

- **Never miss renewal**: Automatic expiry tracking and alerts
- **Digital access**: Prescription always available in dashboard
- **Medical compliance**: Guaranteed adherence to CFM regulations
- **Error prevention**: Automatic validation prevents data entry mistakes
- **Complete history**: Track prescription changes over time

---

## Medical Compliance

### CFM Regulations (Conselho Federal de Medicina)

**Contact Lens Prescription Requirements**:

1. **Validity Period**: Exactly **1 year from issue date**
   - Issue date → Expiry date (1 year later)
   - No grace periods allowed
   - Renewal consultation required after expiry

2. **Required Information**:
   - Patient full name
   - Doctor's name and CRM number
   - Issue date (data de emissão)
   - Expiry date (data de validade)
   - Prescription details (graus) for each eye
   - Doctor's signature (for physical prescriptions)

3. **Prescription Grading**:
   - Must include sphere for both eyes
   - Cylinder and axis if astigmatism present
   - Addition for multifocal/progressive lenses (if applicable)
   - All values in diopters (D)

**Legal Framework**:
- CFM Resolution 2.171/2017 - Telemedicine regulations
- CFM Resolution 1.931/2009 - Medical ethics code
- Law 13.709/2018 - LGPD (Brazilian data protection law)

### LGPD Compliance

**Data Protection Requirements**:

1. **Explicit Consent**:
```typescript
const consentRequired = {
  purpose: 'Armazenamento e gerenciamento de receita médica',
  dataTypes: [
    'Prescrição de lentes de contato',
    'Dados oftalmológicos (graus)',
    'Informações do médico prescritor'
  ],
  retention: '5 anos após término da assinatura',
  sharing: 'Não compartilhamos seus dados com terceiros'
}
```

2. **User Rights**:
   - Right to access (visualizar receita)
   - Right to correction (atualizar dados)
   - Right to deletion (solicitar exclusão)
   - Right to portability (baixar PDF)

3. **Audit Trail**:
```sql
-- Log all prescription access
INSERT INTO audit_logs (
  action,
  userId,
  resourceType,
  resourceId,
  timestamp,
  ipAddress
) VALUES (
  'PRESCRIPTION_VIEW',
  'usr_abc123',
  'Prescription',
  'prx_xyz789',
  NOW(),
  '192.168.1.1'
)
```

4. **Data Retention**:
   - Active subscriptions: Indefinite retention
   - Cancelled < 5 years: Full retention
   - Cancelled > 5 years: Archive to cold storage
   - User deletion request: Immediate removal with audit log

### Medical Validation

**Prescription Authenticity Checks**:

1. **CRM Validation**:
```typescript
const validateCRM = (crm: string): boolean => {
  // Format: UF + 4-6 digits
  // Examples: MG 69870, SP 123456
  const crmRegex = /^[A-Z]{2}\s?\d{4,6}$/

  if (!crmRegex.test(crm)) {
    return false
  }

  // Optional: Check against CRM database API
  // (requires integration with CFM/CRM APIs)

  return true
}
```

2. **Date Validation**:
```typescript
const validatePrescriptionDates = (
  issueDate: Date,
  expiryDate: Date
): ValidationResult => {
  // Issue date cannot be in the future
  if (issueDate > new Date()) {
    return { valid: false, error: 'Data de emissão não pode ser futura' }
  }

  // Expiry must be exactly 1 year after issue
  const expectedExpiry = new Date(issueDate)
  expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 1)

  if (expiryDate.getTime() !== expectedExpiry.getTime()) {
    return {
      valid: false,
      error: 'Validade deve ser exatamente 1 ano após emissão'
    }
  }

  return { valid: true }
}
```

3. **Grading Validation**:
   - See [Validation Rules](#validation-rules) section for detailed ranges

---

## File Upload System

### Accepted File Formats

**PDF (Recommended)**:
- Best for scanned prescriptions
- Maintains high quality
- Smaller file sizes
- Vector graphics support
- Max size: 5MB

**JPG/JPEG**:
- Good for photos of physical prescriptions
- Compressed format (lossy)
- Widely supported
- Max size: 5MB
- Recommended resolution: 1200x1600px minimum

**PNG**:
- Best for screenshots
- Lossless compression
- Larger file sizes than JPG
- Supports transparency
- Max size: 5MB

### File Size Constraints

**Maximum File Size**: 5MB (5,242,880 bytes)

**Rationale**:
- Balance between quality and upload speed
- Prevent DoS attacks via large uploads
- Reasonable for mobile network uploads
- Sufficient for high-quality prescription scans

**Compression Recommendations**:
```bash
# For images larger than 5MB, compress before upload

# Using ImageMagick
convert large-prescription.jpg -quality 85 -resize 1600x1600\> prescription.jpg

# Using PDF tools
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=prescription-compressed.pdf prescription-original.pdf
```

### Upload Quality Guidelines

**For Photos** (physical prescription):
- Use good lighting (avoid shadows and glare)
- Hold camera parallel to prescription (no angles)
- Include entire prescription in frame
- Use highest camera quality setting
- Minimum resolution: 1200x1600px
- Focus clearly on text

**For Scans**:
- Scan at 300 DPI minimum
- Use color or grayscale mode
- Crop to prescription boundaries
- Save as PDF for best quality
- Ensure text is readable when zoomed

**Common Issues**:
- ❌ Blurry text (use better focus/lighting)
- ❌ Shadows/glare (adjust lighting angle)
- ❌ Cropped information (include full prescription)
- ❌ Low resolution (use higher DPI/camera quality)

### Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Prescription Upload Flow                  │
└─────────────────────────────────────────────────────────────┘

1. User selects file via input or drag-and-drop
          ↓
2. Client-side validation
   ├─ Check file size ≤ 5MB
   ├─ Check format: PDF/JPG/PNG
   └─ Display preview thumbnail
          ↓
3. User enters prescription data
   ├─ Left eye (sphere, cylinder, axis)
   ├─ Right eye (sphere, cylinder, axis)
   ├─ Doctor CRM
   └─ Issue date
          ↓
4. Client-side data validation
   ├─ Validate grading ranges
   ├─ Validate CRM format
   └─ Validate dates
          ↓
5. Multipart POST to /api/assinante/prescription
   ├─ File: FormData with file binary
   └─ Data: JSON with prescription details
          ↓
6. Server-side validation
   ├─ Authenticate user (Firebase token)
   ├─ Verify file size and format
   ├─ Malware scan (ClamAV or similar)
   ├─ Validate prescription data
   └─ Check rate limits (10/hour)
          ↓
7. Store file in S3/local storage
   ├─ Generate unique filename
   ├─ Encrypt file (AES-256)
   ├─ Store in user's folder
   └─ Create thumbnail (JPG, 200px width)
          ↓
8. Save metadata to database (Prisma)
   ├─ Insert Prescription record
   ├─ Link to User
   └─ Store file URL and metadata
          ↓
9. Return response
   ├─ Success: 201 with prescription ID & URL
   └─ Error: Appropriate error code & message
          ↓
10. Client updates UI
    ├─ Show success toast
    ├─ Display new prescription
    └─ Refresh prescription list
```

### Multipart Form-Data Implementation

**Client-side** (React):
```typescript
const handleFileUpload = async (
  file: File,
  prescriptionData: PrescriptionData
) => {
  const formData = new FormData()

  // Append file
  formData.append('file', file)

  // Append prescription data as JSON string
  formData.append('prescriptionData', JSON.stringify({
    leftEye: {
      sphere: -2.50,
      cylinder: -0.75,
      axis: 180
    },
    rightEye: {
      sphere: -3.00,
      cylinder: -1.00,
      axis: 90
    },
    doctorCRM: 'MG 69870',
    issueDate: '2024-10-24T00:00:00.000Z'
  }))

  // Upload with progress tracking
  const response = await fetch('/api/assinante/prescription', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // DO NOT set Content-Type - browser will set it with boundary
    },
    body: formData,
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      setUploadProgress(percentCompleted)
    }
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return await response.json()
}
```

**Server-side** (Next.js API):
```typescript
// src/app/api/assinante/prescription/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form-data
    const formData = await request.formData()

    // Extract file
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Extract prescription data
    const prescriptionDataStr = formData.get('prescriptionData') as string
    const prescriptionData = JSON.parse(prescriptionDataStr)

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: 'Arquivo muito grande. Tamanho máximo: 5MB',
          maxSize
        },
        { status: 400 }
      )
    }

    const validFormats = ['application/pdf', 'image/jpeg', 'image/png']
    if (!validFormats.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'INVALID_FORMAT',
          message: 'Formato não suportado. Use PDF, JPG ou PNG.',
          supportedFormats: validFormats
        },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const userId = 'usr_abc123' // Get from authenticated user
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `prescription_${userId}_${timestamp}.${extension}`

    // Store file (example: local filesystem)
    const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions', userId)
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Save to database
    const prescription = await prisma.prescription.create({
      data: {
        userId: userId,
        fileUrl: `/uploads/prescriptions/${userId}/${filename}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        leftEye: prescriptionData.leftEye,
        rightEye: prescriptionData.rightEye,
        doctorCRM: prescriptionData.doctorCRM,
        issueDate: new Date(prescriptionData.issueDate),
        expiryDate: new Date(
          new Date(prescriptionData.issueDate).setFullYear(
            new Date(prescriptionData.issueDate).getFullYear() + 1
          )
        ),
        status: 'VALID'
      }
    })

    return NextResponse.json(
      {
        success: true,
        prescription: {
          id: prescription.id,
          fileUrl: prescription.fileUrl,
          expiryDate: prescription.expiryDate
        },
        message: 'Receita enviada com sucesso!'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
```

---

## Validation Rules

### Sphere (Grau Esférico)

**Purpose**: Corrects nearsightedness (myopia) or farsightedness (hyperopia).

**Range**: -20.00 to +20.00 diopters
**Step**: 0.25 diopters
**Format**: Decimal with 2 decimal places

**Examples**:
- `-2.50` - Mild myopia
- `+1.75` - Mild hyperopia
- `0.00` - No spherical correction (plano)
- `-8.00` - Moderate to severe myopia

**Validation**:
```typescript
const sphereSchema = z
  .number()
  .min(-20.00, 'Grau esférico mínimo: -20.00')
  .max(+20.00, 'Grau esférico máximo: +20.00')
  .step(0.25, 'Grau esférico deve ser múltiplo de 0.25')
  .refine(
    (val) => (val * 4) % 1 === 0,
    'Grau esférico inválido. Use múltiplos de 0.25'
  )
```

**Common Ranges**:
- Mild myopia: -0.25 to -3.00
- Moderate myopia: -3.25 to -6.00
- Severe myopia: -6.25 to -20.00
- Mild hyperopia: +0.25 to +2.00
- Moderate hyperopia: +2.25 to +5.00

### Cylinder (Grau Cilíndrico)

**Purpose**: Corrects astigmatism (irregular cornea curvature).

**Range**: -6.00 to +6.00 diopters
**Step**: 0.25 diopters
**Format**: Decimal with 2 decimal places
**Optional**: Can be 0.00 if no astigmatism

**Examples**:
- `-0.75` - Mild astigmatism
- `-2.00` - Moderate astigmatism
- `0.00` - No astigmatism (optional field)

**Validation**:
```typescript
const cylinderSchema = z
  .number()
  .min(-6.00, 'Grau cilíndrico mínimo: -6.00')
  .max(+6.00, 'Grau cilíndrico máximo: +6.00')
  .step(0.25, 'Grau cilíndrico deve ser múltiplo de 0.25')
  .optional()
  .default(0.00)
```

**Important**:
- If cylinder ≠ 0.00, axis MUST be provided
- If cylinder = 0.00, axis should be ignored

### Axis (Eixo)

**Purpose**: Defines the angle of astigmatism correction.

**Range**: 0° to 180°
**Step**: 1°
**Format**: Integer (whole degrees)
**Required**: Only if cylinder ≠ 0.00

**Examples**:
- `90` - Vertical astigmatism
- `180` - Horizontal astigmatism
- `45` - Oblique astigmatism

**Validation**:
```typescript
const axisSchema = z
  .number()
  .int('Eixo deve ser número inteiro')
  .min(0, 'Eixo mínimo: 0°')
  .max(180, 'Eixo máximo: 180°')
  .optional()

// Conditional validation
const eyeSchema = z.object({
  sphere: sphereSchema,
  cylinder: cylinderSchema,
  axis: axisSchema
}).refine(
  (data) => {
    // If cylinder ≠ 0, axis is required
    if (data.cylinder && data.cylinder !== 0) {
      return data.axis !== undefined
    }
    return true
  },
  {
    message: 'Eixo obrigatório quando cilindro não é zero',
    path: ['axis']
  }
)
```

### Addition (Adição)

**Purpose**: Additional magnification for reading (multifocal/progressive lenses).

**Range**: +0.75 to +3.50 diopters
**Step**: 0.25 diopters
**Format**: Decimal with 2 decimal places (always positive)
**Optional**: Only for multifocal/progressive lenses

**Examples**:
- `+1.00` - Mild presbyopia (age 40-45)
- `+2.00` - Moderate presbyopia (age 50-55)
- `+3.00` - Severe presbyopia (age 60+)

**Validation**:
```typescript
const additionSchema = z
  .number()
  .min(0.75, 'Adição mínima: +0.75')
  .max(3.50, 'Adição máxima: +3.50')
  .step(0.25, 'Adição deve ser múltiplo de 0.25')
  .positive('Adição deve ser positiva')
  .optional()
```

**Note**: Addition is typically the same for both eyes.

### Complete Validation Schema

```typescript
import { z } from 'zod'

const EyePrescriptionSchema = z.object({
  sphere: z
    .number()
    .min(-20.00)
    .max(+20.00)
    .step(0.25),

  cylinder: z
    .number()
    .min(-6.00)
    .max(+6.00)
    .step(0.25)
    .optional()
    .default(0.00),

  axis: z
    .number()
    .int()
    .min(0)
    .max(180)
    .optional(),

  addition: z
    .number()
    .min(0.75)
    .max(3.50)
    .step(0.25)
    .positive()
    .optional()
}).refine(
  (data) => {
    // If cylinder ≠ 0, axis is required
    if (data.cylinder && data.cylinder !== 0) {
      return data.axis !== undefined && data.axis !== null
    }
    return true
  },
  {
    message: 'Eixo obrigatório quando cilindro não é zero',
    path: ['axis']
  }
)

const PrescriptionSchema = z.object({
  leftEye: EyePrescriptionSchema,
  rightEye: EyePrescriptionSchema,

  doctorCRM: z
    .string()
    .regex(
      /^[A-Z]{2}\s?\d{4,6}$/,
      'CRM inválido. Use formato: MG 69870'
    ),

  issueDate: z
    .string()
    .datetime('Data de emissão inválida'),

  expiryDate: z
    .string()
    .datetime('Data de validade inválida')
}).refine(
  (data) => {
    const issue = new Date(data.issueDate)
    const expiry = new Date(data.expiryDate)

    // Expiry must be exactly 1 year after issue
    const expectedExpiry = new Date(issue)
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 1)

    return expiry.getTime() === expectedExpiry.getTime()
  },
  {
    message: 'Validade deve ser exatamente 1 ano após emissão',
    path: ['expiryDate']
  }
)

export type PrescriptionData = z.infer<typeof PrescriptionSchema>
```

---

## Storage Architecture

### File Organization

**Storage Hierarchy**:
```
storage/
└── prescriptions/
    └── {userId}/
        ├── prescription_1698067200_original.pdf
        ├── prescription_1698067200_thumbnail.jpg
        ├── prescription_1698067200_metadata.json
        ├── prescription_1730000000_original.jpg
        └── prescription_1730000000_thumbnail.jpg
```

**Folder Structure**:
- **Root**: `storage/prescriptions/`
- **User folder**: `{userId}/` (isolates user data)
- **File naming**: `prescription_{timestamp}_{type}.{ext}`

### Filename Convention

**Pattern**: `prescription_{userId}_{timestamp}_{type}.{extension}`

**Components**:
- `prescription_`: Fixed prefix
- `{userId}`: User unique identifier (e.g., `usr_abc123`)
- `{timestamp}`: Unix timestamp (e.g., `1698067200`)
- `{type}`: File variant (`original`, `thumbnail`, `metadata`)
- `{extension}`: File format (`pdf`, `jpg`, `png`, `json`)

**Examples**:
```
prescription_usr_abc123_1698067200_original.pdf
prescription_usr_abc123_1698067200_thumbnail.jpg
prescription_usr_abc123_1698067200_metadata.json
```

**Benefits**:
- Unique filenames (no collisions)
- Easy sorting by timestamp
- User isolation for security
- Variant identification (original vs thumbnail)

### File Variants

**Original**:
- User's uploaded file (unchanged)
- Full resolution and quality
- Encrypted at rest
- Used for downloads and review

**Thumbnail**:
- Automatically generated JPG
- Width: 200px (maintains aspect ratio)
- Quality: 80%
- Used for preview in dashboard

**Metadata** (JSON):
```json
{
  "userId": "usr_abc123",
  "originalFilename": "receita-dr-philipe.pdf",
  "uploadedAt": "2025-10-24T10:30:00.000Z",
  "fileSize": 1234567,
  "mimeType": "application/pdf",
  "prescription": {
    "leftEye": { "sphere": -2.50, "cylinder": -0.75, "axis": 180 },
    "rightEye": { "sphere": -3.00, "cylinder": -1.00, "axis": 90 },
    "doctorCRM": "MG 69870",
    "issueDate": "2024-10-24T00:00:00.000Z",
    "expiryDate": "2025-10-24T00:00:00.000Z"
  },
  "ocrText": "RECEITA MÉDICA\nDr. Philipe Saraiva Cruz\nCRM-MG 69.870\n...",
  "checksumMD5": "abc123def456..."
}
```

### Storage Backends

**Local Filesystem**:
```typescript
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

async function saveToLocalStorage(
  file: Buffer,
  userId: string,
  filename: string
): Promise<string> {
  const uploadDir = path.join(
    process.cwd(),
    'storage',
    'prescriptions',
    userId
  )

  // Create directory if not exists
  await mkdir(uploadDir, { recursive: true })

  // Write file
  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, file)

  // Return URL
  return `/storage/prescriptions/${userId}/${filename}`
}
```

**AWS S3** (Production):
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function saveToS3(
  file: Buffer,
  userId: string,
  filename: string
): Promise<string> {
  const key = `prescriptions/${userId}/${filename}`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: 'application/pdf', // or detect from file
    ServerSideEncryption: 'AES256', // Encrypt at rest
    ACL: 'private' // No public access
  })

  await s3.send(command)

  // Return CloudFront URL or S3 URL
  return `https://${process.env.CDN_DOMAIN}/${key}`
}
```

### Retention Policy

**Active Subscriptions**:
- Keep all prescriptions indefinitely
- No automatic deletion
- User can delete manually

**Cancelled Subscriptions**:
- < 5 years: Full retention in hot storage
- \> 5 years: Archive to cold storage (S3 Glacier)
- \> 10 years: Eligible for deletion (with user consent)

**User Deletion Requests**:
- Immediate removal from active storage
- Move to quarantine (30-day grace period)
- Permanent deletion after 30 days
- Audit log retained (LGPD requirement)

**Backup Schedule**:
```yaml
daily_backup:
  schedule: "0 2 * * *"  # 2 AM daily
  type: incremental
  retention: 7 days

weekly_backup:
  schedule: "0 3 * * 0"  # 3 AM Sunday
  type: full
  retention: 4 weeks

monthly_backup:
  schedule: "0 4 1 * *"  # 4 AM 1st of month
  type: full
  retention: 12 months
```

---

## Security Considerations

### Upload Security

**File Validation**:
```typescript
// Validate MIME type (don't trust client)
import { fileTypeFromBuffer } from 'file-type'

async function validateFileType(buffer: Buffer): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType) {
    throw new Error('Tipo de arquivo não detectado')
  }

  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]

  return allowedMimes.includes(fileType.mime)
}
```

**Malware Scanning**:
```typescript
// Using ClamAV (example)
import { NodeClam } from 'clamscan'

const clamscan = new NodeClam().init({
  clamdscan: {
    socket: '/var/run/clamav/clamd.sock',
    timeout: 60000
  }
})

async function scanForMalware(filePath: string): Promise<boolean> {
  const { isInfected, viruses } = await clamscan.scanFile(filePath)

  if (isInfected) {
    console.error('Malware detected:', viruses)
    // Delete file
    await unlink(filePath)
    // Log incident
    await logSecurityIncident('MALWARE_DETECTED', { viruses })

    throw new Error('Arquivo contém malware e foi rejeitado')
  }

  return true
}
```

**Size Limits**:
```typescript
// Enforce size limit at multiple layers

// 1. Nginx config
client_max_body_size 6M;  # Slightly higher than app limit

// 2. Next.js API config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb'
    }
  }
}

// 3. Application-level check
if (file.size > 5 * 1024 * 1024) {
  throw new Error('Arquivo muito grande')
}
```

### Storage Security

**Encryption at Rest**:
```typescript
import crypto from 'crypto'

// Encrypt file before storage
async function encryptFile(buffer: Buffer): Promise<Buffer> {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ])

  // Prepend IV for decryption
  return Buffer.concat([iv, encrypted])
}

// Decrypt file for download
async function decryptFile(encryptedBuffer: Buffer): Promise<Buffer> {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

  // Extract IV (first 16 bytes)
  const iv = encryptedBuffer.slice(0, 16)
  const encrypted = encryptedBuffer.slice(16)

  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
}
```

**Encryption in Transit**:
- HTTPS/TLS for all uploads
- Minimum TLS 1.2
- Strong cipher suites only
- Certificate pinning for mobile apps

**Pre-Signed URLs** (S3):
```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key
  })

  return await getSignedUrl(s3, command, { expiresIn })
}

// Usage
const downloadUrl = await generatePresignedUrl(
  `prescriptions/${userId}/${filename}`,
  3600 // Expires in 1 hour
)
```

### Access Control

**Ownership Validation**:
```typescript
async function validatePrescriptionOwnership(
  prescriptionId: string,
  userId: string
): Promise<boolean> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: { userId: true }
  })

  if (!prescription) {
    throw new Error('Prescrição não encontrada')
  }

  if (prescription.userId !== userId) {
    // Log unauthorized access attempt
    await logSecurityIncident('UNAUTHORIZED_ACCESS', {
      prescriptionId,
      attemptedBy: userId,
      ownedBy: prescription.userId
    })

    throw new Error('Acesso negado')
  }

  return true
}
```

**Rate Limiting**:
```typescript
// Using Redis for distributed rate limiting
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `ratelimit:${action}:${userId}`

  const current = await redis.incr(key)

  if (current === 1) {
    // First request in window
    await redis.expire(key, windowSeconds)
  }

  if (current > limit) {
    throw new Error(`Rate limit exceeded for ${action}`)
  }

  return true
}

// Usage
await checkRateLimit(userId, 'prescription_upload', 10, 3600) // 10/hour
```

**Audit Logging**:
```typescript
async function logPrescriptionAccess(
  action: string,
  userId: string,
  prescriptionId: string,
  metadata?: any
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      userId,
      resourceType: 'Prescription',
      resourceId: prescriptionId,
      timestamp: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata
    }
  })
}

// Example audit log query
const accessLogs = await prisma.auditLog.findMany({
  where: {
    resourceType: 'Prescription',
    resourceId: prescriptionId
  },
  orderBy: { timestamp: 'desc' }
})
```

---

## API Reference

Complete API documentation is provided in the [Phase 3 Implementation Guide](./PHASE3_IMPLEMENTATION_GUIDE.md#api-reference). Key endpoints:

- **GET** `/api/assinante/prescription` - Retrieve current prescription and history
- **POST** `/api/assinante/prescription` - Upload new prescription with file
- **PUT** `/api/assinante/prescription/:id` - Update prescription metadata
- **DELETE** `/api/assinante/prescription/:id` - Delete prescription (soft delete)

See the main implementation guide for detailed request/response examples, error codes, and rate limiting information.

---

## Error Scenarios

### File Upload Errors

| Error Code | Cause | User Message | Resolution |
|------------|-------|--------------|------------|
| `FILE_TOO_LARGE` | File > 5MB | "Arquivo muito grande. Tamanho máximo: 5MB" | Compress image or PDF before upload |
| `INVALID_FORMAT` | Unsupported MIME type | "Formato não suportado. Use PDF, JPG ou PNG." | Convert file to supported format |
| `MALWARE_DETECTED` | File failed security scan | "Arquivo rejeitado por motivos de segurança." | Scan file locally, try different file |
| `UPLOAD_FAILED` | Network error | "Erro no upload. Verifique sua conexão." | Auto-retry 3x with exponential backoff |
| `STORAGE_ERROR` | S3/storage unavailable | "Erro ao salvar arquivo. Tente novamente." | Save to temp storage, retry later |

### Validation Errors

| Error Code | Cause | User Message | Resolution |
|------------|-------|--------------|------------|
| `INVALID_SPHERE` | Sphere out of range | "Grau esférico deve estar entre -20.00 e +20.00" | Correct sphere value |
| `INVALID_CYLINDER` | Cylinder out of range | "Grau cilíndrico deve estar entre -6.00 e +6.00" | Correct cylinder value |
| `INVALID_AXIS` | Axis out of range or missing | "Eixo obrigatório quando cilindro não é zero" | Enter axis value (0-180) |
| `INVALID_CRM` | CRM format wrong | "CRM inválido. Use formato: MG 69870" | Correct CRM format (UF + digits) |
| `INVALID_DATE` | Date in future or format wrong | "Data inválida" | Use valid past date |
| `INVALID_EXPIRY` | Expiry ≠ issue + 1 year | "Validade deve ser 1 ano após emissão" | Auto-calculate or correct manually |

### Access Errors

| Error Code | Cause | User Message | Resolution |
|------------|-------|--------------|------------|
| `UNAUTHORIZED` | Missing/invalid token | "Sessão expirada. Faça login novamente." | Re-authenticate user |
| `FORBIDDEN` | Accessing other user's data | "Acesso negado" | Verify user is accessing own data |
| `NOT_FOUND` | Prescription doesn't exist | "Receita não encontrada" | Check prescription ID, may be deleted |
| `RATE_LIMIT_EXCEEDED` | Too many requests | "Muitas tentativas. Aguarde 1 hora." | Wait for rate limit window to reset |

### Error Handling Pattern

```typescript
try {
  await uploadPrescription(file, data)
  toast.success('Receita enviada com sucesso!')

} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    toast.error('Arquivo muito grande. Máximo 5MB.')
    // Suggest compression tools
    showCompressionGuide()

  } else if (error.code === 'INVALID_FORMAT') {
    toast.error('Formato não suportado. Use PDF, JPG ou PNG.')
    // Show accepted formats
    showFormatGuide()

  } else if (error.code === 'VALIDATION_ERROR') {
    toast.error('Dados inválidos. Verifique os campos.')
    // Highlight invalid fields
    highlightErrors(error.details)

  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Muitos uploads. Aguarde 1 hora.')
    // Show cooldown timer
    showRateLimitTimer(error.retryAfter)

  } else {
    // Generic error
    toast.error('Erro ao enviar receita. Tente novamente.')
    // Log to error tracking (Sentry, LogRocket)
    logError(error)
  }
}
```

---

## Component Guide

### PrescriptionManager Component

**Main component for prescription management**:

```typescript
import { PrescriptionManager } from '@/components/assinante'

<PrescriptionManager
  currentPrescription={prescription}
  history={prescriptionHistory}
  onUpload={handleUpload}
  onDelete={handleDelete}
/>
```

**Props**:
- `currentPrescription`: Current active prescription or null
- `history`: Array of previous prescriptions
- `onUpload`: Callback for file upload
- `onDelete`: Optional callback for prescription deletion

**Sub-components**:
- `CurrentPrescriptionCard` - Display current prescription details
- `PrescriptionUploadForm` - File upload with drag-and-drop
- `PrescriptionHistoryTimeline` - Visual timeline of past prescriptions
- `ExpiryAlert` - Warning when prescription expires soon

See [Phase 3 Implementation Guide](./PHASE3_IMPLEMENTATION_GUIDE.md#component-implementation) for full implementation details.

---

## Testing

### Unit Tests

**Validation Logic**:
```typescript
import { validatePrescriptionData } from '../validation'

describe('Prescription Validation', () => {
  it('should accept valid sphere values', () => {
    expect(validateSphere(-2.50)).toBe(true)
    expect(validateSphere(+1.75)).toBe(true)
    expect(validateSphere(0.00)).toBe(true)
  })

  it('should reject invalid sphere values', () => {
    expect(() => validateSphere(-25.00)).toThrow()
    expect(() => validateSphere(+22.00)).toThrow()
    expect(() => validateSphere(-2.33)).toThrow() // Not 0.25 step
  })

  it('should require axis when cylinder is not zero', () => {
    const data = {
      sphere: -2.50,
      cylinder: -0.75,
      axis: undefined
    }

    expect(() => validateEyePrescription(data)).toThrow(
      'Eixo obrigatório quando cilindro não é zero'
    )
  })
})
```

### Integration Tests

**Upload Flow**:
```typescript
describe('Prescription Upload API', () => {
  it('should upload prescription successfully', async () => {
    const file = new File(['prescription content'], 'prescription.pdf')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/assinante/prescription', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.prescription.id).toBeDefined()
  })
})
```

### E2E Tests

**Complete Upload Flow**:
```typescript
test('should upload and display prescription', async ({ page }) => {
  await page.goto('/area-assinante/dashboard')
  await page.click('text=Receita')
  await page.click('text=Upload Receita')

  // Upload file
  const fileInput = await page.locator('input[type="file"]')
  await fileInput.setInputFiles('tests/fixtures/prescription.pdf')

  // Fill data
  await page.fill('[name="leftEye.sphere"]', '-2.50')
  await page.fill('[name="rightEye.sphere"]', '-3.00')
  await page.fill('[name="doctorCRM"]', 'MG 69870')

  // Submit
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('text=Receita enviada')).toBeVisible()
  await expect(page.locator('text=OE: -2.50')).toBeVisible()
})
```

---

## Troubleshooting

### Upload Fails Immediately

**Symptoms**: Upload button doesn't work, no progress shown.

**Diagnosis**:
```typescript
// Check in browser console
const fileInput = document.querySelector('input[type="file"]')
console.log('File input:', fileInput)
console.log('Selected file:', fileInput.files[0])

// Check file size
if (fileInput.files[0].size > 5 * 1024 * 1024) {
  console.error('File too large:', fileInput.files[0].size)
}
```

**Solutions**:
1. Check file size: `ls -lh prescription.pdf`
2. Verify file format is PDF/JPG/PNG
3. Check browser console for JavaScript errors
4. Clear browser cache: Ctrl+Shift+Delete

---

### Prescription Not Showing After Upload

**Symptoms**: Upload completes but prescription doesn't appear in list.

**Diagnosis**:
```bash
# Check database for prescription
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT * FROM \"Prescription\" WHERE \"userId\" = 'usr_abc123' ORDER BY \"createdAt\" DESC LIMIT 1;"

# Check file exists
ls -la storage/prescriptions/usr_abc123/
```

**Solutions**:
1. Refresh page (F5)
2. Clear cache: `curl -X DELETE /api/cache/prescription/{userId}`
3. Check database replication lag (wait 30 seconds)
4. Verify file was saved: check storage folder

---

### Expiry Alert Not Showing

**Symptoms**: Prescription expires soon but no alert displayed.

**Diagnosis**:
```typescript
// Check prescription expiry
const prescription = await fetch('/api/assinante/prescription', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json())

console.log('Days until expiry:', prescription.current.daysUntilExpiry)
```

**Solutions**:
1. Verify `daysUntilExpiry < 30`
2. Check alert component is rendered
3. Clear component cache: force re-render

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-24
**Maintained by**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Contact**: saraivavision@gmail.com | (33) 98606-1427
