import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callOpenAI(system: string, user: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content ?? "";
}

export function createMcpServer() {
  const server = new McpServer({
    name: "meter-demo-mcp",
    version: "0.1.0",
  });

  // -------- Summarize Tool --------
  server.registerTool(
    "summarize_text",
    {
      description: "Summarize a piece of text concisely",
      inputSchema: {
        text: z.string().describe("Text to summarize"),
      },
    },
    async ({ text }) => {
      const summary = await callOpenAI(
        "You summarize text clearly and concisely.",
        text
      );

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      };
    }
  );

  // -------- Explain Tool --------
  server.registerTool(
    "explain_text",
    {
      description: "Explain text in simple or technical terms",
      inputSchema: {
        text: z.string().describe("Text to explain"),
        level: z
          .enum(["simple", "technical"])
          .default("simple")
          .describe("Explanation depth"),
      },
    },
    async ({ text, level }) => {
      const systemPrompt =
        level === "technical"
          ? "You explain text in clear technical detail."
          : "You explain text in very simple terms.";

      const explanation = await callOpenAI(systemPrompt, text);

      return {
        content: [
          {
            type: "text",
            text: explanation,
          },
        ],
      };
    }
  );

  return server;
}
