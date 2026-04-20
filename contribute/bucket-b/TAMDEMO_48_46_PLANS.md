# TAMDEMO-48 — Build plan: Ship a one-command dev bootstrap

## Problem and audience

Setup steps are **spread across** [contribute/developer-guide.md](../developer-guide.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), and implicit behavior in [scripts/check-frontend-dev.sh](../../scripts/check-frontend-dev.sh) plus Nx ([project.json](../../project.json) `start` → `check-frontend-dev`). Contributors must discover multiple pages and remember hook installation. This plan defines a **single documented entrypoint** that is idempotent and fails clearly.

**Audience:** new code contributors on macOS/Linux (Windows via WSL as today).

## Current behavior summary

| Step | Today | Gap |
|------|--------|-----|
| Node version | `.nvmrc`; script warns on mismatch; CI skips check | Not wired to `yarn install` automatically; easy to miss |
| JS deps | `yarn install --immutable` | Documented; slow; errors need central troubleshooting link |
| Git hooks | `make lefthook-install` (opt-in) | Separate command; not in one “bootstrap” |
| Frontend dev | `yarn start` triggers `check-frontend-dev` via Nx | Backend-only contributors may use other flows — document split |

## Recommended single entrypoint (choose one in implementation issue)

**Option A — Shell script (recommended for parity with existing `scripts/`):**

- Add e.g. `scripts/dev-bootstrap.sh` (or `contrib-bootstrap.sh`) that:
  1. Prints prerequisites (Go, Node, git, optional Docker) with links to developer-guide.
  2. Runs `corepack enable` and `corepack install` if `yarn` not available (or documents skipping with message).
  3. Runs `./scripts/check-frontend-dev.sh` unless `IGNORE_NODE_VERSION_CHECK=1` or CI.
  4. Runs `yarn install --immutable`.
  5. Optionally runs `make lefthook-install` with `LEFTHOOK=1` env or `--with-hooks` flag so default stays fast.
  6. Exits non-zero with **actionable** messages (wrong Node, network, checksum).

**Option B — Make target:**

- `make dev-bootstrap` delegating to the same steps (fits teams that start from `make`).

**Option C — package.json script:**

- `"bootstrap": "..."` chaining `check-frontend-dev` + `yarn install --immutable` (limited for `corepack`/`make` without shell).

Implementation issue should pick **one canonical** command and duplicate aliases only if necessary.

## Documentation consolidation

1. **developer-guide.md** — Replace long “first hour” with: “Run **one command**: `…`” then “What it does” accordion or section linking to deep dives.
2. **CONTRIBUTING.md** — Under “Contribute Code”, link to that command first, then developer guide for edge cases.
3. **check-frontend-dev.sh** — Document relationship: “Bootstrap calls this; `yarn start` also depends on it via Nx.”
4. **CI behavior** — Document `IGNORE_NODE_VERSION_CHECK` / `CI` early-exit so contributors don’t expect local warnings in CI logs.

## Idempotency and failure UX

- Second run: `yarn install --immutable` should be no-op when lockfile satisfied; lefthook install should be safe to rerun.
- Failures: wrong Node → point to `.nvmrc` and version managers; checksum → link to existing `YARN_CHECKSUM_BEHAVIOR` note in developer-guide.

## Done when (TAMDEMO-48)

- One **documented** command bootstraps a typical frontend+backend contributor.
- Rerunning is **safe** and fast when nothing changed.
- Failures print **clear** remediation (not only stack traces).

---

# TAMDEMO-46 — Test plan: Ship a one-command dev bootstrap

## Environments

| OS | Priority | Notes |
|----|----------|-------|
| Linux (clean container or VM) | P0 | Matches most CI agents |
| macOS | P1 | Homebrew paths in developer-guide |
| Windows | P2 | WSL only if team maintains it — match developer-guide scope |

## Golden path (must pass)

1. Fresh clone → run bootstrap command → `yarn start` (or documented minimal verify: `yarn typecheck` if start is too heavy for CI-like VM).
2. Second run: no destructive side effects; completes quickly.

## Failure-matrix cases

| Scenario | Expected |
|----------|----------|
| Node version ≠ `.nvmrc` | Non-zero or warning per script policy; message names required version |
| Missing `.nvmrc` | `check-frontend-dev.sh` exits 1 with recovery hint |
| `yarn install` network failure | Clear error; no partial state claimed as success |
| `CI=true` | Version check skipped; document so tests don’t assert local warning |
| Hooks: `make lefthook-install` already run | Idempotent; no duplicate hook corruption |

## Doc–behavior checklist

- [ ] CONTRIBUTING “Contribute Code” matches bootstrap command and order of operations.
- [ ] developer-guide prerequisites match what bootstrap assumes vs what it installs.
- [ ] `IGNORE_NODE_VERSION_CHECK` documented for advanced contributors.

## Exit criteria (TAMDEMO-46)

- Bootstrap is **reliable** on first run on P0 environment.
- Safe to **rerun** after partial failure or after pulling new lockfile.
- Common failures have **repeatable** reproduction + remediation in docs or script output.
