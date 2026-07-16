// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    // Regla de oro: domain/ es TypeScript puro, sin react-native ni expo
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react-native',
                'react-native/*',
                'expo',
                'expo-*',
                '@expo/*',
                'react',
                'react-*',
              ],
              message: 'domain/ debe ser TypeScript puro: sin react, react-native ni expo.',
            },
          ],
        },
      ],
    },
  },
]);
