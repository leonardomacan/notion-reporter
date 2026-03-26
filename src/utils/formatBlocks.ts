/**
 * Converts a Notion-like rich_text array into plain text.
 */
export function extractRichTextPlain(richText: Array<{ plain_text?: string }> = []): string {
  return richText.map((fragment) => fragment.plain_text ?? "").join("").trim();
}

/**
 * Formats a single Notion block into human-readable text.
 */
export function formatBlockLine(block: any, numberedIndex?: number): string | null {
  switch (block.type) {
    case "paragraph":
      return extractRichTextPlain(block.paragraph.rich_text);
    case "heading_1":
      return `## ${extractRichTextPlain(block.heading_1.rich_text)}`;
    case "heading_2":
      return `### ${extractRichTextPlain(block.heading_2.rich_text)}`;
    case "heading_3":
      return `#### ${extractRichTextPlain(block.heading_3.rich_text)}`;
    case "bulleted_list_item":
      return `- ${extractRichTextPlain(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `${numberedIndex ?? 1}. ${extractRichTextPlain(block.numbered_list_item.rich_text)}`;
    case "to_do": {
      const text = extractRichTextPlain(block.to_do.rich_text);
      return `${block.to_do.checked ? "[x]" : "[ ]"} ${text}`;
    }
    case "callout":
      return `> ${extractRichTextPlain(block.callout.rich_text)}`;
    case "quote":
      return `> ${extractRichTextPlain(block.quote.rich_text)}`;
    case "toggle":
      return `- ${extractRichTextPlain(block.toggle.rich_text)}`;
    case "table_row": {
      const cells: Array<Array<{ plain_text?: string }>> = block.table_row?.cells ?? [];
      const cellTexts = cells.map((cell) => extractRichTextPlain(cell)).filter((t) => t);
      // Flatten each table row so Claude can still read table content.
      return cellTexts.length ? `| ${cellTexts.join(" | ")} |` : "";
    }
    case "table":
      // The table wrapper doesn't contain the actual row contents; skip to avoid noise.
      return null;
    case "link_preview":
      // We use link previews only as pointers elsewhere; no need to include content in the summary.
      return null;
    default:
      return null;
  }
}
