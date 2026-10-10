/**
 * Pre-commit checks on staged files only:
 * - ESLint (auto-fix) runs inside the package that owns the file.
 * - Prettier formats everything it understands.
 */
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');

export default {
  'server/**/*.ts': (files) => [`node scripts/eslint-staged.mjs server ${quote(files)}`],
  'client/**/*.{ts,tsx}': (files) => [`node scripts/eslint-staged.mjs client ${quote(files)}`],
  '*.{ts,tsx,js,mjs,cjs,json,css,md,yml,yaml,html}': (files) => [
    `prettier --write ${quote(files)}`,
  ],
};
