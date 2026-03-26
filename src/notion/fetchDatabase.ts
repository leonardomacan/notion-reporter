import { isFullPage } from "@notionhq/client";
import type { GroupedTasks, Task, TaskStatus } from "../types";
import { getNotionClient } from "./client";

const STATUS_PROPERTY_NAME = "Status";
const TITLE_PROPERTY_NAME = "Nome";

const STATUS_MAP: Record<string, TaskStatus> = {
  "Não iniciado": "nao_iniciado",
  "Em andamento": "em_andamento",
  Concluído: "concluido"
};

/**
 * Queries the Notion database with pagination and groups tasks by normalized status.
 * Returns grouped tasks with id, title, and status.
 */
export async function fetchDatabaseTasksGrouped(): Promise<GroupedTasks> {
  const notion = getNotionClient() as any;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  if (!notionDatabaseId) {
    throw new Error("NOTION_DATABASE_ID não foi definido.");
  }

  const groupedTasks: GroupedTasks = {
    nao_iniciado: [],
    em_andamento: [],
    concluido: []
  };

  let nextCursor: string | null | undefined = undefined;
  do {
    const response = await queryDatabasePage(notion, notionDatabaseId, nextCursor ?? undefined);

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

/**
 * Maps a Notion page result into a Task object.
 */
function mapNotionPageToTask(page: Parameters<typeof isFullPage>[0] & { properties: Record<string, any> }): Task | null {
  const titleProperty = page.properties[TITLE_PROPERTY_NAME];
  const statusProperty = page.properties[STATUS_PROPERTY_NAME];

  // NOTE: These property names and labels are user-specific assumptions and may need updates per workspace.
  const title = extractTitle(titleProperty);
  const status = extractStatus(statusProperty);

  if (!title) {
    console.warn(`Aviso: página ${page.id} sem título válido em "${TITLE_PROPERTY_NAME}". Ignorando.`);
    return null;
  }
  if (!status) {
    console.warn(`Aviso: página ${page.id} com status inválido em "${STATUS_PROPERTY_NAME}". Ignorando.`);
    return null;
  }

  return {
    id: page.id,
    title,
    status
  };
}

async function queryDatabasePage(notion: any, databaseId: string, startCursor?: string): Promise<any> {
  if (notion.databases?.query) {
    return notion.databases.query({
      database_id: databaseId,
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
      start_cursor: startCursor
    });
  }

  throw new Error("Cliente Notion sem método de query compatível.");
}

function extractTitle(property: any): string | null {
  if (!property || property.type !== "title" || !Array.isArray(property.title)) {
    return null;
  }
  const title = property.title.map((item: any) => item.plain_text ?? "").join("").trim();
  return title || null;
}

function extractStatus(property: any): TaskStatus | null {
  if (!property) {
    return null;
  }

  const label =
    property.type === "select"
      ? property.select?.name
      : property.type === "status"
        ? property.status?.name
        : null;

  if (!label) {
    return null;
  }
  return STATUS_MAP[label] ?? null;
}
