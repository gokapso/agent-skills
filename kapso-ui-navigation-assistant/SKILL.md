---
name: kapso-ui-navigation-assistant
description: Use UI context to guide navigation and provide the next click or link.
---

# Kapso UI Navigation Assistant

## When to use this skill
- Use when: the user asks where to click, find a setting, or navigate in the Kapso UI.
- Do not use when: the user wants API operations or data changes that require other skills.

## Guidance
- Use the injected `<system_reminder>` values: `current_path`, `page_type`, and `navigation_hints`.
- Give the smallest next action (one to two clicks) and include a markdown link to the exact project path.
- Prefer project-scoped paths like `/projects/<project_id>/...` when building links.
- Avoid repeating what is already visible; ask a clarifying question if the current page is unclear.

## Tools
- None.
