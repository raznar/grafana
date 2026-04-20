# TAMDEMO-45 — Build plan: Add a curated contributor learning path

## Problem and audience

[contribute/README.md](../README.md) is a **flat link hub**. New contributors do not get a ordered path through setup, architecture, FE/BE conventions, and plugins. This plan adds a **discoverable start-here journey** without duplicating long setup prose (that lives in the bootstrap initiative — see [TAMDEMO_48_46_PLANS.md](./TAMDEMO_48_46_PLANS.md)).

**Audience:** first-time contributors; returning contributors onboarding to a new area (frontend vs backend vs plugins).

## Information architecture (recommended)

**Single primary path** with optional **persona shortcuts** (same pages, different entry anchors):

| Approach | Pros | Cons |
|----------|------|------|
| **Single path** (recommended) | One maintenance burden; clear “next” links | Long page if not modular |
| Persona-only split | Shorter per page | Duplication risk |
| Stage-only (week 1 / week 2) | Good for bootcamps | Harder to search |

**Recommendation:** one hub page `contribute/start-here.md` (or `contribute/onboarding/README.md`) with sections and deep links; persona callouts only as bullet lists at the top.

## Proposed modules (outline for implementation PR)

1. **Start** — Code of conduct, where to ask (CONTRIBUTING channels), then **bootstrap** link: “Run `…` (see TAMDEMO-48 outcome) or follow [developer-guide.md](../developer-guide.md) manually.”
2. **Repository map** — High-level: `public/app`, `pkg`, `packages`, `docs`, where tests live; link to any existing architecture doc (search for `architecture` under `contribute/`).
3. **Frontend conventions** — Link [style-guides/frontend.md](../style-guides/frontend.md), testing guide, Storybook if applicable.
4. **Backend conventions** — Link [backend/style-guide.md](../backend/style-guide.md), Go testing patterns.
5. **Plugins & extensions** — Link CONTRIBUTING plugin section + developer portal; optional pointer to completed extension catalog planning (TAMDEMO-44) for **depth**, not duplication.
6. **Docs contributions** — Link [documentation/README.md](../documentation/README.md) + Writers' Toolkit.
7. **PR workflow** — Link [create-pull-request.md](../create-pull-request.md), breaking changes guide if touching APIs.

## Navigation changes

- Add prominent link from [contribute/README.md](../README.md) **first bullet** under intro: “**New here?** Start with [Start here](start-here.md)”.
- Optional: one line in [CONTRIBUTING.md](../../CONTRIBUTING.md) “Make technical contributions” pointing to the same hub.

## Ownership and maintenance (done when)

- **Owner:** Grafana DevEx or **@grafana/grafana-frontend-platform** + **backend platform** rotation (mirror CODEOWNERS for `contribute/`).
- **Expectation:** quarterly link check or tie to release: run checklist from [TAMDEMO_43 test plan](#tamdemo-43--test-plan-add-a-curated-contributor-learning-path) before major releases.
- **Anti-drift:** same guardrails as [TAMDEMO_50](./TAMDEMO_50_47_PLANS.md) Phase 4; start-here path listed in CODEOWNERS optional list.

## Done when (TAMDEMO-45)

- Contributor journey is **explicit** and **discoverable** from README/CONTRIBUTING.
- New developers know **where to start** and **what to read next** (linear reading order).
- Path has **owner** + maintenance expectation documented on the hub page.

---

# TAMDEMO-43 — Test plan: Add a curated contributor learning path

## Automated validation

1. After hub page exists: `yarn prettier:checkDocs` (if under `docs/`) or `yarn prettier:check` for `contribute/**/*.md` — ensure Prettier scope includes new files (may require CI tweak).
2. If any start-here content references `docs/sources/` paths: run `make docs` from [docs/](../../docs/) per [PREP_INVENTORY.md](./PREP_INVENTORY.md).

## Manual walkthrough script (fresh contributor)

1. Open repo cold; find start-here within **60 seconds** from GitHub root (README → CONTRIBUTING or contribute/README).
2. Follow each module link; note any **circular** or **dead** links.
3. Stop after setup module: verify bootstrap command or developer-guide link matches [TAMDEMO_48_46_PLANS.md](./TAMDEMO_48_46_PLANS.md).
4. Ask: “Could I open a trivial PR without asking Slack?” If no, gap list.

## Lightweight feedback loop

- Add **“Questions this path should answer”** checklist on the hub (checkbox list): e.g. “How do I run Grafana locally?”, “Where do tests live?”, “How do I add a migration?”
- Team reviews checklist quarterly or on onboarding feedback.

## Exit criteria (TAMDEMO-43)

- Start-here path is **internally consistent** and technically correct.
- A new contributor can follow it **without repeatedly falling back** to scattered tribal knowledge (validated by one internal volunteer per release).
