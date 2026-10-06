# Kapso Agent Skills

![Kapso Agent Skills](https://app.kapso.ai/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6ImI3YTg1NDE1LThjYzAtNGE2ZC04MGM3LWJhOGY2ODI0MTY3MSIsInB1ciI6ImJsb2JfaWQifX0=--1057c1ee33188e5afd42480e99937ae352e1a99b/kapso-agent-skills-image.png)

> **Alpha**: These skills are in active development and subject to rapid change.

Agent skills for [Kapso](https://kapso.ai), built on the open [Agent Skills](https://agentskills.io) format.

## Installation

```bash
npx skills add gokapso/agent-skills
```

## Environment Variables

Set these environment variables before using the skills:

```bash
export KAPSO_API_BASE_URL="https://api.kapso.ai"
export KAPSO_API_KEY="your-api-key"
```

| Variable | Description |
|----------|-------------|
| `KAPSO_API_BASE_URL` | Kapso API host. Use `https://api.kapso.ai` |
| `KAPSO_API_KEY` | API key from the Kapso web app at [app.kapso.ai](https://app.kapso.ai) |

## Path selection

- Prefer the Kapso CLI when it is installed and already authenticated. The skill docs show CLI-first flows where the CLI already covers the task well.
- Keep the provided scripts and direct API references as the fallback path when the CLI is unavailable or when a task still needs script-only operations.
- If you use the CLI path, start with `kapso login` and `kapso status`.

## What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that agents can discover and use to perform tasks more accurately. Each skill is a directory with a `SKILL.md` entrypoint and optional supporting files.

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
└── assets/           # Optional: templates, resources
```

Skills use **progressive disclosure**: agents load only the name and description at startup, then read full instructions when a task matches. This keeps context usage efficient while giving agents access to detailed knowledge on demand.

## Available skills

- **integrate-whatsapp-calling**: Connect voice agents, answer WhatsApp calls, handle outbound permission and dialing, and verify signaling/media
- **integrate-whatsapp**: Connect WhatsApp, set up webhooks, send messages/templates, manage flows
- **automate-whatsapp**: Build WhatsApp automations with workflows, agents, functions, and databases
- **observe-whatsapp**: Search Logs, debug delivery issues, inspect webhook deliveries, triage errors, run health checks

Each skill contains detailed documentation in its `SKILL.md` file.

## Maintenance

Shared references in this repo also exist under `kapso-docs/skills/skills`. Keep mirrored docs in sync when updating shared onboarding or API guidance.

Run the offline integration-skill regression tests with Node.js 20 or later:

```bash
node --test tests/integrate-whatsapp.test.mjs
```

The tests execute the bundled commands against a synthetic API double, compare supported requests and outputs with the recorded baseline, and exercise callback authentication, transport safeguards, and secret handling. They never contact Kapso or Meta. HTTPS API hosts remain configurable; trusted HTTP development endpoints require `KAPSO_ALLOW_INSECURE_HTTP=true`. See the integration skill's [credential handling](skills/integrate-whatsapp/references/webhooks-reference.md#credential-handling) for capturing one-time secrets privately.

## SKILL.md format

Each skill requires a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does and when to use it.
---

# My Skill

Instructions for the agent...
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase identifier (letters, numbers, hyphens) |
| `description` | Yes | When to use this skill (max 1024 chars) |

## Learn more

- [Agent Skills specification](https://agentskills.io/specification)
- [Authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Example skills](https://github.com/anthropics/skills)
