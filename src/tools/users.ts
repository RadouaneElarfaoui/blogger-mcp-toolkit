import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { blogger_v3 } from "googleapis";
import { z } from "zod";
import { handleApiError } from "../errors.js";

export function registerUserTools(server: McpServer, blogger: blogger_v3.Blogger): void {
  server.tool(
    "blogger_users_get",
    "Retrieve a user's Blogger profile information. Returns details like user ID, display name, profile URL, and location.",
    {
      userId: z.string().optional().default("self").describe('The ID of the user to retrieve, or "self" for the currently authenticated user.'),
    },
    async ({ userId }) => {
      try {
        const res = await blogger.users.get({ userId });
        if (!res.data) {
          return { content: [{ type: "text", text: "No user data found." }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_users_get");
      }
    }
  );
}
