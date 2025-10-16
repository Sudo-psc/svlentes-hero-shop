# Tech Debt Migration Guide

## Overview

This document describes the tech debt improvements made to the codebase and provides migration instructions for deprecated functions.

## Changes Made

### 1. Centralized Constants (`src/lib/constants.ts`)

**Problem**: Hardcoded values scattered throughout the codebase, making configuration changes difficult and error-prone.

**Solution**: Created a centralized constants file with all configuration values.

#### Migration

**Before:**
```typescript
const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511947038078'
```

**After:**
```typescript
import { APP_CONFIG } from '@/lib/constants'
const phone = APP_CONFIG.whatsapp.number
```

### 2. Unified Calculator Service (`src/lib/calculator-service.ts`)

**Problem**: Three different implementations of `calculateEconomy` function with duplicate logic:
- `src/lib/calculator.ts`
- `src/lib/economy-calculator.ts`
- Inline calculation in `src/components/forms/EconomyCalculator.tsx`

**Solution**: Created a single, well-tested calculator service that all components should use.

#### Migration

**Before:**
```typescript
import { calculateEconomy } from '@/lib/calculator'
// or
import { calculateEconomy } from '@/lib/economy-calculator'
```

**After:**
```typescript
import { calculateEconomy } from '@/lib/calculator-service'
```

**Note**: The old files (`calculator.ts`, `economy-calculator.ts`) are now deprecated wrappers that call the new service. They will be removed in a future version.

### 3. Structured Logging

**Problem**: 186+ instances of `console.log` and `console.error` throughout the codebase, with no structure or filtering.

**Solution**: Use the existing `logger` service (`src/lib/logger.ts`) for all logging needs.

#### Migration

**Before:**
```typescript
console.log('Payment created:', paymentData)
console.error('Error processing payment:', error)
```

**After:**
```typescript
import { logger, LogCategory } from '@/lib/logger'

logger.logPayment('payment_created', { paymentId: payment.id })
logger.error(LogCategory.PAYMENT, 'Failed to process payment', error as Error)
```

### 4. Business Constants

**Problem**: Magic numbers and prices duplicated across components.

**Solution**: Use `BUSINESS_CONSTANTS` from `src/lib/constants.ts`.

#### Migration

**Before:**
```typescript
const addOnPrices = {
    solution: 25,
    drops: 15,
    case: 10,
    consultation: 80
}
```

**After:**
```typescript
import { BUSINESS_CONSTANTS } from '@/lib/constants'
const addOnPrices = BUSINESS_CONSTANTS.addOnPrices
```

## Deprecation Timeline

### Immediately Deprecated (v1.0)
- ❌ `src/lib/calculator.ts` - Use `calculator-service.ts` instead
- ❌ `src/lib/economy-calculator.ts` - Use `calculator-service.ts` instead
- ⚠️ Direct usage of `console.log`/`console.error` - Use `logger` instead

### To Be Removed (v2.0)
- 🗑️ `src/lib/calculator.ts` will be deleted
- 🗑️ `src/lib/economy-calculator.ts` will be deleted
- 🗑️ All backup files (`.old`, `.backup`, `.bak`)

## Benefits

1. **Consistency**: Single source of truth for business logic
2. **Testability**: All new services have comprehensive test coverage
3. **Maintainability**: Changes only need to be made in one place
4. **Type Safety**: Better TypeScript support with unified types
5. **Debugging**: Structured logging makes debugging easier
6. **Configuration**: Centralized config reduces errors

## Testing

All new services include comprehensive test coverage:

- ✅ `src/lib/__tests__/calculator-service.test.ts` (16 tests)
- ✅ `src/lib/__tests__/constants.test.ts` (6 tests)

Run tests with:
```bash
npm test -- calculator-service
npm test -- constants
```

## Examples

### Complete Calculator Migration Example

**Before:**
```typescript
import { calculateEconomy } from '@/lib/calculator'

function MyComponent() {
  const result = calculateEconomy({
    lensType: 'daily',
    usagePattern: 'regular',
  })
  
  console.log('Result:', result)
}
```

**After:**
```typescript
import { calculateEconomy } from '@/lib/calculator-service'
import { logger, LogCategory } from '@/lib/logger'

function MyComponent() {
  const result = calculateEconomy({
    lensType: 'daily',
    usagePattern: 'regular',
  })
  
  logger.info(LogCategory.BUSINESS, 'Calculator result generated', {
    monthlySavings: result.monthlySavings,
    recommendedPlan: result.recommendedPlan,
  })
}
```

### API Route with Proper Logging

**Before:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log('Processing payment:', data)
    // ... process payment
    console.log('Payment successful')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**After:**
```typescript
import { logger, LogCategory } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const timer = logger.startTimer()
  
  try {
    const data = await req.json()
    logger.logPayment('payment_processing', { amount: data.amount })
    
    // ... process payment
    
    logger.logPayment('payment_success', { 
      amount: data.amount,
      duration: timer() 
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(
      LogCategory.PAYMENT, 
      'Payment failed', 
      error as Error,
      { duration: timer() }
    )
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## Next Steps

1. ✅ Migrate remaining `console.log` calls to use `logger`
2. ✅ Update all calculator usages to use `calculator-service`
3. ✅ Extract remaining hardcoded values to constants
4. 🔄 Add integration tests for API routes
5. 🔄 Document all business logic functions
6. 🔄 Remove deprecated files in v2.0

## Questions?

If you have questions about this migration, please:
1. Check this document first
2. Review the test files for usage examples
3. Contact the development team
