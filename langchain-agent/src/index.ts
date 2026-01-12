//    ╭─────────────────────  Private Key  ──────────────────────╮
//    │                                                          │
//    │   🔑 Private Key Export                                  │
//    │                                                          │
//    │   💰 Wallet: saadyagent                                  │
//    │   • Environment: sandbox                                 │
//    │   • Address: 1C6HcLAt7azWL43mMjtLwvrdExeKgdqXCh          │
//    │                                                          │
//    │   🔒 WIF Private Key:                                    │
//    │   L198NT9Wavm8KGRb5CYzfRmdy8AinvaAkjrWDXYMZoKvHpqK73aU   │
//    │                                                          │
//    │   ⚠️  KEEP THIS KEY SAFE!                                │
//    │   Never share it with anyone!

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import fetch from "node-fetch";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";

const MCP_URL = "http://localhost:3001/mcp/mywallet";

const client = new MultiServerMCPClient({
  meter: {
    url: MCP_URL,
    transport: "http",
  },
});

const tools = await client.getTools();
console.dir(tools, { depth: null });

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
