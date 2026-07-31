import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { blogger_v3 } from "googleapis";
import { z } from "zod";
import { handleApiError } from "../errors.js";

export function registerBlogTools(server: McpServer, blogger: blogger_v3.Blogger): void {
  server.tool(
    "blogger_blogs_get",
    "Retrieve a single blog's metadata by its unique blog ID. Returns blog details like name, description, URL, and post/page counts.",
    {
      blogId: z.string().describe("The unique identifier of the blog to retrieve."),
      maxPosts: z.number().optional().describe("Maximum number of posts to pull back with the blog (e.g., 5)."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the blog. Use ADMIN for most details.")
    },
    async ({ blogId, maxPosts, view }) => {
      try {
        const res = await blogger.blogs.get({ blogId, maxPosts, view });
        if (!res.data) {
          return { content: [{ type: "text", text: `No blog found with ID ${blogId}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_blogs_get");
      }
    }
  );

  server.tool(
    "blogger_blogs_getByUrl",
    "Retrieve a single blog's metadata by its public URL. Useful when you only know the blog address.",
    {
      url: z.string().describe("The full public URL of the blog to retrieve (e.g., 'https://myblog.blogspot.com')."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the blog. Use ADMIN for most details.")
    },
    async ({ url, view }) => {
      try {
        const res = await blogger.blogs.getByUrl({ url, view });
        if (!res.data) {
          return { content: [{ type: "text", text: `No blog found at URL ${url}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_blogs_getByUrl");
      }
    }
  );

  server.tool(
    "blogger_blogs_listByUser",
    "List all blogs associated with a specific user. Returns an array of blogs.",
    {
      userId: z.string().optional().describe("ID of the user whose blogs are to be fetched. Defaults to 'self' for the authenticated user."),
      fetchUserInfo: z.boolean().optional().describe("Whether the response is a list of blogs with per-user information instead of just blogs."),
      role: z.array(z.enum(['ADMIN', 'AUTHOR', 'READER'])).optional().describe("User roles set to filter the blogs returned."),
      status: z.array(z.enum(['DELETED', 'LIVE'])).optional().describe("Blog statuses to filter the returned blogs."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the blogs. Use ADMIN for most details.")
    },
    async ({ userId, fetchUserInfo, role, status, view }) => {
      try {
        const res = await blogger.blogs.listByUser({ userId: userId ?? 'self', fetchUserInfo, role, status, view });
        const items = res.data?.items ?? [];
        return { 
          content: [
            { type: "text", text: `Found ${items.length} blogs.\n\n${JSON.stringify(res.data, null, 2)}` }
          ] 
        };
      } catch (error) {
        return handleApiError(error, "blogger_blogs_listByUser");
      }
    }
  );
}
