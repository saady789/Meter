import express from "express";
import { createMcpServer } from "./mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
const app = express();
app.use(express.json());

const mcpServer = createMcpServer();

// In-memory session store
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const body = req.body;
  const isInit = body?.method === "initialize";

  let sessionId = req.header("mcp-session-id") || undefined;
  let transport: StreamableHTTPServerTransport;

  if (isInit) {
    sessionId = randomUUID();

    transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });

    transports.set(sessionId, transport);

    await mcpServer.connect(transport);

    res.setHeader("Mcp-Session-Id", sessionId);
  } else {
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Invalid or missing session" },
        id: body?.id ?? null,
      });
      return;
    }

    transport = transports.get(sessionId)!;
  }

  try {
    await transport.handleRequest(req, res, body);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: body?.id ?? null,
      });
    }
  }
});

app.listen(3000, () => {
  console.log("MCP HTTP server running on http://localhost:3000/mcp");
});
