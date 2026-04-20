# TAMDEMO-50 — Build plan: Fix docs drift before it compounds

## Problem and audience

Contributor documentation is split across **in-repo Markdown** (`contribute/`, `CONTRIBUTING.md`, `docs/sources/...`) and **external** properties (Grafana Developer Portal, plugin-tools, Writers' Toolkit). New contributors and plugin authors hit **broken links, stale commands, and inconsistent journeys**. This plan defines phased work to restore the highest-value paths and prevent recurrence.

**Primary audiences:** first-time code contributors; plugin authors following publish flows.

## Phased implementation (for follow-up PRs/issues)

### Phase 0 — Inventory (no content change)

1. **Seed list** (Linear issue): [contribute/README.md](../README.md), [docs/sources/shared/tutorials/publish-your-plugin.md](../../docs/sources/shared/tutorials/publish-your-plugin.md).
2. **Expand** to high-traffic targets:
   - [contribute/developer-guide.md](../developer-guide.md)
   - [CONTRIBUTING.md](../../CONTRIBUTING.md) (plugin + docs links)
   - [contribute/create-pull-request.md](../create-pull-request.md), [contribute/documentation/README.md](../documentation/README.md)
3. For each page, record: internal `md` links, relative paths to repo files, external URLs, commands (`yarn`, `make`, `corepack`), and **which journey** they belong to (see below).

### Phase 1 — Journey: clone → run Grafana locally

- Align **Node version** story: `.nvmrc`, [developer-guide.md](../developer-guide.md), and [scripts/check-frontend-dev.sh](../../scripts/check-frontend-dev.sh) behavior (warn-only locally).
- Align **yarn/corepack** steps with current `package.json` / Yarn berry (`.yarnrc.yml`).
- Ensure **lefthook** install story matches [Makefile](../../Makefile) targets (`make lefthook-install`).
- Deduplicate troubleshooting (e.g. `tsbuildinfo`) so one page is canonical and others link to it.

### Phase 2 — Journey: plugin create → build → publish

- Reconcile [publish-your-plugin.md](../../docs/sources/shared/tutorials/publish-your-plugin.md) with:
  - [CONTRIBUTING.md](../../CONTRIBUTING.md) “Develop a Plugin” (links to grafana.com developers)
  - Any in-repo plugin docs under `docs/` or `packages`
- Confirm **grafana-plugin-repository** and plugin catalog URLs still match current process.
- Add explicit “if you only contribute to core Grafana, skip to …” cross-links to reduce wrong-path reading.

### Phase 3 — Journey: contribute documentation

- Clarify when to use [contribute/documentation/README.md](../documentation/README.md) + Writers' Toolkit vs `AGENTS.md`-style repo rules.
- Link from [contribute/README.md](../README.md) to the docs build entry ([docs/Makefile](../../docs/Makefile): `make docs`) for contributors who touch `docs/sources/`.

### Phase 4 — Guardrails (anti-drift)

Pick a **minimal durable** set:

| Guardrail | Purpose |
|-----------|---------|
| CI or scheduled job: `yarn prettier:checkDocs` on PRs touching `docs/**/*.md` or `contribute/**/*.md` | Format consistency |
| Optional: run `make docs` (or Writers' Toolkit link check) on changes under `docs/sources/` | Catches broken relrefs / build breaks |
| CODEOWNERS or review checklist for `contribute/**` and `docs/sources/shared/tutorials/**` | Human gate on high-impact pages |
| “Last reviewed” or ownership note on the curated path (ties to TAMDEMO-45) | Social guardrail |

## Risks and out of scope

- **Risk:** External grafana.com docs move; in-repo links need periodic audits.
- **Out of scope for this initiative:** rewriting large sections of generated API docs; translating community strings.

## Done when (maps to TAMDEMO-50)

- Key contributor docs are **corrected** (accurate links, commands, prerequisites).
- The worst broken/outdated paths are **removed or redirected** in navigation.
- A written **anti-drift strategy** (this phase table + chosen CI/owners) is agreed and tracked in follow-up issues.

## Prep findings to fix in Phase 1+

- [developer-guide.md](../developer-guide.md): typo `(required for Cgo]` → `(required for Cgo)`.
- See [PREP_INVENTORY.md](./PREP_INVENTORY.md) for command and path reference table.

---

# TAMDEMO-47 — Test plan: Fix docs drift before it compounds

## Mapping to build phases

| Build phase | Validation focus |
|-------------|------------------|
| Phase 0 | Spreadsheet or script: every link extracted; classify internal vs external |
| Phase 1 | Manual: follow developer guide on a **clean** Linux (or macOS) machine; record deviations |
| Phase 2 | Manual: follow plugin publish doc + CONTRIBUTING plugin section; verify repo URLs |
| Phase 3 | Run docs tooling where applicable |
| Phase 4 | Confirm chosen guardrails run in CI or are documented for reviewers |

## Automated checks

1. **Prettier:** `yarn prettier:checkDocs` (and optionally full `yarn prettier:check` if contribute paths added to scope).
2. **Hugo / relrefs:** from [docs/](../../docs/), with Docker/Podman available: `make docs` (per [docs/docs.mk](../../docs/docs.mk)); review logs for broken relrefs; adjust `HUGO_REFLINKSERRORLEVEL` if team wants failures to fail the build locally.
3. **Optional:** `make vale` for style on touched topics.

## Manual walkthroughs (exit criteria)

Execute as **fresh contributor** (new clone, no global assumptions):

1. **Setup path:** [CONTRIBUTING.md](../../CONTRIBUTING.md) → [developer-guide.md](../developer-guide.md) → `corepack` → `yarn install --immutable` → `yarn start` (or documented backend steps if split).
2. **Plugin path:** CONTRIBUTING plugin bullets → external plugin-tools (note behavior) → in-repo publish tutorial if they return to monorepo docs.
3. **Spot-check:** every **command block** in updated pages — copy/paste or verify against current tree.

## Exit criteria (maps to TAMDEMO-47)

- Updated docs pass **automated** checks where the team chose to enforce them.
- Highest-value journeys verified by **actually following** the refreshed guidance once per release train or before marking initiative done.
- Referenced files, binaries, and external destinations exist and match documented paths.
