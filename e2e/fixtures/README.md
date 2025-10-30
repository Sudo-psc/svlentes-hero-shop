# E2E Test Fixtures

This directory contains sample files used in E2E tests.

## Files

### sample-prescription.pdf
- **Purpose**: Sample medical prescription for testing prescription upload functionality
- **Size**: ~600 bytes (minimal valid PDF)
- **Content**: Mock prescription data with Dr. Philipe Saraiva Cruz's information
- **Usage**: Used in `subscriber-validation.spec.ts` and `subscriber-integration.spec.ts`

## Adding New Fixtures

When adding new test fixtures:

1. **Keep files small**: Use minimal valid file structures
2. **Use realistic data**: Match production data formats
3. **Document purpose**: Add entry to this README
4. **Security**: Never commit real user data or credentials
5. **LGPD compliance**: All test data must be fake/synthetic

## Fixture Types

### Valid Test Data
- `sample-prescription.pdf` - Valid PDF for prescription uploads
- Add more as needed (e.g., sample-image.jpg, sample-document.pdf)

### Invalid Test Data
Generated programmatically in test files:
- Oversized files (>5MB)
- Invalid file formats (text files with PDF extension)
- Malformed data structures

## Usage in Tests

```typescript
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load fixture
const pdfPath = join(__dirname, 'fixtures', 'sample-prescription.pdf')
await page.setInputFiles('input[type="file"]', pdfPath)
```

Or use the helper utilities:

```typescript
import { generateBase64PDF } from './helpers/test-utils'

const testPDF = generateBase64PDF(1024 * 1024) // 1MB
```
