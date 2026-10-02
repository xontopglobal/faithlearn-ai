import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { tools, callTool } from "./tools.js";

export function createMcpServer() {
  const server = new McpServer({
    name: "faithlearn-ai",
    version: "0.1.0"
  });

  server.registerTool(
    "get_student_progress",
    {
      description: tools[0].description,
      inputSchema: { studentId: z.string().optional() }
    },
    async ({ studentId }) => ({
      content: [{ type: "text", text: JSON.stringify(await callTool("get_student_progress", { studentId })) }]
    })
  );

  server.registerTool(
    "get_lesson",
    {
      description: tools[1].description,
      inputSchema: {
        subject: z.string(),
        topic: z.string(),
        age: z.number().optional()
      }
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await callTool("get_lesson", args)) }]
    })
  );

  server.registerTool(
    "create_quiz",
    {
      description: tools[2].description,
      inputSchema: {
        subject: z.string(),
        topic: z.string(),
        count: z.number().optional()
      }
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await callTool("create_quiz", args)) }]
    })
  );

  server.registerTool(
    "grade_answer",
    {
      description: tools[3].description,
      inputSchema: {
        answer: z.string(),
        expected: z.string(),
        studentId: z.string().optional(),
        subject: z.string().optional()
      }
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await callTool("grade_answer", args)) }]
    })
  );

  server.registerTool(
    "recommend_lesson",
    {
      description: tools[4].description,
      inputSchema: { studentId: z.string().optional() }
    },
    async ({ studentId }) => ({
      content: [{ type: "text", text: JSON.stringify(await callTool("recommend_lesson", { studentId })) }]
    })
  );

  return server;
}

export async function handleMcp(req, res) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
