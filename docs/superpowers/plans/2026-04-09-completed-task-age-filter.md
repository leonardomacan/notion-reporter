# Completed Task Age Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filter out completed Notion tasks older than N days at the API query level, before any block content is fetched, to save Notion API calls and Claude tokens.

**Architecture:** Add a Notion API `filter` to the database query that uses `last_edited_time` to exclude completed tasks older than `COMPLETED_TASK_MAX_AGE_DAYS` days (default: 7). Extract the env var parsing and cutoff date computation into a small helper so it can be unit tested. The filter is built once per run and passed into the existing `queryDatabasePage` function.

**Tech Stack:** TypeScript, `@notionhq/client`, Jest + ts-jest for unit tests

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/notion/fetchDatabase.ts` | Modify | Add filter constant, env var parsing, cutoff date helper, pass filter to query |
| `src/utils/dateFilter.ts` | Create | `getCompletedTaskCutoffDate(envValue: string \| undefined): Date` — isolated, testable |
| `src/utils/dateFilter.test.ts` | Create | Unit tests for cutoff date parsing and fallback logic |
| `package.json` | Modify | Add Jest + ts-jest dependencies and test script |
| `jest.config.js` | Create | Jest config for TypeScript |

---

### Task 1: Install and configure Jest

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev jest ts-jest @types/jest
```

Expected: packages added to `node_modules`, `package.json` devDependencies updated.

- [ ] **Step 2: Add test script to `package.json`**

In `package.json`, add `"test": "jest"` to the `"scripts"` block:

```json
"scripts": {
  "start": "ts-node src/index.ts",
  "build": "tsc",
  "dev": "ts-node --watch src/index.ts",
  "test": "jest"
}
```

- [ ] **Step 3: Create `jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
};
```

- [ ] **Step 4: Verify Jest runs**

```bash
npm test
```

Expected output: `No tests found` or `Test Suites: 0 passed` — no errors, just no tests yet.

- [ ] **Step 5: Commit**

```bash
git add package.json jest.config.js package-lock.json
git commit -m "chore: add jest + ts-jest for unit testing"
```

---

### Task 2: Create and test the cutoff date helper

**Files:**
- Create: `src/utils/dateFilter.ts`
- Create: `src/utils/dateFilter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/dateFilter.test.ts`:

```typescript
import { getCompletedTaskCutoffDate } from "./dateFilter";

describe("getCompletedTaskCutoffDate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-09T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a date 7 days ago when env var is undefined", () => {
    const cutoff = getCompletedTaskCutoffDate(undefined);
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("returns a date N days ago when env var is a valid positive integer", () => {
    const cutoff = getCompletedTaskCutoffDate("14");
    const expected = new Date("2026-03-26T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is zero", () => {
    const cutoff = getCompletedTaskCutoffDate("0");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is negative", () => {
    const cutoff = getCompletedTaskCutoffDate("-3");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is not a number", () => {
    const cutoff = getCompletedTaskCutoffDate("abc");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is a float", () => {
    const cutoff = getCompletedTaskCutoffDate("3.5");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL with `Cannot find module './dateFilter'`

- [ ] **Step 3: Implement `src/utils/dateFilter.ts`**

```typescript
const DEFAULT_MAX_AGE_DAYS = 7;

/**
 * Returns the cutoff Date before which completed tasks should be excluded.
 * Reads COMPLETED_TASK_MAX_AGE_DAYS from the provided env value.
 * Falls back to 7 days if the value is missing, non-integer, zero, or negative.
 */
