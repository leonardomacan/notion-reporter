# Design: Completed Task Age Filter

**Date:** 2026-04-09  
**Status:** Approved

## Problem

The pipeline fetches all completed (`concluido`) tasks from Notion regardless of age, including their full block content. Old completed tasks waste Notion API calls (block fetching) and Claude input tokens.

## Goal

Skip completed tasks older than N days before fetching their blocks, saving both Notion API calls and Claude tokens. N defaults to 7 and is configurable.

## Chosen Approach

**Notion API filter at query time** — add a filter to the `databases.query` call so that old completed tasks are never returned by the API at all. This eliminates waste at the earliest possible point in the pipeline.

The filter uses Notion's built-in `last_edited_time` timestamp (system metadata, always present, no user setup required). For completed tasks, only pages edited within the last N days are returned. Non-completed tasks are unaffected.

### Why `last_edited_time`

- Automatically tracked by Notion on every page
- Not updated by opening or moving a card — only by editing content or properties
- Reliable proxy for "when was this task last worked on" given the workflow has no retroactive editing of completed tasks

## Filter Logic

```
(status != "Concluído")
OR
(status == "Concluído" AND last_edited_time >= today - N days)
```

In Notion API filter syntax:

```json
{
  "filter": {
    "or": [
      {
        "property": "Status",
        "status": { "does_not_equal": "Concluído" }
      },
      {
        "and": [
          { "property": "Status", "status": { "equals": "Concluído" } },
          { "timestamp": "last_edited_time", "last_edited_time": { "on_or_after": "<cutoff ISO string>" } }
        ]
      }
    ]
  }
}
```

## Configuration

New optional env var: `COMPLETED_TASK_MAX_AGE_DAYS`

- Default: `7`
- If set to a non-positive or non-integer value, logs a warning and falls back to `7`
- Computed once at the start of `fetchDatabaseTasksGrouped`

## Scope

- **Only file changed:** `src/notion/fetchDatabase.ts`
- **Also updated:** `README.md`, `.env.example`
- No changes to types, block fetching, Claude summarization, or output logic

## Constants Added

`COMPLETED_STATUS_LABEL = "Concluído"` — used in the filter to avoid magic strings. Lives alongside `STATUS_PROPERTY_NAME` and `TITLE_PROPERTY_NAME`.

## Edge Cases

- If `COMPLETED_TASK_MAX_AGE_DAYS=0` or negative: warn and default to `7`
- If `COMPLETED_TASK_MAX_AGE_DAYS` is not a number: warn and default to `7`
- Tasks with status not in `STATUS_MAP` are already ignored upstream — no change needed
