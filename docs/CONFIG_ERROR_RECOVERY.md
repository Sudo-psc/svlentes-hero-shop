# Config Error Recovery System

## Overview

The centralized configuration system includes advanced error recovery mechanisms to ensure high availability and graceful degradation in production environments.

## Architecture

### Components

1. **Circuit Breaker** (`CircuitBreaker`)
   - Prevents cascading failures by temporarily disabling failing operations
   - Three states: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
   - Configurable failure threshold and reset timeout

2. **Retry Strategy** (`RetryStrategy`)
   - Exponential backoff with jitter
   - Prevents thundering herd problem
   - Configurable max attempts and delay parameters

3. **Health Monitor** (`HealthMonitor`)
   - Tracks success/failure metrics
   - Calculates overall health status
   - Provides operational insights

4. **Error Recovery Manager** (`ErrorRecoveryManager`)
   - Coordinates all error recovery components
   - Provides unified interface for protected operations

## Configuration

### Default Settings

```typescript
const defaultCircuitConfig = {
  failureThreshold: 3,      // Open circuit after 3 failures
  resetTimeout: 60000,      // Try again after 1 minute
  monitorWindow: 300000     // Track failures over 5-minute window
}

const defaultRetryConfig = {
  maxAttempts: 3,           // Retry up to 3 times
  initialDelay: 100,        // Start with 100ms delay
  maxDelay: 5000,           // Cap delay at 5 seconds
  backoffMultiplier: 2      // Double delay each attempt
}
```

### Customization

```typescript
import { ErrorRecoveryManager } from '@/config/error-recovery'

const customRecovery = new ErrorRecoveryManager(
  {
    failureThreshold: 5,
    resetTimeout: 120000,
    monitorWindow: 600000
  },
  {
    maxAttempts: 5,
    initialDelay: 200,
    maxDelay: 10000,
    backoffMultiplier: 1.5
  }
)
```

## Usage

### Basic Usage

```typescript
import { enhancedConfig } from '@/config/loader-enhanced'

// Async load with full error recovery
const config = await enhancedConfig.loadWithRecovery()

// Synchronous load (backward compatible)
const config2 = enhancedConfig.load()
```

### Health Monitoring

```typescript
import { enhancedConfig } from '@/config/loader-enhanced'

// Get health metrics
const metrics = enhancedConfig.getHealthMetrics()
console.log('Success rate:', metrics.successCount / metrics.totalAttempts)
console.log('Circuit state:', metrics.circuitState)

// Get simple health status
const status = enhancedConfig.getHealthStatus() // 'healthy' | 'degraded' | 'failed'

// Check if operational
const operational = enhancedConfig.isOperational() // boolean
```

### API Endpoint

```bash
# Health check endpoint
curl https://svlentes.com.br/api/config-health

# Response example
{
  "status": "healthy",
  "operational": true,
  "timestamp": "2025-10-18T10:00:00.000Z",
  "metrics": {
    "totalAttempts": 100,
    "successCount": 99,
    "failureCount": 1,
    "successRate": "99.00%",
    "lastSuccess": "2025-10-18T10:00:00.000Z",
    "lastFailure": "2025-10-17T15:30:00.000Z",
    "circuitState": "CLOSED"
  },
  "config": {
    "loaded": true,
    "loadAttempts": 1,
    "lastLoadTime": "2025-10-18T09:50:00.000Z"
  }
}
```

## Error Scenarios

### Scenario 1: YAML File Missing

**Symptoms:**
- `ENOENT: no such file or directory` error
- Config loading fails immediately

**Recovery:**
- Retry with exponential backoff (3 attempts)
- If all retries fail, circuit opens
- Application uses fallback hardcoded data
- Health status: `failed`

**Resolution:**
- Restore missing `base.yaml` file
- Circuit automatically resets after 1 minute
- System recovers on next load attempt

### Scenario 2: Invalid YAML Syntax

**Symptoms:**
- `YAMLException: bad indentation of a mapping entry`
- Parsing fails before schema validation

**Recovery:**
- Immediate failure (no retry for syntax errors)
- Error logged with line/column information
- Application uses fallback data
- Health status: `failed`

