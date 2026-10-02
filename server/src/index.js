import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
import cors from "cors";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { tools, callTool } from "./mcp/tools.js";
import { handleMcp } from "./mcp/server.js";
const app = express();
const port = process.env.PORT || 8787;
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const bedrockModel =
  process.env.BEDROCK_MODEL_ID || "openai.gpt-oss-120b-1:0";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "FaithLearn AI", mcp: "/mcp" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

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

    const messages = [
      {
        role: "user",
        content: [{ text: message }],
      },
    ];

    const system = [
      {
        text:
          "You are FaithLearn AI, a friendly educational assistant. " +
          "Help children learn clearly and safely. " +
          "Use simple explanations and examples appropriate for their age. " +
          "When student progress, lessons, quizzes, grading, or recommendations " +
          "are needed, use the available FaithLearn tools.",
      },
    ];

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
        throw new Error("Bedrock returned no message.");
      }

      messages.push(outputMessage);

      if (response.stopReason === "tool_use") {
        const toolResults = [];

        for (const content of outputMessage.content || []) {
          if (!content.toolUse) continue;

          const toolName = content.toolUse.name;
          const toolInput = content.toolUse.input || {};
          const toolUseId = content.toolUse.toolUseId;

          console.log(`FaithLearn tool requested: ${toolName}`);
          console.log("Tool input:", toolInput);

          try {
            const result = await callTool(toolName, toolInput);

            toolResults.push({
              toolResult: {
                toolUseId,
                content: [
                  {
                    json: result,
                  },
                ],
              },
            });
          } catch (toolError) {
            toolResults.push({
              toolResult: {
                toolUseId,
                status: "error",
                content: [
                  {
                    text: toolError.message,
                  },
                ],
              },
            });
          }
        }

        messages.push({
          role: "user",
          content: toolResults,
        });

        continue;
      }

      const text =
        outputMessage.content
          ?.map((item) => item.text || "")
          .join("") || "I couldn't generate a response.";

      return res.json({
        response: text,
      });
    }

    return res.status(500).json({
      error: "FaithLearn AI used too many tool calls.",
    });
  } catch (error) {
    console.error("Bedrock error:", error);

    res.status(500).json({
      error: "FaithLearn AI could not reach Amazon Bedrock.",
    });
  }
});
  
app.post("/api/tool", async (req, res) => {
  try {
    const result = await callTool(req.body.name, req.body.arguments || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.all("/mcp", async (req, res) => {
  try {
    await handleMcp(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`FaithLearn API: http://localhost:${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
});
