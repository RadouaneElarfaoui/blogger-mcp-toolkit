import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REFRESH_TOKEN: z.string().min(1, "GOOGLE_REFRESH_TOKEN is required"),
  GOOGLE_API_KEY: z.string().optional(),
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
    throw new Error(`Configuration error: ${errors}. Run 'npm run auth' to generate a refresh token if needed.`);
  }

  const env = result.data;

  if (!env.GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")) {
    console.error(
      "[Blogger MCP] Warning: GOOGLE_CLIENT_ID usually ends with '.apps.googleusercontent.com'."
    );
  }

  if (env.GOOGLE_REFRESH_TOKEN.length < 20) {
    console.error("[Blogger MCP] Warning: GOOGLE_REFRESH_TOKEN seems unusually short.");
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    apiKey: env.GOOGLE_API_KEY,
  };
}
