import { Client } from "@notionhq/client";

/**
 * Creates and returns an authenticated Notion client instance.
 */
export function getNotionClient(): Client {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    throw new Error("NOTION_TOKEN não foi definido.");
  }

  return new Client({ auth: notionToken });
}
