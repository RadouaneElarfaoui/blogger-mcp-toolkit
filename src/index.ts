#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createBloggerClient } from "./auth.js";
import { registerBlogTools } from "./tools/blogs.js";
import { registerPostTools } from "./tools/posts.js";
import { registerPageTools } from "./tools/pages.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerUserTools } from "./tools/users.js";
import { registerMediaTools } from "./tools/media.js";

async function main() {
  const config = loadConfig();
  const blogger = createBloggerClient(config);

  const server = new McpServer({
    name: "blogger-mcp-toolkit",
    version: "1.1.0",
  });

  // Register all tool groups
  registerBlogTools(server, blogger);
  registerPostTools(server, blogger);
  registerPageTools(server, blogger);
  registerCommentTools(server, blogger);
  registerUserTools(server, blogger);
  registerMediaTools(server);

  // Connect via STDIO transport
  const transport = new StdioServerTransport();

  const shutdown = async (signal: string) => {
    console.error(`Received ${signal}. Shutting down blogger-mcp-toolkit...`);
    try {
      await server.close();
      console.error("Server closed successfully.");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown("uncaughtException");
  });

  console.error("Starting blogger-mcp-toolkit MCP server v1.1.0...");
  await server.connect(transport);
  console.error("blogger-mcp-toolkit MCP server connected.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
