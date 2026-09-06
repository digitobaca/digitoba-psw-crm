/**
 * One-time setup: authorizes this app to send email as digitobaca@gmail.com
 * via the Gmail API, and saves the resulting refresh token to server/.env.
 *
 * Prerequisites (do these in Google Cloud Console first — see
 * server/.env.example for the full walkthrough):
 *   1. Create a project, enable the "Gmail API".
 *   2. Configure the OAuth consent screen (External, Testing mode is
 *      fine — add digitobaca@gmail.com as a test user).
 *   3. Create an OAuth Client ID, type "Web application", with
 *      http://localhost:3939/oauth2callback added as an authorized
 *      redirect URI.
 *   4. Put that Client ID/Secret in server/.env as GMAIL_CLIENT_ID /
 *      GMAIL_CLIENT_SECRET before running this script.
 *
 * Usage:
 *   node scripts/gmailAuth.js
 *
 * Opens a browser to Google's consent screen — log in as
 * digitobaca@gmail.com and approve. This script never prints the refresh
 * token it receives; it writes it straight into server/.env.
 */
require('dotenv').config();
const http = require('http');
const { google } = require('googleapis');

const PORT = Number(process.env.GMAIL_AUTH_PORT) || 3939;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error(
    'Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in server/.env.\n' +
      'Create an OAuth Client ID in Google Cloud Console first — see server/.env.example.'
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // required to get a refresh_token, not just a short-lived access token
  prompt: 'consent', // forces Google to issue a refresh_token even if this app was authorized before
  scope: SCOPES,
});

console.log('\nOpen this URL in a browser and log in as digitobaca@gmail.com:\n');
console.log(authUrl);
console.log(`\nWaiting for you to approve at http://localhost:${PORT} ...\n`);

const server = http
  .createServer(async (req, res) => {
    if (!req.url.startsWith('/oauth2callback')) {
      res.writeHead(404);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h2>Authorization failed: ${error}</h2>You can close this tab.`);
      console.error('Authorization failed:', error);
      server.close(() => process.exit(1));
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      if (!tokens.refresh_token) {
        throw new Error(
          'No refresh_token in the response — this usually means the app was already authorized before without being revoked. ' +
            'Go to myaccount.google.com/permissions, remove this app\'s access, and run this script again.'
        );
      }

      updateEnvFile('GMAIL_REFRESH_TOKEN', tokens.refresh_token);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Success — you can close this tab.</h2>GMAIL_REFRESH_TOKEN has been saved to server/.env.');

      // Deliberately never logging the token itself — only confirmation that it was saved.
      console.log('Success! GMAIL_REFRESH_TOKEN has been written to server/.env.');
      console.log('Next: copy the same GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN into Railway\'s Variables tab for production.');
      server.close(() => process.exit(0));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h2>Token exchange failed</h2>${err.message}`);
      console.error('Token exchange failed:', err.message);
      server.close(() => process.exit(1));
    }
  })
  .listen(PORT);

/** Updates (or appends) a single KEY=value line in server/.env without touching anything else. */
function updateEnvFile(key, value) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = content.replace(/\n?$/, `\n${line}\n`);
  }

  fs.writeFileSync(envPath, content);
}
