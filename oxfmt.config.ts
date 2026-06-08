import type { OxfmtConfig } from 'oxfmt';

export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  insertFinalNewline: true,
  embeddedLanguageFormatting: 'auto',
  ignorePatterns: ['*.min.js', '**/dist/**', '**/node_modules/**', '**/build/**'],
  sortPackageJson: true,
} satisfies OxfmtConfig;
