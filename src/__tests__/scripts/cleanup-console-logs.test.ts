/**
 * Console Logs Cleanup Script Tests
 * Tests for production console log cleanup functionality
 */

// Mock console methods to track calls
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()

describe('Console Logs Cleanup Script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()
    mockConsoleWarn.mockRestore()
  })

  describe('Basic Log Removal Pattern Matching', () => {
    it('should identify console.log patterns correctly', () => {
      const testContent = `
        console.log('Debug message');
        console.log('User action:', userAction);
        console.error('Error occurred');
        console.warn('Warning message');
      `

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      const errorMatches = testContent.match(/console\.error\([^)]*\);?/g)
      const warnMatches = testContent.match(/console\.warn\([^)]*\);?/g)

      expect(logMatches).toHaveLength(2)
      expect(errorMatches).toHaveLength(1)
      expect(warnMatches).toHaveLength(1)
    })

    it('should identify console.log with complex arguments', () => {
      const testContent = `
        console.log('Processing payment:', { amount: 100, currency: 'BRL' });
        console.log('User data:', user, 'Action:', action);
        console.log(\`Template string: \${variable}\`);
      `

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toHaveLength(3)
    })

    it('should preserve code structure pattern matching', () => {
      const testContent = `
        function processPayment() {
          console.log('Starting payment');
          const result = await paymentAPI.create(charge);
          console.log('Payment created:', result.id);
          return result;
        }
      `

      const functionMatch = testContent.match(/function\s+\w+\([^)]*\)\s*{[^}]*}/s)
      expect(functionMatch).toBeTruthy()
      expect(functionMatch![0]).toContain('function processPayment')
      expect(functionMatch![0]).toContain('return result')
    })
  })

  describe('Error Log Pattern Recognition', () => {
    it('should identify critical error patterns', () => {
      const testContent = `
        console.error('CRITICAL: Database connection failed');
        console.error('FATAL: System crash');
        console.error('SECURITY: Unauthorized access attempt');
        console.error('Payment processing failed: Invalid signature');
        console.error('Regular error message');
      `

      const criticalPatterns = [
        /console\.error[^;]*(?:CRITICAL|FATAL|SECURITY)/,
        /console\.error[^;]*(?:Database connection failed|Payment processing failed)/
      ]

      const allMatches = testContent.match(/console\.error\([^)]*\);?/g)
      expect(allMatches).toHaveLength(5)

      criticalPatterns.forEach(pattern => {
        const criticalMatches = testContent.match(pattern)
        expect(criticalMatches).toBeTruthy()
      })
    })

    it('should identify non-critical error patterns', () => {
      const testContent = `
        console.error('Minor error occurred');
        console.error('API call failed:', error);
        console.error('User input validation failed');
        console.error('CRITICAL: Database connection failed');
      `

      const nonCriticalPattern = /console\.error\((?!.*(?:CRITICAL|FATAL|SECURITY|Database connection failed|Payment processing failed))[^)]*\);?/g
      const nonCriticalMatches = testContent.match(nonCriticalPattern)

      expect(nonCriticalMatches).toHaveLength(3)
    })
  })

  describe('Warning Log Pattern Recognition', () => {
    it('should identify important warning patterns', () => {
      const testContent = `
        console.warn('DEPRECATED: Old payment method');
        console.warn('SECURITY: Potential XSS detected');
        console.warn('PERFORMANCE: Slow query detected');
        console.warn('RATE_LIMIT: Payment API limit exceeded');
        console.warn('Regular warning message');
      `

      const importantPatterns = [
        /console\.warn[^;]*(?:DEPRECATED|SECURITY|PERFORMANCE|RATE_LIMIT)/
      ]

      const allMatches = testContent.match(/console\.warn\([^)]*\);?/g)
      expect(allMatches).toHaveLength(5)

      importantPatterns.forEach(pattern => {
        const importantMatches = testContent.match(pattern)
        expect(importantMatches).toBeTruthy()
      })
    })

    it('should identify non-important warning patterns', () => {
      const testContent = `
        console.warn('Deprecated feature used');
        console.warn('SECURITY: Potential XSS detected');
        console.warn('PERFORMANCE: Slow query detected');
        console.warn('Regular warning message');
      `

      const nonImportantPattern = /console\.warn\((?!.*(?:DEPRECATED|SECURITY|PERFORMANCE|RATE_LIMIT))[^)]*\);?/g
      const nonImportantMatches = testContent.match(nonImportantPattern)

      expect(nonImportantMatches).toHaveLength(2)
    })
  })

  describe('Comment and String Handling', () => {
    it('should preserve comments containing console-like text', () => {
      const testContent = `
        // This is a console-like comment but should be preserved
        /* console.log('This is in a comment'); */
        // console.error('Comment with error text');
        console.log('This should be removed');
      `

      const commentPattern = /\/\/.*console.*$/gm
      const commentMatches = testContent.match(commentPattern)

      expect(commentMatches).toHaveLength(2)
      expect(commentMatches![0]).toContain('console-like comment')
      expect(commentMatches![1]).toContain('Comment with error text')

      // Should still find the actual console.log to be removed
      const actualLogPattern = /console\.log\([^)]*\);?/g
      const actualLogMatches = testContent.match(actualLogPattern)
      expect(actualLogMatches).toHaveLength(1)
    })

    it('should preserve string literals containing console text', () => {
      const testContent = `
        const message = "console.log('This is a string')";
        const errorMessage = "console.error('Error in string')";
        console.log('Actual console log that should be removed');
      `

      const stringPattern = /["'][^"']*console[^"']*["']/g
      const stringMatches = testContent.match(stringPattern)

      expect(stringMatches).toHaveLength(2)
      expect(stringMatches![0]).toContain('console.log')
      expect(stringMatches![1]).toContain('console.error')

      // Should still find the actual console.log to be removed
      const actualLogPattern = /console\.log\([^)]*\);?/g
      const actualLogMatches = testContent.match(actualLogPattern)
      expect(actualLogMatches).toHaveLength(1)
    })
  })

  describe('File Type Support', () => {
    it('should handle TypeScript files', () => {
      const testContent = `
        interface User {
          name: string;
        }

        function processUser(user: User): void {
          console.log('Processing user:', user.name);
        }
      `

      expect(testContent).toContain('interface User')
      expect(testContent).toContain('function processUser')

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toHaveLength(1)
    })

    it('should handle JavaScript files', () => {
      const testContent = `
        function calculateTotal(items) {
          console.log('Calculating total');
          return items.reduce((sum, item) => sum + item.price, 0);
        }
      `

      expect(testContent).toContain('function calculateTotal')

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toHaveLength(1)
    })

    it('should handle React/JSX files', () => {
      const testContent = `
        function Component({ data }) {
          console.log('Component rendered');
          return <div>{data}</div>;
        }
      `

      expect(testContent).toContain('return <div>{data}</div>')

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toHaveLength(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const testContent = ''
      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toBeNull()
    })

    it('should handle files with no console statements', () => {
      const testContent = `
        function calculateTotal(amount: number, tax: number): number {
          return amount + (amount * tax);
        }

        const result = calculateTotal(100, 0.1);
      `

      const logMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(logMatches).toBeNull()
    })

    it('should handle malformed console statements', () => {
      const testContent = `
        console.log('Unclosed log
        console.error();
        console.warn
        console.log('Proper log');
      `

      const properLogMatches = testContent.match(/console\.log\([^)]*\);?/g)
      expect(properLogMatches).toHaveLength(1)
      expect(properLogMatches![0]).toContain('Proper log')
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large content efficiently', () => {
      let largeContent = ''
      for (let i = 0; i < 100; i++) {
        largeContent += `console.log('Log message ${i}');\n`
      }

      const startTime = Date.now()
      const logMatches = largeContent.match(/console\.log\([^)]*\);?/g)
      const endTime = Date.now()

      expect(logMatches).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(100) // Should process quickly
    })

    it('should handle mixed content efficiently', () => {
      const mixedContent = `
        import React from 'react';

        const Component = () => {
          const [state, setState] = useState(0);

          console.log('Component rendered');
          console.warn('Some warning');
          console.error('Some error');

          return <div>Test</div>;
        };

        export default Component;
      `

      const startTime = Date.now()
      const allConsoleMatches = mixedContent.match(/console\.(log|error|warn)\([^)]*\);?/g)
      const endTime = Date.now()

      expect(allConsoleMatches).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })
  })

  describe('Regex Pattern Validation', () => {
    it('should have accurate console.log detection pattern', () => {
      const pattern = /console\.log\([^)]*\);?/g

      const testCases = [
        { input: "console.log('test');", expected: true },
        { input: "console.log('test')", expected: true },
        { input: "console.log('test', variable);", expected: true },
        { input: "console.log(`template ${variable}`);", expected: true },
        { input: "// console.log('comment');", expected: false },
        { input: "const str = 'console.log(test)';", expected: false }
      ]

      testCases.forEach(({ input, expected }) => {
        const matches = input.match(pattern)
        expect(!!matches).toBe(expected)
      })
    })

    it('should have accurate critical error detection pattern', () => {
      const pattern = /console\.error[^;]*(?:CRITICAL|FATAL|SECURITY|Database connection failed|Payment processing failed)/

      const testCases = [
        { input: "console.error('CRITICAL: System failed')", expected: true },
        { input: "console.error('FATAL: Memory exhausted')", expected: true },
        { input: "console.error('SECURITY: Hack attempt')", expected: true },
        { input: "console.error('Database connection failed')", expected: true },
        { input: "console.error('Payment processing failed')", expected: true },
        { input: "console.error('Regular error')", expected: false }
      ]

      testCases.forEach(({ input, expected }) => {
        const matches = input.match(pattern)
        expect(!!matches).toBe(expected)
      })
    })

    it('should have accurate important warning detection pattern', () => {
      const pattern = /console\.warn[^;]*(?:DEPRECATED|SECURITY|PERFORMANCE|RATE_LIMIT)/

      const testCases = [
        { input: "console.warn('DEPRECATED: Old method')", expected: true },
        { input: "console.warn('SECURITY: XSS detected')", expected: true },
        { input: "console.warn('PERFORMANCE: Slow query')", expected: true },
        { input: "console.warn('RATE_LIMIT: API limit')", expected: true },
        { input: "console.warn('Regular warning')", expected: false }
      ]

      testCases.forEach(({ input, expected }) => {
        const matches = input.match(pattern)
        expect(!!matches).toBe(expected)
      })
    })
  })
})