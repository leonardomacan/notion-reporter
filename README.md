# Notion Reporter CLI (TypeScript)

## What this does

This project is a local CLI that reads tasks from a Notion database, groups them by status, fetches each task page content recursively (notes, checklists, updates), and asks Claude to generate a natural PT-BR status report that you can print in the terminal and optionally save to a file.

## Prerequisites

- Node.js 18+
- A Notion integration token with access to your database
- An Anthropic API key

### Notion integration setup

1. Create a Notion integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Copy the integration token and set it as `NOTION_TOKEN`.
3. Open your Notion database page and click `...` -> `Add connections` -> select your integration.
4. Copy the database ID from the URL:
   - `https://www.notion.so/workspace/<DATABASE_ID>?v=...`
   - Use the 32-char `<DATABASE_ID>` value as `NOTION_DATABASE_ID`.

## How to set up

```bash
npm install
cp .env.example .env
```

Fill `.env` with your real values:

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
OUTPUT_TO_FILE=false
OBSIDIAN_VAULT_PATH=/absolute/path/to/your/obsidian/vault
COMPLETED_TASK_MAX_AGE_DAYS=7
```

Run locally:

```bash
npm start
```

Build:

```bash
npm run build
```

## How to configure Notion

This implementation assumes:

- Status property name: `Status`
- Title property name: `Nome`
- Status labels:
  - `Não iniciado`
  - `Em andamento`
  - `Concluído`

If your database uses different names/labels, update `src/notion/fetchDatabase.ts` constants:

- `STATUS_PROPERTY_NAME`
- `TITLE_PROPERTY_NAME`
- `STATUS_MAP`

## How to customize

- **Status property/labels**: edit `src/notion/fetchDatabase.ts`.
- **Output language/tone**: edit the system prompt in `src/claude/summarize.ts`.
- **File output toggle**: set `OUTPUT_TO_FILE=true` to save Markdown reports in `output/` and in your Obsidian vault `Daily Reports/`.
- **Obsidian destination**: set `OBSIDIAN_VAULT_PATH` to your vault absolute path.
- **Completed task age filter**: set `COMPLETED_TASK_MAX_AGE_DAYS` to control how many days back completed tasks are included (default: `7`). Completed tasks older than this are excluded before any block content is fetched, saving Notion API calls and Claude tokens.

## Project structure

```text
notion-reporter/
├── src/
│   ├── index.ts
│   ├── notion/
│   │   ├── client.ts
│   │   ├── fetchDatabase.ts
│   │   └── fetchPageBlocks.ts
│   ├── claude/
│   │   └── summarize.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── formatBlocks.ts
├── output/
│   └── .gitkeep
├── .env
├── .env.example
├── .gitignore
├── .cursorrules
├── package.json
├── tsconfig.json
└── README.md
```
