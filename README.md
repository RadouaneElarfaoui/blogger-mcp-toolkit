# blogger-mcp-toolkit

> A universal MCP (Model Context Protocol) server providing complete access to the Google Blogger API v3, permanent Base64 media embedding, and lightweight summary listing modes.

[![npm version](https://img.shields.io/npm/v/blogger-mcp-toolkit.svg?style=flat-square)](https://www.npmjs.com/package/blogger-mcp-toolkit)
![Node.js](https://img.shields.io/badge/Node.js-18+-success?logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)

Interact seamlessly with Blogger blogs, posts, pages, comments, media, and user profiles directly from your favorite AI assistant or MCP-enabled client (such as Claude Code, Claude Desktop, Cursor, Zed, Windsurf, or Antigravity CLI).

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start & Installation](#-quick-start--installation)
- [Google Cloud Console Setup](#-google-cloud-console-setup)
- [Manual Setup](#-manual-setup)
- [Environment Variables](#-environment-variables)
- [Available Tools (29)](#-available-tools-29)
- [MCP Client Configuration](#-mcp-client-configuration)
- [License](#-license)

---

## 🌟 Features

- **100% Blogger API v3 Coverage + Media & Search Extensions**: 29 MCP tools for full management of blogs, posts, pages, comments, media, and users.
- **Remote-Friendly Interactive OAuth (`npx blogger-mcp-auth`)**: Standalone authentication CLI supporting local browser redirect AND manual code copy-pasting for remote/SSH/Docker environments.
- **Strict `BLOGGER_*` Environment Schema**: Clean, standardized configuration using `BLOGGER_CLIENT_ID`, `BLOGGER_CLIENT_SECRET`, `BLOGGER_REFRESH_TOKEN`, and `BLOGGER_API_KEY`.
- **Permanent Base64 Image Embedding (`blogger_media_to_base64`)**: Convert local images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`) into Base64 Data URIs with zero external CDN dependencies, ensuring your images never expire.
- **Lightweight Listing Mode (`summaryOnly`)**: Omit heavy HTML post content on `list`, `search`, and `searchByLabel` endpoints to drastically reduce JSON response sizes (from >50KB down to ~2KB) and prevent payload truncation.
- **Dedicated Label Search (`blogger_posts_searchByLabel`)**: Quick filtering of posts by tag/label.
- **Automatic HTML Markdown Cleaner**: Cleans raw Markdown code fences (e.g. ```html ... ```) before publishing posts or pages to Blogger.

---

## 🚀 Quick Start & Installation

### Step 1: Acquire your Blogger Refresh Token

Run the interactive authentication tool directly in your terminal:

* **Option A (Official GitHub Release — Recommended for Latest Version)**:
  ```bash
  npx github:RadouaneElarfaoui/blogger-mcp-toolkit blogger-mcp-auth
  ```

* **Option B (NPM Registry Release)**:
  ```bash
  npx blogger-mcp-auth
  ```

* **Interactive Prompt**: Enter your `BLOGGER_CLIENT_ID` and `BLOGGER_CLIENT_SECRET` when prompted.
* **Browser Authentication**: Authorize the app in your browser. *(If working over SSH/remote container, simply copy-paste the redirected URL or authorization code back into the terminal!)*
* **Token Output**: Copy the generated `BLOGGER_REFRESH_TOKEN` displayed in green.

---

### Step 2: Install across your AI assistants with `add-mcp`

Install and configure automatically across all your AI assistants (**Claude Code**, **Cursor**, **Zed**, **Windsurf**, **VS Code**, etc.) in **one single command**:

* **Option A (Official GitHub Release — Recommended for Latest Version)**:
  ```bash
  npx add-mcp github:RadouaneElarfaoui/blogger-mcp-toolkit \
    --env BLOGGER_CLIENT_ID=your-client-id.apps.googleusercontent.com \
    --env BLOGGER_CLIENT_SECRET=your-client-secret \
    --env BLOGGER_REFRESH_TOKEN=your-refresh-token
  ```

* **Option B (NPM Registry Release)**:
  ```bash
  npx add-mcp blogger-mcp-toolkit \
    --env BLOGGER_CLIENT_ID=your-client-id.apps.googleusercontent.com \
    --env BLOGGER_CLIENT_SECRET=your-client-secret \
    --env BLOGGER_REFRESH_TOKEN=your-refresh-token
  ```

---

## ⚙️ Google Cloud Console Setup

To communicate with the Blogger API, you need OAuth2 credentials:

1. **Create a Project**: Go to [Google Cloud Console](https://console.cloud.google.com/), click **New Project**, and name it (e.g., `Blogger MCP`).
2. **Enable Blogger API v3**: Go to **APIs & Services > Library**, search for **Blogger API v3**, and click **Enable**.
3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Choose **External**, fill in required support email fields.
   - Under **Test users**, add your own Google email address **(Crucial if your app is in "Testing" status!)**.
4. **Create Credentials**:
   - Go to **APIs & Services > Credentials** > **+ CREATE CREDENTIALS > OAuth client ID**.
   - Select **Web application** (or **Desktop app**).
   - Add Authorized redirect URI: `http://localhost:3000/oauth2callback` (or port 3001/3002).
   - Copy your **Client ID** and **Client Secret**.

---

## 📦 Manual Setup

```bash
# Clone the repository
git clone https://github.com/RadouaneElarfaoui/blogger-mcp-toolkit.git
cd blogger-mcp-toolkit

# Install dependencies & build
npm install
npm run build

# Generate Refresh Token locally
cp .env.example .env
npm run auth
```

---

## 🌍 Environment Variables

`blogger-mcp-toolkit` exclusively uses the following `BLOGGER_*` environment variables:

| Variable | Description | Required |
|----------|-------------|:--------:|
| `BLOGGER_CLIENT_ID` | OAuth2 Client ID from Google Cloud Console | Yes |
| `BLOGGER_CLIENT_SECRET` | OAuth2 Client Secret from Google Cloud Console | Yes |
| `BLOGGER_REFRESH_TOKEN` | OAuth2 Refresh Token (generated via `npx blogger-mcp-auth`) | Yes |
| `BLOGGER_API_KEY` | Optional API key for read-only access | No |

---

## 🛠️ Available Tools (29)

<details open>
<summary><strong>📝 Blogs (3 tools)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_blogs_get` | Get blog metadata by blog ID |
| `blogger_blogs_getByUrl` | Get blog metadata by its URL |
| `blogger_blogs_listByUser` | List blogs for a user |

</details>

<details open>
<summary><strong>📄 Posts (11 tools)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_posts_list` | List posts for a blog (supports `summaryOnly` mode to strip heavy HTML content) |
| `blogger_posts_get` | Get a post by ID |
| `blogger_posts_getByPath` | Get a post by its URL path |
| `blogger_posts_search` | Search posts by query string (supports `summaryOnly` mode) |
| `blogger_posts_searchByLabel` | Filter posts by a label/tag (supports `summaryOnly` mode) |
| `blogger_posts_insert` | Create a new post (automatically strips raw Markdown HTML code block wrappers) |
| `blogger_posts_update` | Full update of a post |
| `blogger_posts_patch` | Partial update of a post |
| `blogger_posts_delete` | Delete a post |
| `blogger_posts_publish` | Publish a draft post |
| `blogger_posts_revert` | Revert a published post to draft |

</details>

<details open>
<summary><strong>📑 Pages (6 tools)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_pages_list` | List static pages for a blog |
| `blogger_pages_get` | Get a page by ID |
| `blogger_pages_insert` | Create a new static page (automatically strips raw Markdown HTML code block wrappers) |
| `blogger_pages_update` | Full update of a page |
| `blogger_pages_patch` | Partial update of a page |
| `blogger_pages_delete` | Delete a page |

</details>

<details open>
<summary><strong>💬 Comments (7 tools)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_comments_list` | List comments for a specific post |
| `blogger_comments_listByBlog`| List comments across all posts |
| `blogger_comments_get` | Get a specific comment |
| `blogger_comments_approve` | Approve a comment |
| `blogger_comments_delete` | Permanently delete a comment |
| `blogger_comments_removeContent`| Remove comment content |
| `blogger_comments_markAsSpam`| Mark a comment as spam |

</details>

<details open>
<summary><strong>🖼️ Media (1 tool)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_media_to_base64` | Convert a local image file (.png, .jpg, .jpeg, .webp, .gif, .svg) to an embedded Base64 Data URI with a ready-to-use Blogger `<img>` tag snippet for zero-dependency permanent embedding |

</details>

<details open>
<summary><strong>👤 Users (1 tool)</strong></summary>

| Tool Name | Description |
|-----------|-------------|
| `blogger_users_get` | Get user profile information |

</details>

---

## 🔌 MCP Client Configuration

### Claude Desktop

Edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blogger": {
      "command": "npx",
      "args": ["-y", "blogger-mcp-toolkit"],
      "env": {
        "BLOGGER_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "BLOGGER_CLIENT_SECRET": "your-client-secret",
        "BLOGGER_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### Cursor

Edit `.cursor/mcp.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "blogger": {
      "command": "npx",
      "args": ["-y", "blogger-mcp-toolkit"],
      "env": {
        "BLOGGER_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "BLOGGER_CLIENT_SECRET": "your-client-secret",
        "BLOGGER_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "blogger": {
      "command": "npx",
      "args": ["-y", "blogger-mcp-toolkit"],
      "env": {
        "BLOGGER_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "BLOGGER_CLIENT_SECRET": "your-client-secret",
        "BLOGGER_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### Zed

Edit `settings.json` in Zed:

```json
{
  "context_servers": {
    "blogger": {
      "command": {
        "path": "npx",
        "args": ["-y", "blogger-mcp-toolkit"]
      },
      "env": {
        "BLOGGER_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "BLOGGER_CLIENT_SECRET": "your-client-secret",
        "BLOGGER_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

---

## 📄 License

This project is licensed under the MIT License.
