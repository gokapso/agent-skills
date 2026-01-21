---
name: kapso-workflow-graph-editing
description: "Edit Kapso workflow graphs via the Platform API with safe fetch/update steps, local validation, and workflow variable discovery. Use when reading or modifying workflow graph JSON, validating graph structure, or checking workflow variables/models/events."
---

# Kapso Workflow Graph Editing

## Quickstart

- Set env vars: `KAPSO_API_BASE_URL`, `KAPSO_API_KEY`, `PROJECT_ID`.
- Fetch the graph: `node scripts/get-graph.js <workflow_id>` (or `bun scripts/get-graph.js <workflow_id>`).
- Edit the JSON definition (see `assets/`) or patch: `node scripts/edit-graph.js <workflow_id> --expected-lock-version <n> --old-file <path> --new-file <path>`.
- Validate the graph: `node scripts/validate-graph.js --workflow-id <workflow_id>`.
- Update with optimistic locking: `node scripts/update-graph.js <workflow_id> --expected-lock-version <n> --definition-file <path>`.

## Commands

### Graph operations

- `node scripts/get-graph.js <workflow-id>`: fetch workflow definition + lock_version.
- `node scripts/edit-graph.js <workflow-id> --expected-lock-version <n> --old <text>|--old-file <path> --new <text>|--new-file <path> [--replace-all]`: patch the definition by text replacement.
- `node scripts/update-graph.js <workflow-id> --expected-lock-version <n> --definition-file <path>|--definition-json <json>`: update definition with precheck.
- `node scripts/validate-graph.js --workflow-id <id> | --definition-file <path> | --definition-json <json>`: local validation only.

### Variables, models, events

- `node scripts/variables-list.js <workflow-id>`: list discovered workflow variables.
- `node scripts/variables-set.js <workflow-id> --name <name> --value <value>`: blocked (CRUD not available).
- `node scripts/variables-delete.js <workflow-id> --name <name>`: blocked (CRUD not available).
- `node scripts/list-provider-models.js`: list provider models.
- `node scripts/list-execution-events.js <execution-id> [--event-type <type>] [--page <n>] [--per-page <n>]`: list execution events.
- `node scripts/get-execution-event.js <event-id>`: fetch execution event detail.

## Graph editing rules

- Keep exactly one start node with `id` = `start`.
- Never change existing node IDs.
- Use `{node_type}_{timestamp_ms}` for new node IDs.
- Keep one outgoing `next` edge for non-decide nodes; only decide nodes branch.
- Match decide edge labels to `conditions[].label`.
- Use wait_for_response only for data capture; branch by adding a decide node afterward.

## Notes

- Expect JSON output on stdout for every command.
- Run scripts with `node` or `bun`; each file performs a single operation.
- The Platform API does not enforce `lock_version` yet; edit/update scripts precheck and warn on conflicts.
- Blocked commands return `blocked: true` with the missing endpoint details.

## References and assets

- `references/REFERENCE.md`
- `assets/workflow-linear.json`
- `assets/workflow-decision.json`
