import { google, blogger_v3 } from "googleapis";
import { Config } from "./config.js";

export function createBloggerClient(config: Config): blogger_v3.Blogger {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: config.refreshToken,
  });

  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      console.error(
        "[Blogger MCP] Got a new refresh token. You might want to update your .env file:"
      );
      console.error(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    }
  });

  return google.blogger({ version: "v3", auth: oauth2Client });
}
