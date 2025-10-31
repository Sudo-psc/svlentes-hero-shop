const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/data/(.*)$': '<rootDir>/src/data/$1',
        '^@/vision/(.*)$': '<rootDir>/src/vision/$1',
        '^@/vision-components/(.*)$': '<rootDir>/src/vision/components/$1',
        '^@/vision-hooks/(.*)$': '<rootDir>/src/vision/hooks/$1',
        '^@/vision-services/(.*)$': '<rootDir>/src/vision/services/$1',
        '^@/vision-types/(.*)$': '<rootDir>/src/vision/types/$1',
        '^@/vision-utils/(.*)$': '<rootDir>/src/vision/utils/$1',
    },
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/e2e/',
        '<rootDir>/playwright-report/',
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/app/layout.tsx',
        '!src/app/page.tsx',
    ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)