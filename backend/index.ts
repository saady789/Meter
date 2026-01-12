import express from "express";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import cors from "cors";
import { prisma } from "./prisma";
import Mnee from "@mnee/ts-sdk";
const config = {
  environment: "sandbox", // or 'production'
  apiKey: "2f34b06c0a17aa40f2cce70ace9db3e6",
};

const mnee = new Mnee(config);
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json()); // ✅ Make sure this is included to parse JSON bodies
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
// Health check route
app.get("/", (_req, res) => {
  res.send("MNEE MCP Proxy Service is running.");
});

app.post("/verify", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing url in body" });
  }

  try {
    const client = new MultiServerMCPClient({
      meter: {
        url,
        transport: "http",
      },
    });

    const tools = await client.getTools();

    // Extract minimal info to return
    const toolInfo = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));

    return res.status(200).json({ tools: toolInfo });
  } catch (e) {
    console.error("Tool fetch error:", e);
    return res.status(500).json({ error: "Failed to connect to MCP server" });
  }
});

app.post("/verify-wallet", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Missing address" });
  }

  try {
    const balance = await mnee.balance(address);

    return res.status(200).json({
      verified: true,
      balance: balance.decimalAmount,
    });
  } catch (err) {
    return res.status(400).json({
      verified: false,
      error: "Wallet verification failed",
    });
  }
});

app.post("/register-service", async (req, res) => {
  const { providerId, mcpUrl, walletPublicKey, tools } = req.body;

  // Basic validation
  if (!providerId || !mcpUrl || !walletPublicKey || !Array.isArray(tools)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    // Use a transaction so either everything is written or nothing is
    await prisma.$transaction(async (tx) => {
      // 1. Create provider
      await tx.provider.create({
        data: {
          id: providerId,
          mcpUrl,
          walletPublicKey,
        },
      });

      // 2. Create tools
      for (const tool of tools) {
        if (!tool.toolName || typeof tool.priceCents !== "number") {
          throw new Error("Invalid tool data");
        }

        await tx.tool.create({
          data: {
            providerId,
            toolName: tool.toolName,
            priceCents: tool.priceCents,
          },
        });
      }
    });

    // 3. Return the monetized MCP link
    return res.status(201).json({
      success: true,
      monetizedMcpUrl: `http://localhost:3001/mcp/${providerId}`,
    });
  } catch (error: any) {
    console.error("Register service error:", error);

    // Handle duplicate providerId cleanly
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Provider ID already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to register MCP service",
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
