Here's a cleaned-up rewrite of that page's content:

---

# Web Search MCP Server

**Free web search using DuckDuckGo results — no API key required.**

A Model Context Protocol (MCP) server that lets you search the web via DuckDuckGo, with no authentication or API keys needed.

## Features
- Search the web using DuckDuckGo results
- No API keys or authentication required
- Structured results (title, URL, description)
- Configurable number of results per search

## Installation

1. Clone or download the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```
4. Add it to your MCP configuration (works the same for VSCode's Claude Dev Extension and Claude Desktop):
   ```json
   {
     "mcpServers": {
       "web-search": {
         "command": "node",
         "args": ["/path/to/web-search/build/index.js"]
       }
     }
   }
   ```

## Usage

The server exposes a single tool, `search`, with these parameters:

```typescript
{
  "query": string,   // The search query
  "limit": number    // Optional, default 5, max 10
}
```

**Example call:**
```typescript
use_mcp_tool({
  server_name: "web-search",
  tool_name: "search",
  arguments: {
    query: "your search query",
    limit: 3 // optional
  }
})
```

**Example response:**
```json
[
  {
    "title": "Example Search Result",
    "url": "https://example.com",
    "description": "Description of the search result..."
  }
]
```

## Limitations
- Relies on web scraping, so results can be inconsistent or break if the underlying page structure changes
- Intended for personal use — respect the search provider's terms of service

## Details
- **Repository:** [github.com/sam2332/mcp-web-search](https://github.com/sam2332/mcp-web-search)
- **Category:** [Search](https://mcpservers.org/category/search)

---

Note: the page description says "Google search results" in one spot but the README itself says DuckDuckGo — I kept the DuckDuckGo detail since that's what the actual documentation states. I also dropped the ad, nav breadcrumbs, and "related servers" list since those are page furniture rather than content about this server — let me know if you want the related-servers list included too.