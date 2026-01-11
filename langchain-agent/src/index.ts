import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import fetch from "node-fetch";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";

const MCP_URL = "https://demo-mcp.up.railway.app/mcp";

const client = new MultiServerMCPClient({
  meter: {
    url: MCP_URL,
    transport: "http",
  },
});

const tools = await client.getTools();
console.log("Loaded tools:", tools);

const llm = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4",
});

const agent = createAgent({
  model: llm,
  tools,
});

const response = await agent.invoke({
  messages: [
    { role: "user", content: "Can you explain how quantum computing works?" },
  ],
});

console.log("Agent response:", response);
