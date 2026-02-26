import "dotenv/config";
import path from "node:path";
import { promises as fs } from "node:fs";

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

const ROOT_DIR = path.resolve(process.cwd(), "workspace");

async function ensureWorkspace() {
  await fs.mkdir(ROOT_DIR, { recursive: true });
}

function getSafePath(userPath: string) {
  const resolved = path.resolve(ROOT_DIR, userPath || ".");
  if (!resolved.startsWith(ROOT_DIR)) {
    throw new Error("Path must stay inside ./workspace");
  }
  return resolved;
}

const listFilesTool = new DynamicStructuredTool({
  name: "list_files",
  description: "List files and directories in a workspace path.",
  schema: z.object({
    path: z.string().default("."),
  }),
  func: async ({ path: userPath }) => {
    const target = getSafePath(userPath);
    const entries = await fs.readdir(target, { withFileTypes: true });
    if (entries.length === 0) return "(empty)";

    return entries
      .map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`)
      .join("\n");
  },
});

const readFileTool = new DynamicStructuredTool({
  name: "read_file",
  description: "Read a UTF-8 text file from the workspace.",
  schema: z.object({
    path: z.string(),
  }),
  func: async ({ path: userPath }) => {
    const target = getSafePath(userPath);
    return await fs.readFile(target, "utf8");
  },
});

const writeFileTool = new DynamicStructuredTool({
  name: "write_file",
  description: "Write UTF-8 content to a file in the workspace (creates directories).",
  schema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  func: async ({ path: userPath, content }) => {
    const target = getSafePath(userPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, "utf8");
    return `Wrote ${userPath}`;
  },
});

const deleteFileTool = new DynamicStructuredTool({
  name: "delete_file",
  description: "Delete a file from the workspace.",
  schema: z.object({
    path: z.string(),
  }),
  func: async ({ path: userPath }) => {
    const target = getSafePath(userPath);
    await fs.unlink(target);
    return `Deleted ${userPath}`;
  },
});

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  const model = process.env.OLLAMA_MODEL || "Llama3.2";
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

  if (!input) {
    throw new Error('Usage: npm run agent -- "your filesystem task"');
  }

  await ensureWorkspace();

  const llm = new ChatOllama({ model, baseUrl, temperature: 0 });
  const tools = [listFilesTool, readFileTool, writeFileTool, deleteFileTool];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      [
        "You are a filesystem agent.",
        "Only use the provided tools to inspect or modify files.",
        "Never claim success unless a tool call succeeded.",
        "All file operations are restricted to ./workspace.",
      ].join(" "),
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createToolCallingAgent({ llm, tools, prompt });
  const executor = new AgentExecutor({ agent, tools, verbose: true });

  const result = await executor.invoke({ input });
  console.log("\nFinal response:\n", result.output);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});