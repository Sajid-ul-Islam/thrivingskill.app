const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'builds/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'backend-plugin/**',
      'scripts/**',
      'jest.config.js',
      'eslint.config.js',
    ],
  },
  {
    rules: {
      // React Native projects without React Compiler use Animated.Value refs and modal state resets
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      // Quotes inside React Native <Text> render normally without HTML entities
      'react/no-unescaped-entities': 'off',
      // TypeScript compiler verifies module/namespace exports (handles Expo SDK barrel re-exports)
      'import/namespace': 'off',
    },
  },
  {
    files: ['src/__tests__/**/*.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
