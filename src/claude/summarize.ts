import Anthropic from "@anthropic-ai/sdk";
import type { GroupedTasks } from "../types";

const SYSTEM_PROMPT = `Você é um assistente profissional que ajuda pessoas a comunicar o progresso do seu trabalho.
Receberá dados estruturados de tarefas de um banco de dados Notion divididas em três categorias:
em andamento, não iniciadas e concluídas. Cada tarefa pode conter notas de atualização escritas pelo usuário.

Gere um resumo em português claro e natural, no seguinte formato:
- O que está sendo feito agora e qual o progresso de cada item
- O que ainda está no backlog
- O que já foi concluído

Seja objetivo, profissional e use primeira pessoa. Não invente informações que não estejam nos dados. Não use emojis ou símbolos decorativos; use apenas texto em PT-BR.`;

/**
 * Sends grouped task data to Claude and returns a natural language PT-BR summary.
 */
export async function summarizeWithClaude(groupedTasks: GroupedTasks): Promise<string> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY não foi definido.");
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Gere um resumo profissional em PT-BR no formato solicitado com base nestes dados:\n\n${JSON.stringify(groupedTasks, null, 2)}`
            }
          ]
        }
      ]
    });

    const firstText = response.content.find((item) => item.type === "text");
    return (firstText?.type === "text" ? firstText.text : "").trim();
  } catch (error) {
    console.warn("Aviso: falha ao gerar resumo com Claude. Retornando fallback com dados estruturados.");
    return `Resumo automático indisponível no momento.\n\nDados estruturados:\n${JSON.stringify(groupedTasks, null, 2)}`;
  }
}
