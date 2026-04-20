# Linear handoff (paste into issues)

Linear MCP was not available in the execution environment. Copy the sections below into **comments** on the corresponding issues, or attach links to the files in this folder in your PR description.

**Repo paths:** `contribute/bucket-b/TAMDEMO_*_PLANS.md` and `contribute/bucket-b/PREP_INVENTORY.md`.

---

## TAMDEMO-50

See **Build plan** in `contribute/bucket-b/TAMDEMO_50_47_PLANS.md` (section “TAMDEMO-50 — Build plan”). Includes phased inventory, journey priorities, guardrails, and link to prep inventory for validation commands.

---

## TAMDEMO-47

See **Test plan** in `contribute/bucket-b/TAMDEMO_50_47_PLANS.md` (section “TAMDEMO-47 — Test plan”). Maps automated checks (`yarn prettier:checkDocs`, `make docs`) to manual walkthroughs.

---

## TAMDEMO-48

See **Build plan** in `contribute/bucket-b/TAMDEMO_48_46_PLANS.md`. Covers single entrypoint options (script vs make vs yarn), consolidation with `scripts/check-frontend-dev.sh` and Nx `start` dependency.

---

## TAMDEMO-46

See **Test plan** in `contribute/bucket-b/TAMDEMO_48_46_PLANS.md`. OS matrix, golden path, failure matrix, doc–behavior checklist.

---

## TAMDEMO-45

See **Build plan** in `contribute/bucket-b/TAMDEMO_45_43_PLANS.md`. Proposes `contribute/start-here.md` (or `contribute/onboarding/README.md`), module outline, README/CONTRIBUTING navigation, ownership.

---

## TAMDEMO-43

See **Test plan** in `contribute/bucket-b/TAMDEMO_45_43_PLANS.md`. Automated validation, fresh-contributor walkthrough script, exit checklist.

---

## Suggested follow-up implementation issues (create in Linear)

1. **Docs drift Phase 0–1:** Link inventory + fix `contribute/` + `publish-your-plugin` inconsistencies; PR labeled `area/docs` or `area/contributor`.
2. **Docs drift Phase 2:** Plugin journey reconciliation (CONTRIBUTING ↔ docs tutorial ↔ developer portal).
3. **Bootstrap:** Implement chosen `scripts/dev-bootstrap.sh` (or `make dev-bootstrap`) + update developer-guide + CONTRIBUTING.
4. **Learning path:** Add `contribute/start-here.md` + README link + optional CONTRIBUTING one-liner.
5. **CI guardrail (optional):** `prettier:checkDocs` on `contribute/**/*.md` when those paths change.

After pasting comments and opening follow-ups, mark **TAMDEMO-50/47/48/46/45/43** Done per Linear “Done when” / “Exit criteria” for **planning deliverables** (these files). Keep issues **open** until implementation PRs land if you track execution separately.
