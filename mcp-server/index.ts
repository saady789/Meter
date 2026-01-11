import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export function createMcpServer() {
  const server = new McpServer({
    name: "meter-demo-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "echo",
    {
      description: "Echo back the provided message",
      inputSchema: {
        message: z.string().describe("Message to echo"),
      },
    },
    async ({ message }) => {
      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      };
    }
  );

  return server;
}

// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error("meter MCP server running (stdio)");
// }

// main().catch((err) => {
//   console.error("Fatal error:", err);
// });
