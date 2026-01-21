# Reference

## Overview

This skill edits Kapso workflow graphs over the Platform API and provides local validation. Variables CRUD is not supported and will return blocked responses.

## Environment

Required env vars:

- `KAPSO_API_BASE_URL` (example: `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts

Each script is a single operation. Run with `node` or `bun`.

- `scripts/get-graph.js`
- `scripts/edit-graph.js`
- `scripts/update-graph.js`
- `scripts/validate-graph.js`
- `scripts/variables-list.js`
- `scripts/variables-set.js` (blocked)
- `scripts/variables-delete.js` (blocked)
- `scripts/list-provider-models.js`
- `scripts/list-execution-events.js`
- `scripts/get-execution-event.js`

## Platform API endpoints

Implemented calls:

- `GET /platform/v1/workflows/:id/definition` (fetch graph definition)
- `GET /platform/v1/workflows/:id` (lock_version precheck)
- `PATCH /platform/v1/workflows/:id` with `{ workflow: { definition } }`

Available endpoints:

- `GET /platform/v1/workflows/:id/variables` (workflow variable discovery)
- `GET /platform/v1/provider_models` (provider models list)
- `GET /platform/v1/workflow_executions/:id/events` (execution events list)
- `GET /platform/v1/workflow_events/:id` (execution event detail)

Variables CRUD endpoints are not defined for Platform API. Scripts intentionally return blocked for create/update/delete operations.

## Graph validation rules (local)

The `scripts/validate-graph.js` script checks:

- Exactly one start node with `id` = `start` and `data.node_type` = `start`.
- Unique node IDs and valid edge source/target IDs.
- Non-empty edge labels.
- Only `decide` nodes may branch; other nodes may have 0 or 1 outgoing `next` edge.
- Decide node condition labels must match outgoing edge labels.

Warnings are emitted for unknown node types or extra decide edges.

## Assets

- `assets/workflow-linear.json` (simple linear example)
- `assets/workflow-decision.json` (wait + decide example)
