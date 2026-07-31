import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { blogger_v3 } from "googleapis";
import { z } from "zod";
import { handleApiError } from "../errors.js";

export function registerCommentTools(server: McpServer, blogger: blogger_v3.Blogger): void {
  server.tool(
    "blogger_comments_list",
    "List all comments for a specific post. Returns an array of comment objects.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      maxResults: z.number().optional().describe("Maximum number of comments to return."),
      pageToken: z.string().optional().describe("Token for pagination to fetch the next page of results."),
      startDate: z.string().optional().describe("Start date (RFC 3339 format)."),
      endDate: z.string().optional().describe("End date (RFC 3339 format)."),
      status: z.enum(["EMPTIED", "LIVE", "PENDING", "SPAM"]).optional().describe("Status of the comments to retrieve."),
      fetchBodies: z.boolean().optional().default(true).describe("Whether to fetch the full HTML bodies of the comments."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the comments.")
    },
    async ({ blogId, postId, maxResults, pageToken, startDate, endDate, status, fetchBodies, view }) => {
      try {
        const res = await blogger.comments.list({
          blogId,
          postId,
          maxResults,
          pageToken,
          startDate,
          endDate,
          status,
          fetchBodies,
          view
        });
        const items = res.data?.items ?? [];
        return { content: [{ type: "text", text: `Found ${items.length} comments.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_list");
      }
    }
  );

  server.tool(
    "blogger_comments_listByBlog",
    "List comments across all posts in a blog. Useful for a global comment moderation view.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      maxResults: z.number().optional().describe("Maximum number of comments to return."),
      pageToken: z.string().optional().describe("Token for pagination."),
      startDate: z.string().optional().describe("Start date (RFC 3339)."),
      endDate: z.string().optional().describe("End date (RFC 3339)."),
      status: z.array(z.enum(["EMPTIED", "LIVE", "PENDING", "SPAM"])).optional().describe("Statuses of the comments to retrieve."),
      fetchBodies: z.boolean().optional().describe("Whether to fetch the full HTML bodies of the comments.")
    },
    async ({ blogId, maxResults, pageToken, startDate, endDate, status, fetchBodies }) => {
      try {
        const res = await blogger.comments.listByBlog({
          blogId,
          maxResults,
          pageToken,
          startDate,
          endDate,
          status,
          fetchBodies
        });
        const items = res.data?.items ?? [];
        return { content: [{ type: "text", text: `Found ${items.length} comments.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_listByBlog");
      }
    }
  );

  server.tool(
    "blogger_comments_get",
    "Retrieve a single specific comment by its unique comment ID.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      commentId: z.string().describe("The unique identifier of the comment."),
      view: z.enum(["ADMIN", "AUTHOR", "READER"]).optional().describe("Access level with which to view the comment.")
    },
    async ({ blogId, postId, commentId, view }) => {
      try {
        const res = await blogger.comments.get({ blogId, postId, commentId, view });
        if (!res.data) {
          return { content: [{ type: "text", text: `No comment found with ID ${commentId}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_get");
      }
    }
  );

  server.tool(
    "blogger_comments_approve",
    "Approve a comment, removing it from spam or pending status and making it live.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      commentId: z.string().describe("The unique identifier of the comment to approve.")
    },
    async ({ blogId, postId, commentId }) => {
      try {
        const res = await blogger.comments.approve({ blogId, postId, commentId });
        return { content: [{ type: "text", text: `Comment ${commentId} approved successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_approve");
      }
    }
  );

  server.tool(
    "blogger_comments_delete",
    "Permanently delete a comment from a post.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      commentId: z.string().describe("The unique identifier of the comment to delete.")
    },
    async ({ blogId, postId, commentId }) => {
      try {
        await blogger.comments.delete({ blogId, postId, commentId });
        return { content: [{ type: "text", text: `Comment ${commentId} successfully deleted.` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_delete");
      }
    }
  );

  server.tool(
    "blogger_comments_removeContent",
    "Remove comment content, replacing it with an admin notice, without fully deleting the comment object.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      commentId: z.string().describe("The unique identifier of the comment to remove content from.")
    },
    async ({ blogId, postId, commentId }) => {
      try {
        const res = await blogger.comments.removeContent({ blogId, postId, commentId });
        return { content: [{ type: "text", text: `Comment ${commentId} content removed.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_removeContent");
      }
    }
  );

  server.tool(
    "blogger_comments_markAsSpam",
    "Mark a comment as spam, moving it out of the live view.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post."),
      commentId: z.string().describe("The unique identifier of the comment to mark as spam.")
    },
    async ({ blogId, postId, commentId }) => {
      try {
        const res = await blogger.comments.markAsSpam({ blogId, postId, commentId });
        return { content: [{ type: "text", text: `Comment ${commentId} marked as spam.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_comments_markAsSpam");
      }
    }
  );
}
