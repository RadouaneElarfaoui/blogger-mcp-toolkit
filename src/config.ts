import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const rawConfigSchema = z.object({
  BLOGGER_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  BLOGGER_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BLOGGER_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  BLOGGER_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
});

export interface Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiKey?: string;
}

export function loadConfig(): Config {
  const result = rawConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Configuration parsing error: ${errors}`);
  }

  const data = result.data;

  const clientId = (data.BLOGGER_CLIENT_ID || data.GOOGLE_CLIENT_ID)?.trim();
  const clientSecret = (data.BLOGGER_CLIENT_SECRET || data.GOOGLE_CLIENT_SECRET)?.trim();
  const refreshToken = (data.BLOGGER_REFRESH_TOKEN || data.GOOGLE_REFRESH_TOKEN)?.trim();
  const apiKey = (data.BLOGGER_API_KEY || data.GOOGLE_API_KEY)?.trim();

  const missing: string[] = [];
  if (!clientId) missing.push("BLOGGER_CLIENT_ID (or GOOGLE_CLIENT_ID)");
  if (!clientSecret) missing.push("BLOGGER_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)");
  if (!refreshToken) missing.push("BLOGGER_REFRESH_TOKEN (or GOOGLE_REFRESH_TOKEN)");

  if (missing.length > 0) {
    throw new Error(
      `Configuration error: Missing required environment variables: ${missing.join(", ")}. Run 'npx blogger-mcp-auth' to generate your Blogger refresh token.`
    );
  }

  if (!clientId!.endsWith(".apps.googleusercontent.com")) {
    console.error(
      "[Blogger MCP] Warning: Client ID usually ends with '.apps.googleusercontent.com'."
    );
  }

  if (refreshToken!.length < 15) {
    console.error("[Blogger MCP] Warning: Refresh token seems unusually short.");
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    refreshToken: refreshToken!,
    apiKey,
  };
}
