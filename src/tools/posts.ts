import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { blogger_v3 } from "googleapis";
import { z } from "zod";
import { handleApiError } from "../errors.js";

/**
 * Cleans raw markdown code blocks (e.g. ```html ... ```) from post content HTML.
 */
function cleanHtmlContent(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith("```html") && cleaned.endsWith("```")) {
    cleaned = cleaned.substring(7, cleaned.length - 3).trim();
  } else if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned.substring(3, cleaned.length - 3).trim();
  }
  return cleaned;
}

/**
 * Strips heavy post HTML content if summaryOnly is set to true.
 */
function formatPostsData(data: blogger_v3.Schema$PostList, summaryOnly?: boolean) {
  if (!summaryOnly || !data.items) return data;
  return {
    ...data,
    items: data.items.map(({ content, ...rest }) => rest),
  };
}

export function registerPostTools(server: McpServer, blogger: blogger_v3.Blogger): void {
  server.tool(
    "blogger_posts_list",
    "List posts for a specific blog, with optional filtering, pagination, and lightweight summary mode.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      maxResults: z.number().optional().describe("Maximum number of posts to fetch."),
      pageToken: z.string().optional().describe("Token for pagination to fetch the next page of results."),
      labels: z.string().optional().describe("Comma-separated list of labels to filter by."),
      status: z.array(z.enum(['DRAFT', 'LIVE', 'SCHEDULED'])).optional().describe("List of post statuses to include."),
      orderBy: z.enum(['PUBLISHED', 'UPDATED']).optional().describe("Sort order for the posts."),
      startDate: z.string().optional().describe("Start date (RFC 3339 format)."),
      endDate: z.string().optional().describe("End date (RFC 3339 format)."),
      fetchBodies: z.boolean().default(true).describe("Whether to fetch full post bodies from the API."),
      fetchImages: z.boolean().optional().describe("Whether to fetch image metadata for the posts."),
      summaryOnly: z
        .boolean()
        .default(false)
        .describe(
          "If true, strips heavy HTML content from response items to return a compact summary (title, ID, labels, dates, status) without large payloads."
        ),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the returned result.")
    },
    async ({ blogId, maxResults, pageToken, labels, status, orderBy, startDate, endDate, fetchBodies, fetchImages, summaryOnly, view }) => {
      try {
        const res = await blogger.posts.list({
          blogId,
          maxResults,
          pageToken,
          labels,
          status,
          orderBy,
          startDate,
          endDate,
          fetchBodies,
          fetchImages,
          view
        });
        const items = res.data?.items ?? [];
        const formattedData = formatPostsData(res.data, summaryOnly);
        return { content: [{ type: "text", text: `Found ${items.length} posts (summaryOnly: ${summaryOnly}).\n\n${JSON.stringify(formattedData, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_list");
      }
    }
  );

  server.tool(
    "blogger_posts_get",
    "Retrieve a single blog post by its unique ID, including content, metadata, labels, and optionally comments and images.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to retrieve."),
      fetchBody: z.boolean().default(true).describe("Whether to fetch the full HTML post body."),
      fetchImages: z.boolean().optional().describe("Whether to fetch image metadata."),
      maxComments: z.number().optional().describe("Maximum number of comments to fetch alongside the post."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the post.")
    },
    async ({ blogId, postId, fetchBody, fetchImages, maxComments, view }) => {
      try {
        const res = await blogger.posts.get({
          blogId,
          postId,
          fetchBody,
          fetchImages,
          maxComments,
          view
        });
        if (!res.data) {
          return { content: [{ type: "text", text: `No post found with ID ${postId}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_get");
      }
    }
  );

  server.tool(
    "blogger_posts_getByPath",
    "Retrieve a single blog post by its URL path. Useful when resolving public blog links.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      path: z.string().describe("URL path of the post, e.g. /2024/01/my-post.html"),
      maxComments: z.number().optional().describe("Maximum number of comments to fetch."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the post.")
    },
    async ({ blogId, path, maxComments, view }) => {
      try {
        const res = await blogger.posts.getByPath({
          blogId,
          path,
          maxComments,
          view
        });
        if (!res.data) {
          return { content: [{ type: "text", text: `No post found with path ${path}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_getByPath");
      }
    }
  );

  server.tool(
    "blogger_posts_search",
    "Search across a blog's posts using a text query string, with optional lightweight summary mode.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      q: z.string().describe("Search query string to search for in posts."),
      fetchBodies: z.boolean().optional().describe("Whether to fetch full post bodies in the results."),
      summaryOnly: z
        .boolean()
        .default(false)
        .describe("If true, strips heavy HTML content from search result items."),
      orderBy: z.enum(['PUBLISHED', 'UPDATED']).optional().describe("Sort order for the search results.")
    },
    async ({ blogId, q, fetchBodies, summaryOnly, orderBy }) => {
      try {
        const res = await blogger.posts.search({
          blogId,
          q,
          fetchBodies,
          orderBy
        });
        const items = res.data?.items ?? [];
        const formattedData = formatPostsData(res.data, summaryOnly);
        return { content: [{ type: "text", text: `Found ${items.length} search results for query "${q}".\n\n${JSON.stringify(formattedData, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_search");
      }
    }
  );

  server.tool(
    "blogger_posts_searchByLabel",
    "Quickly filter and retrieve posts for a blog by a specific label (tag).",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      label: z.string().describe("The exact label to filter posts by (e.g. 'Tech' or 'News')."),
      maxResults: z.number().optional().describe("Maximum number of posts to fetch."),
      pageToken: z.string().optional().describe("Pagination token."),
      status: z.array(z.enum(['DRAFT', 'LIVE', 'SCHEDULED'])).optional().describe("Filter by post status."),
      summaryOnly: z
        .boolean()
        .default(false)
        .describe("If true, strips heavy HTML content from response items to return a lightweight summary.")
    },
    async ({ blogId, label, maxResults, pageToken, status, summaryOnly }) => {
      try {
        const res = await blogger.posts.list({
          blogId,
          labels: label,
          maxResults,
          pageToken,
          status
        });
        const items = res.data?.items ?? [];
        const formattedData = formatPostsData(res.data, summaryOnly);
        return {
          content: [
            {
              type: "text",
              text: `Found ${items.length} posts matching label "${label}".\n\n${JSON.stringify(formattedData, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return handleApiError(error, "blogger_posts_searchByLabel");
      }
    }
  );

  server.tool(
    "blogger_posts_insert",
    "Create a new blog post.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      title: z.string().describe("Title of the new post."),
      content: z.string().describe("Full HTML content of the new post (Markdown wrappers will be automatically cleaned)."),
      labels: z.array(z.string()).optional().describe("List of labels (tags) to apply to the post."),
      isDraft: z.boolean().default(false).describe("Whether to create the post as a draft (true) or publish it immediately (false)."),
      customMetaData: z.string().optional().describe("Custom metadata string for the post.")
    },
    async ({ blogId, title, content, labels, isDraft, customMetaData }) => {
      try {
        const cleanedContent = cleanHtmlContent(content);
        const res = await blogger.posts.insert({
          blogId,
          isDraft,
          requestBody: {
            title,
            content: cleanedContent,
            labels,
            customMetaData
          }
        });
        return { content: [{ type: "text", text: `Post created successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_insert");
      }
    }
  );

  server.tool(
    "blogger_posts_update",
    "Perform a full update of an existing blog post. Replaces the entire post content.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to update."),
      title: z.string().describe("The new title of the post."),
      content: z.string().describe("The new HTML content of the post (Markdown wrappers will be automatically cleaned)."),
      labels: z.array(z.string()).optional().describe("The new list of labels for the post."),
      publish: z.boolean().optional().describe("Whether to publish the post upon updating."),
      revert: z.boolean().optional().describe("Whether to revert the post to draft status.")
    },
    async ({ blogId, postId, title, content, labels, publish, revert }) => {
      try {
        const cleanedContent = cleanHtmlContent(content);
        const res = await blogger.posts.update({
          blogId,
          postId,
          publish,
          revert,
          requestBody: {
            title,
            content: cleanedContent,
            labels
          }
        });
        return { content: [{ type: "text", text: `Post updated successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_update");
      }
    }
  );

  server.tool(
    "blogger_posts_patch",
    "Perform a partial update of a blog post, updating only the provided fields.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to update."),
      title: z.string().optional().describe("The new title of the post (optional)."),
      content: z.string().optional().describe("The new HTML content of the post (optional)."),
      labels: z.array(z.string()).optional().describe("The new list of labels (optional)."),
      publish: z.boolean().optional().describe("Whether to publish the post upon updating."),
      revert: z.boolean().optional().describe("Whether to revert the post to draft status.")
    },
    async ({ blogId, postId, title, content, labels, publish, revert }) => {
      try {
        const requestBody: blogger_v3.Schema$Post = {};
        if (title !== undefined) requestBody.title = title;
        if (content !== undefined) requestBody.content = cleanHtmlContent(content);
        if (labels !== undefined) requestBody.labels = labels;

        const res = await blogger.posts.patch({
          blogId,
          postId,
          publish,
          revert,
          requestBody
        });
        return { content: [{ type: "text", text: `Post patched successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_patch");
      }
    }
  );

  server.tool(
    "blogger_posts_delete",
    "Permanently delete a blog post.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to delete.")
    },
    async ({ blogId, postId }) => {
      try {
        await blogger.posts.delete({
          blogId,
          postId
        });
        return { content: [{ type: "text", text: `Post ${postId} successfully deleted from blog ${blogId}.` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_delete");
      }
    }
  );

  server.tool(
    "blogger_posts_publish",
    "Publish a draft blog post, either immediately or scheduled for the future.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to publish."),
      publishDate: z.string().optional().describe("ISO 8601 date-time string to schedule publishing for the future.")
    },
    async ({ blogId, postId, publishDate }) => {
      try {
        const res = await blogger.posts.publish({
          blogId,
          postId,
          publishDate
        });
        return { content: [{ type: "text", text: `Post published successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_publish");
      }
    }
  );

  server.tool(
    "blogger_posts_revert",
    "Revert a published blog post back to a draft.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      postId: z.string().describe("The unique identifier of the post to revert.")
    },
    async ({ blogId, postId }) => {
      try {
        const res = await blogger.posts.revert({
          blogId,
          postId
        });
        return { content: [{ type: "text", text: `Post reverted to draft successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_posts_revert");
      }
    }
  );
}
