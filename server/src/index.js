
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { tools, callTool } from "./mcp/tools.js";
import { handleMcp } from "./mcp/server.js";

// ==========================================
// 1. ENVIRONMENT CONFIGURATION
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root: faithlearn-ai-main/.env
const envPath = path.resolve(__dirname, "../../.env");

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.warn("Environment file not found:", envPath);
  console.warn("Create the root .env file before testing AI chat.");
}

// ==========================================
// 2. EXPRESS APPLICATION
// ==========================================

const app = express();
const port = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ==========================================
// 3. AMAZON BEDROCK CONFIGURATION
// ==========================================

const awsRegion = process.env.AWS_REGION || "us-east-1";

const bedrockModel =
  process.env.BEDROCK_MODEL_ID || "openai.gpt-oss-120b-1:0";
const bedrock = new BedrockRuntimeClient({
  region: awsRegion,
});

// AWS SDK uses AWS_BEARER_TOKEN_BEDROCK from the environment.
// Do not add fake AWS credentials or manually sign requests.



// ==========================================
// 4. HEALTH CHECK
// ==========================================

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "FaithLearn AI",
    version: "1.0.0",
    region: awsRegion,
    mcp: "/mcp",
    ai: "Amazon Bedrock",
  });
});

// ==========================================
// 5. AI CHAT ENDPOINT
// ==========================================

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    if (!process.env.AWS_BEARER_TOKEN_BEDROCK) {
      return res.status(503).json({
        error: "Amazon Bedrock API key is not configured.",
      });
    }

    // Prepare available MCP tools
    const toolConfig = {
      tools: tools.map((tool) => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            json: tool.inputSchema,
          },
        },
      })),
    };

    // Conversation messages
    const messages = [
      {
        role: "user",
        content: [{ text: message }],
      },
    ];

    // FaithLearn AI educational instructions
    const system = [
      {
        text:
          "You are FaithLearn AI, a friendly educational assistant. " +
          "Help children learn clearly, safely, and confidently. " +
          "Use simple explanations and examples appropriate for their age. " +
          "Encourage curiosity, critical thinking, and independent learning. " +
          "When student progress, lessons, quizzes, grading, or recommendations " +
          "are needed, use the available FaithLearn tools. " +
          "Never invent student progress or quiz results. " +
          "If information is unavailable, explain that clearly.",
      },
    ];

    // Maximum five AI/tool interaction rounds
    for (let attempt = 0; attempt < 5; attempt++) {
      const command = new ConverseCommand({
        modelId: bedrockModel,
        messages,
        system,
        toolConfig,
      });

      const response = await bedrock.send(command);

      const outputMessage = response.output?.message;

      if (!outputMessage) {
        throw new Error("Amazon Bedrock returned no message.");
      }

      messages.push(outputMessage);

      // ======================================
      // 6. MCP TOOL EXECUTION
      // ======================================

      if (response.stopReason === "tool_use") {
        const toolResults = [];

        for (const content of outputMessage.content || []) {
          if (!content.toolUse) continue;

          const toolName = content.toolUse.name;
          const toolInput = content.toolUse.input || {};
          const toolUseId = content.toolUse.toolUseId;

          console.log(`FaithLearn MCP tool: ${toolName}`);

          try {
            const result = await callTool(toolName, toolInput);

            toolResults.push({
              toolResult: {
                toolUseId,
                content: [
                  {
                    json: result ?? null,
                  },
                ],
              },
            });
          } catch (toolError) {
            console.error(
              `MCP tool error (${toolName}):`,
              toolError
            );

            toolResults.push({
              toolResult: {
                toolUseId,
                status: "error",
                content: [
                  {
                    text:
                      toolError.message ||
                      "The requested learning tool failed.",
                  },
                ],
              },
            });
          }
        }

        if (toolResults.length === 0) {
          throw new Error(
            "Bedrock requested tool execution but supplied no valid tools."
          );
        }

        // Send MCP results back to Bedrock
        messages.push({
          role: "user",
          content: toolResults,
        });

        continue;
      }

      // ======================================
      // 7. RETURN AI RESPONSE
      // ======================================

      const text =
        outputMessage.content
          ?.map((item) => item.text || "")
          .join("")
          .trim() || "I couldn't generate a response.";

      return res.json({
        response: text,
      });
    }

    return res.status(500).json({
      error: "FaithLearn AI reached its maximum tool-call limit.",
    });

  } catch (error) {
    console.error("FaithLearn Bedrock error:", {
      name: error.name,
      message: error.message,
      requestId: error.$metadata?.requestId,
    });

    return res.status(500).json({
      error: "FaithLearn AI could not complete your request.",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

// ==========================================
// 8. DIRECT MCP TOOL ENDPOINT
// ==========================================

app.post("/api/tool", async (req, res) => {
  try {
    const { name, arguments: toolArguments = {} } = req.body || {};

    if (!name) {
      return res.status(400).json({
        error: "Tool name is required.",
      });
    }

    const result = await callTool(name, toolArguments);

    return res.json(result);

  } catch (error) {
    console.error("Direct MCP tool error:", error);

    return res.status(400).json({
      error: error.message,
    });
  }
});

// ==========================================
// 9. MCP SERVER ENDPOINT
// ==========================================

app.all("/mcp", async (req, res) => {
  try {
    await handleMcp(req, res);

  } catch (error) {
    console.error("MCP server error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "MCP request failed.",
      });
    }
  }
});

// ==========================================
// 10. START SERVER
// ==========================================

app.listen(port, () => {
  console.log("-----------------------------------");
  console.log("FaithLearn AI Backend Started");
  console.log("-----------------------------------");
  console.log(`API: http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`MCP: http://localhost:${port}/mcp`);
  console.log(`AWS Region: ${awsRegion}`);
  console.log(`Bedrock Model: ${bedrockModel}`);
  console.log("-----------------------------------");
});