**Resolution:**
- Fix YAML syntax errors in `base.yaml`
- Validate with: `node -e "console.log(require('js-yaml').load(require('fs').readFileSync('src/config/base.yaml', 'utf-8')))"`
- Reload config: Circuit resets automatically

### Scenario 3: Schema Validation Failure

**Symptoms:**
- Zod validation errors
- Missing required fields or type mismatches

**Recovery:**
- Immediate failure (no retry for validation errors)
- Detailed validation errors logged
- Application uses fallback data
- Health status: `failed`

**Resolution:**
- Fix schema validation errors
- Check against schema in `src/config/schema.ts`
- Verify required fields are present
- Reload config

### Scenario 4: Transient File System Errors

**Symptoms:**
- Intermittent `EACCES` or `EISDIR` errors
- File system temporarily unavailable

**Recovery:**
- Retry with exponential backoff:
  - Attempt 1: 100ms delay
  - Attempt 2: 200ms delay
  - Attempt 3: 400ms delay
- If successful within 3 attempts: continue normally
- If all retries fail: open circuit

**Resolution:**
- Usually self-resolving (permissions restored, FS available)
- Monitor logs for recurring issues
- Check file permissions: `ls -la src/config/base.yaml`

### Scenario 5: Circuit Breaker Open

**Symptoms:**
- `Circuit breaker is OPEN` error message
- All config loading attempts fail fast
- No actual file reads attempted

**Recovery:**
- System waits 1 minute (resetTimeout)
- Transitions to HALF_OPEN state
- Next attempt tests if system recovered
- If successful: circuit closes, normal operation
- If failed: circuit reopens for another minute

**Resolution:**
- Fix underlying issue causing repeated failures
- Monitor health endpoint: `/api/config-health`
- Circuit automatically recovers when system is healthy

## Health States

### Healthy (Green)
- **Criteria**: Success rate ≥ 95%
- **Circuit**: CLOSED
- **Action**: Normal operation
- **HTTP Status**: 200

### Degraded (Yellow)
- **Criteria**: Success rate 70-94%
- **Circuit**: CLOSED or HALF_OPEN
- **Action**: Monitor closely, investigate intermittent failures
- **HTTP Status**: 200
- **Warning**: May transition to Failed if trend continues

### Failed (Red)
- **Criteria**: Success rate < 70% OR Circuit OPEN
- **Circuit**: OPEN
- **Action**: Immediate investigation required
- **HTTP Status**: 503
- **Fallback**: Using hardcoded data

## Monitoring & Alerting

### Metrics to Track

```typescript
{
  totalAttempts: number,      // Total config load attempts
  successCount: number,       // Successful loads
  failureCount: number,       // Failed loads
  successRate: string,        // Percentage as string
  lastSuccess: ISO8601,       // Last successful load timestamp
  lastFailure: ISO8601,       // Last failed load timestamp
  circuitState: CircuitState  // CLOSED | OPEN | HALF_OPEN
}
```

### Recommended Alerts

1. **Critical: Health Status = Failed**
   - Trigger: `status === 'failed'`
   - Action: Page on-call engineer
   - Impact: Application using fallback data

2. **Warning: Health Status = Degraded**
   - Trigger: `status === 'degraded'`
   - Action: Create ticket for investigation
   - Impact: Intermittent failures detected

3. **Warning: Circuit Breaker Open**
   - Trigger: `circuitState === 'OPEN'`
   - Action: Investigate recent changes
   - Impact: Config loading disabled temporarily

4. **Info: High Failure Rate**
   - Trigger: `failureCount / totalAttempts > 0.1`
   - Action: Review logs for patterns
   - Impact: Potential degradation

### Monitoring Integration

```bash
# Prometheus-style metrics
config_health_status{status="healthy"} 1
config_circuit_state{state="CLOSED"} 1
config_success_rate_percent 99.0
config_total_attempts 100
config_failure_count 1

# Datadog example
curl https://svlentes.com.br/api/config-health | jq '.metrics'
```

## Fallback Strategies

### Primary: Circuit Breaker + Retry

