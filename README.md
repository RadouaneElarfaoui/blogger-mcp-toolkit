# blogger-mcp-toolkit

> A universal MCP (Model Context Protocol) server providing complete access to the Google Blogger API v3, zero-config media uploading, and lightweight summary listing modes.

![Node.js](https://img.shields.io/badge/Node.js-18+-success?logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)

Interact seamlessly with Blogger blogs, posts, pages, comments, media, and user profiles directly from your favorite AI assistant or MCP-enabled client (like Claude Desktop, Cursor, Windsurf, or Antigravity CLI).

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Google Cloud Console Setup](#-google-cloud-console-setup)
- [Installation](#-installation)
- [OAuth2 Setup](#-oauth2-setup)
- [Environment Variables](#-environment-variables)
- [Available Tools (29)](#-available-tools-29)
- [MCP Client Configuration](#-mcp-client-configuration)
- [Architecture](#-architecture)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [License](#-license)

---

## 🌟 Features

- **100% Blogger API v3 Coverage + Media & Search Extensions**: 29 MCP tools for full management of blogs, posts, pages, comments, media, and users.
- **Zero-Config Media Upload (`blogger_media_upload`)**: Instantly upload local image files (`.jpg`, `.png`, `.webp`, `.gif`) or Base64 data to a public CDN without needing any API key or registration.
- **Lightweight Listing Mode (`summaryOnly`)**: Omit heavy HTML post content on `list` and `search` endpoints to drastically reduce JSON response sizes from >50KB down to ~2KB and eliminate payload truncation.
- **Dedicated Label Search (`blogger_posts_searchByLabel`)**: Quick filtering of posts by tag/label.
- **Automatic HTML Markdown Cleaner**: Cleans raw Markdown code fences (e.g., ```` ```html ````) before publishing posts or pages to Blogger.
- **Robust Authentication**: Fully integrated OAuth2 workflow with automatic token refresh.
- **Interactive CLI**: Built-in script (`npm run auth`) for painless refresh token generation.

---

## 🚀 Quick Start

1. **Clone & Install**: `git clone <repo-url> && cd blogger-mcp-toolkit && npm install`
2. **Build**: `npm run build`
3. **Configure Google Cloud**: Set up an OAuth 2.0 Client (Web Application) and get your Client ID / Secret.
4. **Get Token**: Put your Client ID and Secret in `.env`, run `npm run auth`, and authorize via your browser.
5. **Connect Client**: Add the server configuration to your MCP client (Claude Desktop, Cursor, Antigravity, etc.).

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **Google Account**: With one or more blogs on [Blogger](https://www.blogger.com/)
- **Google Cloud Project**: To generate API credentials

---

## ⚙️ Google Cloud Console Setup

To communicate with the Blogger API, you need OAuth2 credentials. Follow these steps carefully:

1. **Create a Project**: 
   - Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top and select **New Project**. Name it (e.g., `Blogger MCP`).
2. **Enable the API**:
   - Go to **APIs & Services > Library**.
   - Search for **Blogger API v3**.
   - Click on it and press **Enable**.
3. **Configure the OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Choose **External** (or Internal if you have Google Workspace) and click **Create**.
   - Fill in the required fields (App name, User support email, Developer contact email). Click **Save and Continue**.
   - Under **Scopes**, leave blank or add Blogger API scopes. Click **Save and Continue**.
   - Under **Test users**, add your own Google email address. **(Crucial if your app is in "Testing" mode!)**
4. **Create Credentials**:
   - Go to **APIs & Services > Credentials**.
   - Click **+ CREATE CREDENTIALS > OAuth client ID**.
   - **Application type**: Select **Web application**.
   - **Authorized redirect URIs**: Click **ADD URI** and enter exactly: `http://localhost:3000/oauth2callback`
   - Click **Create**.
5. **Save Credentials**:
   - Copy your **Client ID** and **Client Secret**.

---

## 📦 Installation

```bash
# Clone the repository
git clone <repo-url> blogger-mcp-toolkit
cd blogger-mcp-toolkit

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run build
```

---

## 🔐 OAuth2 Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Google Cloud credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
3. Run the interactive authorization script:
   ```bash
   npm run auth
   ```
4. Click the link printed in your terminal, select your Google account, and grant access.
5. Copy the generated `GOOGLE_REFRESH_TOKEN` into your `.env` file.

---

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID from Google Cloud Console | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret from Google Cloud Console | Yes |
| `GOOGLE_REFRESH_TOKEN` | OAuth2 Refresh Token (generated via `npm run auth`) | Yes |
| `GOOGLE_API_KEY` | Optional API key for read-only access | No |

---

## 🛠️ Available Tools (29)

<details>
<summary><strong>📝 Blogs (3 tools)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_blogs_get` | Get blog metadata by blog ID | `blogId` (string), `maxPosts` (number, optional), `view` ('ADMIN'\|'AUTHOR'\|'READER', optional) |
| `blogger_blogs_getByUrl` | Get blog metadata by its URL | `url` (string), `view` ('ADMIN'\|'AUTHOR'\|'READER', optional) |
| `blogger_blogs_listByUser` | List blogs for a user | `userId` (string, default: 'self'), `view` ('ADMIN'\|'AUTHOR'\|'READER', optional) |

</details>

<details>
<summary><strong>📄 Posts (11 tools)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_posts_list` | List posts for a blog | `blogId` (string), `maxResults` (number, optional), `pageToken` (string, optional), `labels` (string, optional), `status` (array, optional), `orderBy` (enum, optional), `startDate` (string, optional), `endDate` (string, optional), `fetchBodies` (boolean, default: true), `fetchImages` (boolean, optional), `summaryOnly` (boolean, default: false) |
| `blogger_posts_get` | Get a post by ID | `blogId` (string), `postId` (string), `fetchBody` (boolean, default: true), `fetchImages` (boolean, optional), `maxComments` (number, optional), `view` (enum, optional) |
| `blogger_posts_getByPath` | Get a post by its URL path | `blogId` (string), `path` (string), `maxComments` (number, optional), `view` (enum, optional) |
| `blogger_posts_search` | Search posts by query string | `blogId` (string), `q` (string), `fetchBodies` (boolean, optional), `summaryOnly` (boolean, default: false), `orderBy` (enum, optional) |
| `blogger_posts_searchByLabel` | Filter posts by a label/tag | `blogId` (string), `label` (string), `maxResults` (number, optional), `pageToken` (string, optional), `status` (array, optional), `summaryOnly` (boolean, default: false) |
| `blogger_posts_insert` | Create a new post | `blogId` (string), `title` (string), `content` (string), `labels` (array of strings, optional), `isDraft` (boolean, default: false), `customMetaData` (string, optional) |
| `blogger_posts_update` | Full update of a post | `blogId` (string), `postId` (string), `title` (string), `content` (string), `labels` (array of strings, optional), `publish` (boolean, optional), `revert` (boolean, optional) |
| `blogger_posts_patch` | Partial update of a post | `blogId` (string), `postId` (string), `title` (string, optional), `content` (string, optional), `labels` (array of strings, optional), `publish` (boolean, optional), `revert` (boolean, optional) |
| `blogger_posts_delete` | Delete a post | `blogId` (string), `postId` (string) |
| `blogger_posts_publish` | Publish a draft post | `blogId` (string), `postId` (string), `publishDate` (string, optional) |
| `blogger_posts_revert` | Revert a published post to draft | `blogId` (string), `postId` (string) |

</details>

<details>
<summary><strong>📑 Pages (6 tools)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_pages_list` | List static pages for a blog | `blogId` (string), `fetchBodies` (boolean, optional), `status` (array of enum, optional), `summaryOnly` (boolean, default: false), `view` (enum, optional) |
| `blogger_pages_get` | Get a page by ID | `blogId` (string), `pageId` (string), `view` (enum, optional) |
| `blogger_pages_insert` | Create a new static page | `blogId` (string), `title` (string), `content` (string), `isDraft` (boolean, default: false) |
| `blogger_pages_update` | Full update of a page | `blogId` (string), `pageId` (string), `title` (string), `content` (string), `publish` (boolean, optional), `revert` (boolean, optional) |
| `blogger_pages_patch` | Partial update of a page | `blogId` (string), `pageId` (string), `title` (string, optional), `content` (string, optional), `publish` (boolean, optional), `revert` (boolean, optional) |
| `blogger_pages_delete` | Delete a page | `blogId` (string), `pageId` (string) |

</details>

<details>
<summary><strong>💬 Comments (7 tools)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_comments_list` | List comments for a specific post | `blogId` (string), `postId` (string), `maxResults` (number, optional), `pageToken` (string, optional), `startDate` (string, optional), `endDate` (string, optional), `status` (enum, optional), `fetchBodies` (boolean, default: true) |
| `blogger_comments_listByBlog`| List comments across all posts | `blogId` (string), `maxResults` (number, optional), `pageToken` (string, optional), `startDate` (string, optional), `endDate` (string, optional), `status` (array of enum, optional), `fetchBodies` (boolean, optional) |
| `blogger_comments_get` | Get a specific comment | `blogId` (string), `postId` (string), `commentId` (string), `view` (enum, optional) |
| `blogger_comments_approve` | Approve a comment | `blogId` (string), `postId` (string), `commentId` (string) |
| `blogger_comments_delete` | Permanently delete a comment | `blogId` (string), `postId` (string), `commentId` (string) |
| `blogger_comments_removeContent`| Remove comment content | `blogId` (string), `postId` (string), `commentId` (string) |
| `blogger_comments_markAsSpam`| Mark a comment as spam | `blogId` (string), `postId` (string), `commentId` (string) |

</details>

<details>
<summary><strong>🖼️ Media (1 tool)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_media_upload` | Upload a local image file or Base64 data to a public CDN and get direct public URLs ready for Blogger `<img>` tags (zero config required) | `filePath` (string, optional), `base64Data` (string, optional), `fileName` (string, optional) |

</details>

<details>
<summary><strong>👤 Users (1 tool)</strong></summary>

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `blogger_users_get` | Get user profile information | `userId` (string, default: 'self') |

</details>

---

## 🔌 MCP Client Configuration

### Claude Desktop
Edit your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "blogger": {
      "command": "node",
      "args": ["/absolute/path/to/blogger-mcp-toolkit/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### Antigravity (AGY)
In `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "blogger": {
      "command": "node",
      "args": ["/home/user/.../blogger-mcp-toolkit/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REFRESH_TOKEN": "..."
      }
    }
  }
}
```

---

## 💻 Development

- `npm run build` — Compile TypeScript to JavaScript in `dist/`.
- `npm run start` — Run the MCP server directly via stdin/stdout.
- `npm run auth` — Run the interactive OAuth2 authorization script.
- `npm run inspect` — Run the MCP inspector to visually test tools via a web interface.

---

## 📄 License

This project is licensed under the MIT License.
