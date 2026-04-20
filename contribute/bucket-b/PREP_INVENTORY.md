# Bucket B — shared prep inventory

This file satisfies **prep-inventory** from the Bucket B plan: anchor paths in-repo, contributor entry points, and commands to cite in test plans (TAMDEMO-47, TAMDEMO-43).

## Contributor entry surfaces

| Surface | Path | Role |
|--------|------|------|
| Top-level contribute index | [contribute/README.md](../README.md) | Links to PR workflow, developer guide, style guides, docs contrib |
| Developer setup & build | [contribute/developer-guide.md](../developer-guide.md) | Dependencies, clone, yarn, lefthook, frontend/backend build |
| Repo contributing narrative | [CONTRIBUTING.md](../../CONTRIBUTING.md) | Community + links to developer guide and plugin tools |
| Published plugin tutorial (docs tree) | [docs/sources/shared/tutorials/publish-your-plugin.md](../../docs/sources/shared/tutorials/publish-your-plugin.md) | Release branch, `yarn build`, `dist`, grafana-plugin-repository |
| Docs contribution hub | [contribute/documentation/README.md](../documentation/README.md) | Writers' Toolkit, external repo |
| Agent/docs authoring rules | [AGENTS.md](../../AGENTS.md) | Style for Markdown in this repo (not a substitute for Writers' Toolkit) |

## Docs build / validation commands (for test plans)

These are the **concrete** checks to reference; contributors need Docker/Podman for full Hugo docs.

| Command | Location | Purpose |
|---------|----------|---------|
| `make docs` | [docs/Makefile](../../docs/Makefile) (includes [docs/docs.mk](../../docs/docs.mk)) | Local Hugo docs via `make-docs` script + `grafana/docs-base` image |
| `make vale` | same | Vale lint in container |
| `HUGO_REFLINKSERRORLEVEL` | [docs/docs.mk](../../docs/docs.mk) (default `WARNING`) | Relref/link behavior during Hugo build |
| `yarn prettier:checkDocs` | [package.json](../../package.json) | Prettier on `docs/**/*.md`, root `*.md`, packages |
| `yarn prettier:check` | [package.json](../../package.json) | Broader Prettier check including `**/*.md` |

**Note:** Full link graph validation for grafana.com-style publishing is tied to the Writers' Toolkit / `make-docs` pipeline, not a single `yarn` script.

## Frontend dev bootstrap hooks

| Artifact | Role |
|----------|------|
| [scripts/check-frontend-dev.sh](../../scripts/check-frontend-dev.sh) | Warns if Node ≠ `.nvmrc`; exits 0 in CI or if `IGNORE_NODE_VERSION_CHECK` set |
| [package.json](../../package.json) `check-frontend-dev` | Runs the script |
| [project.json](../../project.json) | `start` target **dependsOn** `check-frontend-dev` (so `yarn start` / Nx `start` runs the check first when that graph is used) |

## Quick drift signals spotted during prep (for TAMDEMO-50)

- [contribute/developer-guide.md](../developer-guide.md) line 12: typo `(required for Cgo]` — should be `(required for Cgo)`.
- [contribute/README.md](../README.md) links to `../contribute/documentation/README.md`; from `contribute/` that resolves to `contribute/documentation/README.md` (same directory name repeated in path — works but reads redundant).
- Cross-tree consistency: plugin publishing in **developer-guide** vs **publish-your-plugin.md** vs **CONTRIBUTING** “Develop a Plugin” — worth an explicit inventory in the drift build plan.

## Reference: completed catalog planning (TAMDEMO-44 / 49)

Use the same structure for new plans: **Objective → Scope → Done when / Exit criteria**, with file-level pointers and phased follow-up issues for implementation.
