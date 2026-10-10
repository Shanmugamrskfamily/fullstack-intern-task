# Development guidelines

These are the conventions this repository follows. They keep the history readable and every change reviewable.

## Branches

- `main` is always deployable: CI must be green, and both services deploy from it.
- Work happens on short-lived branches named by type: `feat/<scope>-<topic>`, `fix/...`, `docs/...`, `chore/...`, `ci/...`, `test/...`.
- Branches are merged into `main` with a merge commit (`--no-ff`), so each feature stays visible as one unit in the history.

## Commits: Conventional Commits

```
<type>(<scope>): <subject in imperative mood>
```

- **types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **scopes:** `server`, `client`, `repo`, `deploy`, `docs`
- Examples: `feat(server): add idempotent favorites endpoint` · `fix(client): keep filters when the detail dialog closes`
- A `commit-msg` hook rejects messages that don't match.

## Code style

- TypeScript `strict` everywhere. No `any` without a comment explaining why.
- Prettier formats; ESLint catches correctness issues. A `pre-commit` hook runs both on staged files.
- Server: layered modules (`routes → controller → service → model`). Validation lives in Zod schemas next to the module; controllers stay thin.
- Client: feature folders (`features/<name>`); server state in TanStack Query, UI state local; forms with React Hook Form + Zod.
- Every input is validated on the server, even when the client already validates it.

## Before you push

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks on every push and pull request.

## Pull requests

Use the PR template: what changed, why, how it was tested, and screenshots for UI changes.
