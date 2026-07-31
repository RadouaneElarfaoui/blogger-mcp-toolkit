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

async function main() {
  console.log('\n🚀 Starting Google OAuth2 Refresh Token Generator...\n');

  let clientId = (process.env.BLOGGER_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)?.trim();
  let clientSecret = (process.env.BLOGGER_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)?.trim();

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
    console.error('\n❌ Error: Client ID and Client Secret are required.');
    process.exit(1);
  }

  const redirectUri = 'http://localhost:3000/oauth2callback';
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = ['https://www.googleapis.com/auth/blogger'];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Ensures a refresh token is always returned
    scope: scopes,
  });

  console.log('\n======================================================');
  console.log('🌐 PLEASE OPEN THE FOLLOWING URL IN YOUR WEB BROWSER:');
  console.log('======================================================\n');
  console.log(url);
  console.log('\n======================================================');
  console.log('⏳ Waiting for authorization...');
  console.log('⚠️  Note: This server will automatically close in 5 minutes.');

  let server: http.Server;

  // Auto-close timeout (5 minutes)
  const timeoutTimer = setTimeout(() => {
    console.error('\n⏱️  Timeout: No authorization code received within 5 minutes.');
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }, 5 * 60 * 1000);

  server = http.createServer(async (req, res) => {
    try {
      if (!req.url) return;

      const requestUrl = new URL(req.url, `http://localhost:3000`);

      if (requestUrl.pathname === '/oauth2callback') {
        clearTimeout(timeoutTimer);
        const code = requestUrl.searchParams.get('code');
        const error = requestUrl.searchParams.get('error');

        if (error) {
          console.error(`\n❌ Authorization failed. Google returned error: ${error}`);
          if (error === 'access_denied') {
             console.error('   Reason: You cancelled the authorization or denied access.');
          }
          
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Authorization Failed</title></head>
              <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: red;">Authorization failed!</h1>
                <p>Error: ${error}</p>
                <p>Check your terminal for more details. You can close this tab.</p>
              </body>
            </html>
          `);
          
          server.close(() => process.exit(1));
          return;
        }

        if (code) {
          console.log('\n✅ Authorization code received! Exchanging for tokens...');

          try {
            const { tokens } = await oauth2Client.getToken(code);

            if (tokens.refresh_token) {
              console.log('\n🎉 Success! Here is your refresh token:\n');
              console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token); // Green text
              console.log('\n📌 Add this to your .env file as:');
              console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
              
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <head><title>Authorization Successful</title></head>
                  <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: green;">Authorization successful!</h1>
                    <p>Refresh token acquired. You can close this tab and return to your terminal.</p>
                  </body>
                </html>
              `);
            } else {
              console.log('\n⚠️  No refresh token received.');
              console.log('This usually means you have already authorized the app and did not get a new refresh token.');
              console.log('Make sure prompt="consent" is set in the auth URL (it should be). You may need to revoke access in your Google Account and try again.');
              
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <head><title>Authorization Incomplete</title></head>
                  <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: orange;">Authorization finished, but no refresh token received.</h1>
                    <p>Check your terminal for more details. You can close this tab.</p>
                  </body>
                </html>
              `);
            }
          } catch (tokenErr: any) {
            console.error('\n❌ Failed to exchange authorization code for tokens.');
            console.error('Error details:', tokenErr.message);
            
            if (tokenErr.message && tokenErr.message.includes('redirect_uri_mismatch')) {
              console.error('\n💡 Fix: Make sure you added http://localhost:3000/oauth2callback as an Authorized redirect URI in the Google Cloud Console.');
            }

            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head><title>Token Exchange Failed</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h1 style="color: red;">Token exchange failed!</h1>
                  <p>Error: ${tokenErr.message}</p>
                  <p>Check your terminal for more details. You can close this tab.</p>
                </body>
              </html>
            `);
          }

          server.close(() => {
            console.log('👋 Server shut down. Exiting...');
            process.exit(0);
          });
        }
      }
    } catch (error: any) {
      console.error('\n❌ An unexpected error occurred in the server:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      server.close(() => process.exit(1));
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error('\n❌ Port 3000 is already in use.');
      console.error('💡 Please stop any other application running on port 3000 and try again.');
      console.error('   (For example, another instance of this script, or a local dev server)');
    } else {
      console.error('\n❌ Server error:', err.message);
    }
    clearTimeout(timeoutTimer);
    process.exit(1);
  });

  server.listen(3000, () => {
    // Server started, waiting for user
  });
}

main().catch((err) => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});
