// Runs the ESLint binary of a workspace package (server or client) on the given files,
// so each package keeps its own config and plugins.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [pkg, ...files] = process.argv.slice(2);
const cwd = resolve(pkg);
const bin = resolve(cwd, 'node_modules', 'eslint', 'bin', 'eslint.js');

if (!existsSync(bin)) {
  console.warn(`[eslint-staged] ESLint is not installed in ./${pkg}; skipping lint.`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [bin, '--fix', '--max-warnings=0', ...files], {
  cwd,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