export function getCompletedTaskCutoffDate(envValue: string | undefined): Date {
  const days = parseMaxAgeDays(envValue);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

function parseMaxAgeDays(envValue: string | undefined): number {
  if (envValue === undefined || envValue.trim() === "") {
    return DEFAULT_MAX_AGE_DAYS;
  }

  const parsed = Number(envValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(
      `Aviso: COMPLETED_TASK_MAX_AGE_DAYS inválido ("${envValue}"). Usando padrão de ${DEFAULT_MAX_AGE_DAYS} dias.`
    );
    return DEFAULT_MAX_AGE_DAYS;
  }

  return parsed;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/dateFilter.ts src/utils/dateFilter.test.ts
git commit -m "feat: add cutoff date helper for completed task age filter"
```

---

### Task 3: Wire the filter into `fetchDatabase.ts`

**Files:**
- Modify: `src/notion/fetchDatabase.ts`

- [ ] **Step 1: Add the import and constant at the top of `fetchDatabase.ts`**

After the existing imports, add:

```typescript
import { getCompletedTaskCutoffDate } from "../utils/dateFilter";
```

After the existing constants `STATUS_PROPERTY_NAME` and `TITLE_PROPERTY_NAME`, add:

```typescript
const COMPLETED_STATUS_LABEL = "Concluído";
```

- [ ] **Step 2: Compute the cutoff and build the filter in `fetchDatabaseTasksGrouped`**

Replace the opening of `fetchDatabaseTasksGrouped` so it computes the cutoff and builds the filter before the query loop. The full updated function:

```typescript
export async function fetchDatabaseTasksGrouped(): Promise<GroupedTasks> {
  const notion = getNotionClient() as any;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  if (!notionDatabaseId) {
    throw new Error("NOTION_DATABASE_ID não foi definido.");
  }

  const cutoff = getCompletedTaskCutoffDate(process.env.COMPLETED_TASK_MAX_AGE_DAYS);
  const filter = buildCompletedTaskFilter(cutoff);

  const groupedTasks: GroupedTasks = {
    nao_iniciado: [],
    em_andamento: [],
    concluido: []
  };

  let nextCursor: string | null | undefined = undefined;
  do {
    const response = await queryDatabasePage(notion, notionDatabaseId, filter, nextCursor ?? undefined);

    for (const result of response.results) {
      if (!isFullPage(result)) {
        continue;
      }

      const mappedTask = mapNotionPageToTask(result);
      if (!mappedTask) {
        continue;
      }
      groupedTasks[mappedTask.status].push(mappedTask);
    }

    nextCursor = response.has_more ? response.next_cursor : null;
  } while (nextCursor);

  return groupedTasks;
}
```

- [ ] **Step 3: Add the `buildCompletedTaskFilter` function**

Add this new function to `fetchDatabase.ts`, after the `STATUS_MAP` constant:

```typescript
function buildCompletedTaskFilter(cutoff: Date): object {
  return {
    or: [
      {
        property: STATUS_PROPERTY_NAME,
        status: { does_not_equal: COMPLETED_STATUS_LABEL }
      },
      {
        and: [
          {
            property: STATUS_PROPERTY_NAME,
            status: { equals: COMPLETED_STATUS_LABEL }
          },
          {
            timestamp: "last_edited_time",
            last_edited_time: { on_or_after: cutoff.toISOString() }
          }
        ]
      }
    ]
  };
}
```

- [ ] **Step 4: Update `queryDatabasePage` to accept and pass the filter**

Replace the existing `queryDatabasePage` function signature and body:

```typescript
async function queryDatabasePage(notion: any, databaseId: string, filter: object, startCursor?: string): Promise<any> {
  if (notion.databases?.query) {
    return notion.databases.query({
      database_id: databaseId,
      filter,
      start_cursor: startCursor
    });
  }

  if (notion.dataSources?.query) {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const firstDataSourceId = database?.data_sources?.[0]?.id;
    if (!firstDataSourceId) {
      throw new Error("Não foi possível localizar data source para o database informado.");
    }
    return notion.dataSources.query({
      data_source_id: firstDataSourceId,
      filter,
      start_cursor: startCursor
    });
  }

  throw new Error("Cliente Notion sem método de query compatível.");
}
```

- [ ] **Step 5: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all 6 tests still PASS.

- [ ] **Step 6: Build to confirm TypeScript compiles cleanly**

```bash
npm run build
```

Expected: no errors, `dist/` updated.

- [ ] **Step 7: Commit**

```bash
git add src/notion/fetchDatabase.ts
git commit -m "feat: filter completed tasks older than COMPLETED_TASK_MAX_AGE_DAYS from Notion query"
```

---

## Manual Smoke Test

After completing all tasks, verify end-to-end:

1. Set `COMPLETED_TASK_MAX_AGE_DAYS=1` in `.env` and run `npm start` — confirm only very recently completed tasks appear in the report.
2. Remove `COMPLETED_TASK_MAX_AGE_DAYS` from `.env` and run again — confirm default 7-day window applies (check for the warning message in the console if you had an invalid value).
3. Set `COMPLETED_TASK_MAX_AGE_DAYS=abc` — confirm the warning `Aviso: COMPLETED_TASK_MAX_AGE_DAYS inválido` is printed and the run succeeds with the 7-day default.
