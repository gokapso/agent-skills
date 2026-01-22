# Kapso Agent Skills

This folder contains **Agent Skills** in the open `agentskills` format: each skill is a directory with a `SKILL.md` entrypoint and optional `scripts/`, `references/`, and `assets/`.

Skills live here as a standalone, exportable snapshot. This repo is **not** served by Mintlify.

## How Kapso Agent uses this folder

- The Kapso Agent runtime loads the local discovery manifest at `cientos-rails/agent-skills/index.json`.
- When a skill is activated, the runtime loads the referenced `SKILL.md` and injects it into the agent context (progressive disclosure).
- For “actionable” skills, `SKILL.md` should point to `scripts/*` that can run in a bash-capable sandbox.

## Local workflow (for now)

- `cientos-rails/agent-skills/index.json` is maintained manually and **must be committed** with every PR that changes skills.
- Add/remove skill entries as you add/remove skill folders.
- Keep `path` values relative to the skills root (e.g. `webhooks/SKILL.md`).

## Script runtime

Default: **Node 18+ or Bun**. Scripts should run with `node` or `bun` (avoid `tsx`).
If you want TypeScript, compile to JS before execution.

Expected env vars (provided by Kapso Agent sandbox runner):

- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY` (project API key)
- `PROJECT_ID`
- `KAPSO_META_BASE_URL` (optional, Meta proxy base; defaults to `${KAPSO_API_BASE_URL}/meta`)
- `KAPSO_META_GRAPH_VERSION` (optional, defaults to `v24.0`)

## Output contract for scripts

Scripts should:

- print machine-readable JSON to stdout on success
- print a machine-readable JSON error to stderr on failure
- exit `0` on success, non-zero on failure

See `_template/` for a copy/paste starter.
