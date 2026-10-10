// Enforces Conventional Commits on the first line: type(scope)!: subject
import { readFileSync } from 'node:fs';

const message = readFileSync(process.argv[2], 'utf8').split('\n')[0].trim();
const pattern =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{1,100}$/;

if (/^(Merge|Revert) /.test(message) || pattern.test(message)) process.exit(0);

console.error(`\n✖ Commit message does not follow Conventional Commits:\n  "${message}"\n`);
console.error(
  '  Expected: <type>(<scope>): <subject>   e.g. feat(server): add favorites endpoints',
);
console.error('  Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert\n');
process.exit(1);
