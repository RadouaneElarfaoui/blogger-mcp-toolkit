import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleApiError } from "../errors.js";
import fs from "node:fs";
import path from "node:path";

export function registerMediaTools(server: McpServer): void {
  server.tool(
    "blogger_media_to_base64",
    "Convert a local image file (.png, .jpg, .jpeg, .webp, .gif, .svg) into an embedded Base64 Data URI and generate a ready-to-use Blogger <img> tag snippet. Guaranteed permanent embedding inside Blogger post bodies without external host dependencies.",
    {
      filePath: z
        .string()
        .describe(
          "Absolute local path to the image file (e.g. '/home/user/pictures/hero.png')"
        ),
      alt: z
        .string()
        .optional()
        .describe("Alt text description for the <img> tag"),
      style: z
        .string()
        .optional()
        .describe(
          "Custom CSS inline style string for the <img> tag (defaults to responsive container with rounded corners and shadow)"
        ),
    },
    async ({ filePath, alt, style }) => {
      try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Error in blogger_media_to_base64: File not found at path '${absolutePath}'`,
              },
            ],
          };
        }

        const buffer = fs.readFileSync(absolutePath);
        const fileName = path.basename(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();

        let mimeType = "image/png";
        if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".svg") mimeType = "image/svg+xml";

        const base64Str = buffer.toString("base64");
        const dataUri = `data:${mimeType};base64,${base64Str}`;

        const defaultStyle =
          style ??
          "max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);";

        const altText = alt ?? fileName;

        const htmlSnippet = `<div style="text-align: center; margin: 30px 0 35px 0;"><img src="${dataUri}" alt="${altText}" style="${defaultStyle}" /></div>`;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: "Image successfully converted to Base64 Data URI for Blogger embedding.",
                  fileName,
                  mimeType,
                  sizeBytes: buffer.length,
                  dataUriLength: dataUri.length,
                  htmlSnippet,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return handleApiError(error, "blogger_media_to_base64");
      }
    }
  );
}
