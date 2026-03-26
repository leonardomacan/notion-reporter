import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { GroupedTasks, Task } from "./types";
import { fetchDatabaseTasksGrouped } from "./notion/fetchDatabase";
import { fetchPageBlocksPlainText } from "./notion/fetchPageBlocks";
import { summarizeWithClaude } from "./claude/summarize";

/**
 * Entry point to orchestrate Notion fetching, Claude summarization and output.
 */
async function main(): Promise<void> {
  validateRequiredEnvVars(["NOTION_TOKEN", "NOTION_DATABASE_ID", "ANTHROPIC_API_KEY"]);

  const groupedTasks = await fetchDatabaseTasksGrouped();
  await enrichTasksWithBlocks(groupedTasks);
  const summary = await summarizeWithClaude(groupedTasks);

  printSummary(summary);

  if (isOutputToFileEnabled()) {
    await saveSummaryToFiles(summary);
  }
}

function validateRequiredEnvVars(requiredKeys: string[]): void {
  const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());
  if (missingKeys.length === 0) {
    return;
  }

  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missingKeys.join(", ")}. Preencha o arquivo .env e tente novamente.`
  );
}

async function enrichTasksWithBlocks(groupedTasks: GroupedTasks): Promise<void> {
  const allTasks: Task[] = [
    ...groupedTasks.nao_iniciado,
    ...groupedTasks.em_andamento,
    ...groupedTasks.concluido
  ];

  for (const task of allTasks) {
    try {
      const blocksText = await fetchPageBlocksPlainText(task.id);
      if (!blocksText) {
        console.warn(`Aviso: página ${task.id} (${task.title}) não possui conteúdo de bloco.`);
      }
      task.blocks = blocksText;
    } catch (error) {
      console.warn(`Aviso: falha ao buscar blocos da página ${task.id} (${task.title}). Seguindo sem blocos.`);
      task.blocks = "";
    }
  }
}

function printSummary(summary: string): void {
  console.log("\n================ RELATORIO DIARIO ================\n");
  console.log(summary || "Nenhum resumo foi retornado.");
  console.log("\n==================================================\n");
}

function isOutputToFileEnabled(): boolean {
  return String(process.env.OUTPUT_TO_FILE ?? "false").toLowerCase() === "true";
}

async function saveSummaryToFiles(summary: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `report-${timestamp}.md`;

  const outputDirectory = resolve(process.cwd(), "output");
  const localFilePath = resolve(outputDirectory, fileName);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(localFilePath, summary, "utf8");
  console.log(`Relatório salvo em: ${localFilePath}`);

  const obsidianVaultPath = process.env.OBSIDIAN_VAULT_PATH?.trim();
  if (!obsidianVaultPath) {
    console.warn(
      'Aviso: "OBSIDIAN_VAULT_PATH" não foi definido. O relatório foi salvo apenas em output/.'
    );
    return;
  }

  const dailyReportsDirectory = resolve(obsidianVaultPath, "Daily Reports");
  const obsidianFilePath = resolve(dailyReportsDirectory, fileName);
  await mkdir(dailyReportsDirectory, { recursive: true });
  await writeFile(obsidianFilePath, summary, "utf8");
  console.log(`Relatório salvo no Obsidian em: ${obsidianFilePath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro desconhecido.";
  console.error(`Erro fatal: ${message}`);
  process.exit(1);
});