1. Attempt to load config
2. If fails: retry with exponential backoff (3 attempts)
3. If all retries fail: record failure
4. If failure threshold reached: open circuit
5. While circuit open: fail fast, no actual attempts
6. After reset timeout: try again (HALF_OPEN)
7. If successful: close circuit, resume normal operation

### Secondary: Hardcoded Fallback Data

All data layer files (`doctor-info.ts`, `trust-indicators.ts`) include hardcoded fallback:

```typescript
function getDoctorInfo() {
  try {
    const config = config.load()
    if (config.isFeatureEnabled('useCentralizedMedical')) {
      return config.medical.doctor
    }
  } catch (error) {
    console.warn('[Medical] Error loading, using fallback:', error)
  }
  return hardcodedDoctorInfo // Always available
}
```

### Tertiary: Graceful Degradation

When centralized config fails:
- ✅ Site remains operational
- ✅ Core features work with hardcoded data
- ✅ User experience unchanged
- ⚠️ Updates to YAML require code deployment
- ⚠️ No dynamic feature flag toggling

## Testing Error Recovery

### Unit Tests

```typescript
describe('Error Recovery', () => {
  it('should retry on transient failures', async () => {
    // Test retry logic with mock failures
  })

  it('should open circuit after threshold', () => {
    // Test circuit breaker behavior
  })

  it('should calculate exponential backoff correctly', () => {
    // Test backoff calculation with jitter
  })
})
```

### Integration Tests

```bash
# Simulate missing file
mv src/config/base.yaml src/config/base.yaml.backup
curl http://localhost:3000/api/config-health
# Should show: status=failed, operational=false

# Restore file
mv src/config/base.yaml.backup src/config/base.yaml
sleep 60  # Wait for circuit reset
curl http://localhost:3000/api/config-health
# Should show: status=healthy, operational=true
```

### Load Testing

```bash
# Apache Bench - Test under load
ab -n 1000 -c 10 http://localhost:3000/api/config-health

# Monitor metrics during load
watch -n 1 'curl -s http://localhost:3000/api/config-health | jq ".metrics"'
```

## Best Practices

1. **Monitor Health Endpoint**
   - Set up automated monitoring
   - Alert on degraded/failed states
   - Track success rate trends

2. **Validate Before Deploy**
   - Test YAML changes locally
   - Run schema validation
   - Check for syntax errors

3. **Graceful Rollback**
   - Keep previous working `base.yaml` backup
   - Deploy config changes separately from code
   - Test in staging first

4. **Circuit Breaker Tuning**
   - Adjust thresholds based on observed failure patterns
   - Consider environment-specific settings
   - Balance between availability and correctness

5. **Logging Strategy**
   - Log all config load attempts (success/failure)
   - Include context (environment, timestamp, attempt count)
   - Aggregate logs for analysis

## Troubleshooting

### Q: Why is circuit breaker staying open?
**A:** Underlying issue not resolved. Check:
- File system access permissions
- YAML syntax validity
- Schema validation errors
- Recent infrastructure changes

### Q: How to force circuit reset?
**A:** Don't! Circuit protects system. Instead:
- Fix underlying issue
- Wait for automatic reset (1 minute)
- Verify fix with health endpoint
- Circuit closes automatically on success

### Q: Can I disable error recovery?
**A:** Yes, use standard loader:
```typescript
import { config } from '@/config/loader'  // No error recovery
// vs
import { enhancedConfig } from '@/config/loader-enhanced'  // With error recovery
```

### Q: How to test circuit breaker locally?
**A:**
```typescript
import { errorRecovery } from '@/config/error-recovery'

// Trigger failures to open circuit
for (let i = 0; i < 3; i++) {
  try {
    await enhancedConfig.loadWithRecovery()
  } catch (e) {
    // Circuit opens after 3 failures
  }
}

// Check circuit state
console.log(errorRecovery.getHealthMetrics().circuitState) // OPEN

// Reset for testing
errorRecovery.reset()
```

## References

- [Circuit Breaker Pattern (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Site Reliability Engineering (Google)](https://sre.google/books/)

## Version History

- **2.0.0** (2025-10-18): Added error recovery system
- **1.0.0** (2025-10-15): Initial centralized config implementation
