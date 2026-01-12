import express from "express";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import cors from "cors";
import axios from "axios";
import { prisma } from "./prisma";
import { Readable } from "node:stream";
const mcpSessions = new Map<string, string>();

import Mnee, { type SdkConfig } from "@mnee/ts-sdk";

const config: SdkConfig = {
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

app.post("/mcp/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const body = req.body;

  console.log("Received MCP request:", body);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { tools: true },
  });

  if (!provider) {
    return res.status(404).json({ error: "Provider not found" });
  }

  // 1. HANDLE MCP INITIALIZE
  if (body?.method === "initialize") {
    const upstreamInit = await axios.post(provider.mcpUrl, body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/mcp+json, text/event-stream",
      },
      validateStatus: () => true,
    });

    const newSessionId = upstreamInit.headers["mcp-session-id"];
    if (newSessionId) {
      mcpSessions.set(providerId, newSessionId);
    }

    return res.status(200).json(upstreamInit.data);
  }

  // 2. TOOL CALL PAYMENT GATE
  if (body?.method === "tools/call") {
    console.log("Tool call detected");

    const toolName = body?.params?.name;
    const tool = provider.tools.find((t) => t.toolName === toolName);

    if (!tool) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: body.id,
        error: {
          code: -32602,
          message: "Unknown tool",
        },
      });
    }

    const amount = tool.priceCents / 100;

    const recipients = [
      {
        address: provider.walletPublicKey,
        amount,
      },
    ];

    try {
      const response = await mnee.transfer(
        recipients,
        process.env.AGENT_PRIVATE_KEY!
      );

      await prisma.payment.create({
        data: {
          providerId: provider.id,
          toolId: tool.id,
          fromAddress: process.env.AGENT_PUBLIC_KEY!,
          toAddress: provider.walletPublicKey,
          amountCents: tool.priceCents,
          amountDecimal: amount,
          currency: "MNEE",
          ticketId: response.ticketId,
          status: "SUCCESS",
        },
      });

      console.log(
        `Payment success. Ticket ${response.ticketId}. ${amount} MNEE sent to ${provider.walletPublicKey}`
      );
    } catch (err) {
      console.error("Payment failed", err);

      return res.status(200).json({
        jsonrpc: "2.0",
        id: body.id,
        error: {
          code: 40201,
          message: "Payment failed",
          data: {
            tool: toolName,
            priceCents: tool.priceCents,
            wallet: provider.walletPublicKey,
            currency: "MNEE",
          },
        },
      });
    }
  }

  // 3. FORWARD TO REAL MCP SERVER
  const sessionId = mcpSessions.get(providerId);

  const upstream = await axios.post(provider.mcpUrl, body, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, application/mcp+json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    validateStatus: () => true,
  });

  return res.status(200).json(upstream.data);
});

app.get("/mcp/:providerId", async (req, res) => {
  const { providerId } = req.params;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    return res.status(404).end();
  }

  console.log("provider is ", provider);

  const sessionId = mcpSessions.get(providerId);

  const upstream = await fetch(provider.mcpUrl, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
  });

  if (!upstream.body) {
    return res.status(502).end();
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  Readable.fromWeb(upstream.body as any).pipe(res);
});

app.get("/wallet/balance", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Missing wallet address" });
    }

    const raw = await mnee.balance(address);

    res.json({
      address,
      amount: raw.amount,
      decimalAmount: raw.decimalAmount,
      currency: "MNEE",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

app.get("/payments", async (req, res) => {
  try {
    // since there is only one provider, we fetch all
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
