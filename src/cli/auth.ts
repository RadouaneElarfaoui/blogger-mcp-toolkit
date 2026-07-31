#!/usr/bin/env node

import http from 'node:http';
import { URL } from 'node:url';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import readline from 'node:readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function getAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const checkPort = (port: number) => {
      if (port > startPort + 10) {
        return reject(new Error('No available port found between ' + startPort + ' and ' + (startPort + 10)));
      }
      const testServer = http.createServer();
      testServer.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          checkPort(port + 1);
        } else {
          reject(err);
        }
      });
      testServer.once('listening', () => {
        testServer.close(() => resolve(port));
      });
      testServer.listen(port);
    };
    checkPort(startPort);
  });
}

async function main() {
  console.log('\n🚀 Blogger MCP Toolkit - Interactive OAuth2 Token Generator\n');

  let clientId = process.env.BLOGGER_CLIENT_ID?.trim();
  let clientSecret = process.env.BLOGGER_CLIENT_SECRET?.trim();

  if (!clientId) {
    clientId = await question('📝 Enter your BLOGGER_CLIENT_ID: ');
    clientId = clientId.trim();
  } else {
    console.log('✅ Found BLOGGER_CLIENT_ID in environment variables');
  }

  if (clientId && !clientId.endsWith('.apps.googleusercontent.com')) {
    console.log('⚠️  Warning: Client ID usually ends with ".apps.googleusercontent.com"');
  }

  if (!clientSecret) {
    clientSecret = await question('📝 Enter your BLOGGER_CLIENT_SECRET: ');
    clientSecret = clientSecret.trim();
  } else {
    console.log('✅ Found BLOGGER_CLIENT_SECRET in environment variables');
  }

  if (!clientId || !clientSecret) {
    console.error('\n❌ Error: BLOGGER_CLIENT_ID and BLOGGER_CLIENT_SECRET are required.');
    process.exit(1);
  }

  const port = await getAvailablePort(3000);
  const redirectUri = `http://localhost:${port}/oauth2callback`;

  console.log(`\n📡 Listening for OAuth callback on: ${redirectUri}`);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = ['https://www.googleapis.com/auth/blogger'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  console.log('\n================================================================');
  console.log('🌐 OPEN THE FOLLOWING URL IN YOUR WEB BROWSER TO AUTHORIZE:');
  console.log('================================================================\n');
  console.log(authUrl);
  console.log('\n================================================================');
  console.log('⏳ Waiting for authorization...');
  console.log('💡 TIP (Remote/SSH/Docker users): If redirection doesn\'t work,');
  console.log('   copy the code from the redirected browser URL (code=...) and paste it below.');
  console.log('================================================================\n');

  let server: http.Server;

  const handleAuthorizationCode = async (code: string) => {
    try {
      console.log('\n✅ Exchanging authorization code for tokens...');
      const { tokens } = await oauth2Client.getToken(code);

      if (tokens.refresh_token) {
        console.log('\n🎉 SUCCESS! Here is your Blogger Refresh Token:\n');
        console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token);
        console.log('\n📌 COPY THIS COMMAND TO INSTALL VIA ADD-MCP:');
        console.log('\x1b[36m%s\x1b[0m', `npx add-mcp blogger-mcp-toolkit --env BLOGGER_CLIENT_ID="${clientId}" --env BLOGGER_CLIENT_SECRET="${clientSecret}" --env BLOGGER_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
      } else {
        console.log('\n⚠️  No new refresh token returned. (Access might already be granted).');
        console.log('   Try revoking app access in your Google Account and re-running this script.');
      }
    } catch (err: any) {
      console.error('\n❌ Token exchange error:', err.message || err);
    } finally {
      rl.close();
      if (server) server.close(() => process.exit(0));
      else process.exit(0);
    }
  };

  rl.question('📋 Paste Authorization Code or full Callback URL here (or press Enter to wait for browser redirect): ', (manualInput) => {
    const input = manualInput.trim();
    if (input) {
      let code = input;
      if (input.includes('code=')) {
        try {
          const parsedUrl = new URL(input.startsWith('http') ? input : `http://localhost:${port}/?${input}`);
          code = parsedUrl.searchParams.get('code') || input;
        } catch {
          const match = input.match(/code=([^&]+)/);
          if (match) code = match[1];
        }
      }
      handleAuthorizationCode(code);
    }
  });

  server = http.createServer(async (req, res) => {
    try {
      if (!req.url) return;
      const requestUrl = new URL(req.url, `http://localhost:${port}`);

      if (requestUrl.pathname === '/oauth2callback') {
        const code = requestUrl.searchParams.get('code');
        const error = requestUrl.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization Failed</h1><p>Error: ' + error + '</p>');
          console.error('\n❌ Authorization error from Google:', error);
          rl.close();
          server.close(() => process.exit(1));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization Successful!</h1><p>You can close this window and return to your terminal.</p>');
          await handleAuthorizationCode(code);
        }
      }
    } catch (err: any) {
      console.error('Server callback error:', err.message);
    }
  });

  server.listen(port);
}

main().catch((err) => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});
