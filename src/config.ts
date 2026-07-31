import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  BLOGGER_CLIENT_ID: z.string().min(1, "BLOGGER_CLIENT_ID is required"),
  BLOGGER_CLIENT_SECRET: z.string().min(1, "BLOGGER_CLIENT_SECRET is required"),
  BLOGGER_REFRESH_TOKEN: z.string().min(1, "BLOGGER_REFRESH_TOKEN is required"),
  BLOGGER_API_KEY: z.string().optional(),
});

export interface Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiKey?: string;
}

export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(
      `Configuration error: ${errors}. Run 'npx blogger-mcp-auth' to generate your Blogger refresh token.`
    );
  }

  const env = result.data;

  if (!env.BLOGGER_CLIENT_ID.endsWith(".apps.googleusercontent.com")) {
    console.error(
      "[Blogger MCP] Warning: BLOGGER_CLIENT_ID usually ends with '.apps.googleusercontent.com'."
    );
  }

  if (env.BLOGGER_REFRESH_TOKEN.length < 15) {
    console.error("[Blogger MCP] Warning: BLOGGER_REFRESH_TOKEN seems unusually short.");
  }

  return {
    clientId: env.BLOGGER_CLIENT_ID.trim(),
    clientSecret: env.BLOGGER_CLIENT_SECRET.trim(),
    refreshToken: env.BLOGGER_REFRESH_TOKEN.trim(),
    apiKey: env.BLOGGER_API_KEY?.trim(),
  };
}
