# Local Workflow Source

Use the Kapso CLI source-sync workflow when the user wants workflows and functions in a local repo.

## Setup

```bash
npm install -g @kapso/cli
npm install --save-dev @kapso/workflows
kapso login
kapso link --project <project-id>
kapso pull
```

`kapso link` binds the current directory to one Kapso project. `kapso pull` writes the local source tree.

```text
kapso.yaml
.kapso/project.json
.kapso/remote-map.json
functions/<function-slug>/function.yaml
functions/<function-slug>/index.js
workflows/<workflow-slug>/workflow.yaml
workflows/<workflow-slug>/definition.json
workflows/<workflow-slug>/workflow.js
```

Commit `kapso.yaml`, `.kapso/project.json`, `.kapso/remote-map.json`, `functions/`, and `workflows/` when the repo is shared. The remote map stores the last pulled remote state for stale-update and dirty-file checks.

## Workflow code

`kapso pull` creates `workflow.js` next to `definition.json` when no workflow source file exists. Edit `workflow.js`, or create `workflow.ts`, when code should be the source of truth.

```ts
import { START, Workflow } from "@kapso/workflows";

const workflow = new Workflow("support-router", {
  name: "Support Router",
  status: "draft",
});

workflow.addTrigger({
  type: "inbound_message",
  phoneNumberId: "<phone-number-id>",
});

workflow.addNode(START, {
  position: { x: 100, y: 100 },
});

workflow.addNode("reply", {
  type: "send_text",
  message: "Thanks for reaching out.",
});

workflow.addEdge(START, "reply");

export default workflow;
```

Use `rawConfig` for advanced node configuration. Use slugs for local references when possible: `functionSlug` for functions and `workflowSlug` for called workflows.

Project Event triggers and `emit_event` nodes are supported in local source files. Use this source shape when a workflow needs event triggers or event emission.

In `workflow.yaml`, add the trigger:

```yaml
triggers:
  - triggerType: project_event
    triggerableAttributes:
      event_name: conversation.csat_scored
      property_key: score
      operator: gte
      property_value: 4
```

In `workflow.js` or `workflow.ts`, add the node with `@kapso/workflows`:

```ts
workflow.addNode("record_score", {
  type: "emit_event",
  eventName: "conversation.csat_scored",
  properties: { score: "{{vars.score}}", source: "workflow" },
});
```

## Build and push

```bash
kapso build
kapso push --dry-run
kapso push workflow <workflow-slug>
```

Use `kapso push` to push every changed local function and workflow. Use `kapso push function <function-slug>` for one function.

If a workflow source file exists and changed, `kapso push` compiles it before uploading. If no workflow code file exists, the CLI uses `workflow.yaml` and `definition.json` directly, so JSON-only editing still works.

## Pull behavior

- `kapso pull` preserves hand-authored `workflow.js` and `workflow.ts` files.
- `kapso pull` updates remote-owned `workflow.yaml` and `definition.json`.
- `kapso pull` refuses to overwrite dirty remote-owned files.
- `kapso pull --diff` shows blocked incoming diffs.
- `kapso pull --overwrite` replaces local remote-owned files with remote versions.

When code is the source of truth, committing generated `workflow.yaml` and `definition.json` is a repo decision. Commit them when reviewable generated diffs are useful; ignore them when the team wants only authored workflow code in git.

## When to use API scripts instead

Use `scripts/get-graph.js`, `scripts/update-graph.js`, and related Platform API scripts only when:

- the user cannot use the local CLI source-sync repo,
- you need direct graph inspection for debugging,
- a task is not yet supported by `kapso pull/build/push`,
- or you need one-off API operations such as execution inspection.
