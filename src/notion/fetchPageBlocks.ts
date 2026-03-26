import { getNotionClient } from "./client";
import { formatBlockLine } from "../utils/formatBlocks";

/**
 * Recursively fetches all blocks from a page and returns concatenated plain text.
 */
export async function fetchPageBlocksPlainText(pageId: string): Promise<string> {
  const notion = getNotionClient();
  const lines = await fetchChildrenLines(notion, pageId, 0);
  return lines.join("\n").trim();
}

async function fetchChildrenLines(notion: ReturnType<typeof getNotionClient>, blockId: string, depth: number): Promise<string[]> {
  const allLines: string[] = [];
  let nextCursor: string | null | undefined = undefined;
  let numberedIndex = 1;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: nextCursor ?? undefined
    });

    for (const block of response.results) {
      if (!("type" in block)) {
        continue;
      }

      const formattedLine = formatBlockLine(block, numberedIndex);
      if (block.type === "numbered_list_item") {
        numberedIndex += 1;
      } else {
        numberedIndex = 1;
      }

      if (formattedLine !== null) {
        const indent = "  ".repeat(depth);
        allLines.push(`${indent}${formattedLine}`);
      } else {
        const intentionallySkippedTypes = new Set(["link_preview", "table"]);
        if (!intentionallySkippedTypes.has(block.type)) {
          console.warn(`Aviso: bloco não suportado (${block.type}) em ${block.id}. Ignorando.`);
        }
      }

      if (block.has_children) {
        const childrenLines = await fetchChildrenLines(notion, block.id, depth + 1);
        allLines.push(...childrenLines);
      }
    }

    nextCursor = response.has_more ? response.next_cursor : null;
  } while (nextCursor);

  return allLines;
}
