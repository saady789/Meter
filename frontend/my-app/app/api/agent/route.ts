import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";

const MCP_URL = "http://localhost:3001/mcp/mywallet";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // 1. Load MCP tools
  const client = new MultiServerMCPClient({
    meter: {
      url: MCP_URL,
      transport: "http",
    },
  });

  const tools = await client.getTools();

  // 2. Create model
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  // 3. Create agent with MCP tools
  const agent = createAgent({
    model: llm,
    tools,
  });

  // 4. Invoke agent
  const response = await agent.invoke({
    messages: [{ role: "user", content: message }],
  });

  const final = response.messages[response.messages.length - 1]?.content ?? "";

  return NextResponse.json({ reply: final });
}
