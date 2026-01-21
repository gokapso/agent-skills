---
name: \<skill-name\>
description: \<what this skill does and when to use it\>
---

# \<Skill Title\>

## When to use this skill

- Use when: \<trigger phrases / user intent\>
- Do not use when: \<common false positives\>

## Quickstart

This skill assumes a bash-capable sandbox that includes the skills snapshot at `/agent-skills`.

Search within the snapshot:

- `rg -n \"\<keyword\>\" /agent-skills -S`

Run the script:

- `npx tsx /agent-skills/\<skill-name\>/scripts/cli.ts --help`

## Workflow

1. Confirm inputs (project id, key, environment).
2. Run the relevant script command(s).
3. Validate outputs and surface next steps.

## Scripts

- `scripts/cli.ts`: the main entrypoint (prints JSON to stdout)
- `scripts/lib/kapso-api.ts`: tiny fetch wrapper for Kapso Platform API

## References and assets

- See `references/REFERENCE.md` for longer docs/playbooks.
- See `assets/` for schemas, sample payloads, and templates.

