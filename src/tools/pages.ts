import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { blogger_v3 } from "googleapis";
import { z } from "zod";
import { handleApiError } from "../errors.js";

/**
 * Cleans raw markdown code blocks (e.g. ```html ... ```) from page content HTML.
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
 * Strips heavy page HTML content if summaryOnly is set to true.
 */
function formatPagesData(data: blogger_v3.Schema$PageList, summaryOnly?: boolean) {
  if (!summaryOnly || !data.items) return data;
  return {
    ...data,
    items: data.items.map(({ content, ...rest }) => rest),
  };
}

export function registerPageTools(server: McpServer, blogger: blogger_v3.Blogger): void {
  server.tool(
    "blogger_pages_list",
    "List all static pages for a specific blog, with optional summary mode to strip heavy HTML.",
    {
      blogId: z.string().describe("The unique identifier of the blog to list pages for."),
      fetchBodies: z.boolean().optional().describe("Whether to retrieve full HTML content from the API."),
      status: z.array(z.enum(['DRAFT', 'IMPORTED', 'LIVE'])).optional().describe("Array of page statuses to include in results."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the pages."),
      maxResults: z.number().optional().describe("Maximum number of pages to fetch."),
      pageToken: z.string().optional().describe("Token for pagination."),
      summaryOnly: z
        .boolean()
        .default(false)
        .describe(
          "If true, strips heavy HTML content from response items to return a lightweight summary (title, ID, dates, status)."
        )
    },
    async ({ blogId, fetchBodies, status, view, maxResults, pageToken, summaryOnly }) => {
      try {
        const res = await blogger.pages.list({ blogId, fetchBodies, status, view, maxResults, pageToken });
        const items = res.data?.items ?? [];
        const formattedData = formatPagesData(res.data, summaryOnly);
        return { content: [{ type: "text", text: `Found ${items.length} pages (summaryOnly: ${summaryOnly}).\n\n${JSON.stringify(formattedData, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_list");
      }
    }
  );

  server.tool(
    "blogger_pages_get",
    "Retrieve a single static page by its unique page ID, including its content and metadata.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      pageId: z.string().describe("The unique identifier of the page to retrieve."),
      view: z.enum(['ADMIN', 'AUTHOR', 'READER']).optional().describe("Access level with which to view the page.")
    },
    async ({ blogId, pageId, view }) => {
      try {
        const res = await blogger.pages.get({ blogId, pageId, view });
        if (!res.data) {
          return { content: [{ type: "text", text: `No page found with ID ${pageId}.` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_get");
      }
    }
  );

  server.tool(
    "blogger_pages_insert",
    "Create a new static page for a blog with the specified title and HTML content.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      title: z.string().describe("The title of the new page."),
      content: z.string().describe("The full HTML content of the new page (Markdown wrappers will be automatically cleaned)."),
      isDraft: z.boolean().optional().default(false).describe("Whether to create the page as a draft (true) or published (false).")
    },
    async ({ blogId, title, content, isDraft }) => {
      try {
        const cleanedContent = cleanHtmlContent(content);
        const res = await blogger.pages.insert({
          blogId,
          isDraft,
          requestBody: { title, content: cleanedContent }
        });
        return { content: [{ type: "text", text: `Page created successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_insert");
      }
    }
  );

  server.tool(
    "blogger_pages_update",
    "Perform a full update of an existing static page. Replaces the entire page with the new title and content.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      pageId: z.string().describe("The unique identifier of the page to update."),
      title: z.string().describe("The new title of the page."),
      content: z.string().describe("The new HTML content of the page (Markdown wrappers will be automatically cleaned)."),
      publish: z.boolean().optional().describe("Whether to publish the page upon update."),
      revert: z.boolean().optional().describe("Whether to revert the page to draft status.")
    },
    async ({ blogId, pageId, title, content, publish, revert }) => {
      try {
        const cleanedContent = cleanHtmlContent(content);
        const res = await blogger.pages.update({
          blogId,
          pageId,
          publish,
          revert,
          requestBody: { title, content: cleanedContent }
        });
        return { content: [{ type: "text", text: `Page updated successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_update");
      }
    }
  );

  server.tool(
    "blogger_pages_patch",
    "Perform a partial update of an existing static page. Only updates the provided fields (e.g., title or content).",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      pageId: z.string().describe("The unique identifier of the page to update."),
      title: z.string().optional().describe("The new title of the page (optional)."),
      content: z.string().optional().describe("The new HTML content of the page (optional)."),
      publish: z.boolean().optional().describe("Whether to publish the page upon update."),
      revert: z.boolean().optional().describe("Whether to revert the page to draft status.")
    },
    async ({ blogId, pageId, title, content, publish, revert }) => {
      try {
        const requestBody: blogger_v3.Schema$Page = {};
        if (title !== undefined) requestBody.title = title;
        if (content !== undefined) requestBody.content = cleanHtmlContent(content);

        const res = await blogger.pages.patch({
          blogId,
          pageId,
          publish,
          revert,
          requestBody
        });
        return { content: [{ type: "text", text: `Page patched successfully.\n\n${JSON.stringify(res.data, null, 2)}` }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_patch");
      }
    }
  );

  server.tool(
    "blogger_pages_delete",
    "Permanently delete a static page by its ID.",
    {
      blogId: z.string().describe("The unique identifier of the blog."),
      pageId: z.string().describe("The unique identifier of the page to delete.")
    },
    async ({ blogId, pageId }) => {
      try {
        await blogger.pages.delete({ blogId, pageId });
        return { content: [{ type: "text", text: `Page ${pageId} successfully deleted from blog ${blogId}.` }] };
      } catch (error) {
        return handleApiError(error, "blogger_pages_delete");
      }
    }
  );
}
