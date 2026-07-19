# Canva MCP Integration Guide

## Overview

The Canva MCP (Model Context Protocol) server enables AI agents to interact with Canva's design platform programmatically. It handles images, videos, text/posts, and documents.

## Supported Content Types

| Type | Capabilities |
|------|-------------|
| Images | Upload assets from URLs, generate designs with AI, export as PNG/JPG |
| Video | Upload video assets, export designs as MP4/GIF |
| Text/Posts | Generate designs from text prompts via Canva's Magic Studio, edit text content |
| Documents | Docs, presentations, sheets - all supported design types for search, generate, and export as PDF/PPTX |

## Tool Categories (~32 tools total)

### Generation Tools
- `generate-design` - Create new designs from text prompts
- `search-designs` - Search existing Canva designs

### Editing Tools
- `start-editing-transaction` - Begin an editing session
- `perform-editing-operations` - Apply edits to designs

### Asset Tools
- `upload-asset-from-url` - Upload external assets to Canva

### Export Tools
- `export-design` - Export to PDF/PNG/JPG/PPTX/GIF/MP4

### Organization Tools
- Folder management and comments

## Pricing Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Design generation | Yes | Yes | Yes |
| Editing | Yes | Yes | Yes |
| Search | Yes | Yes | Yes |
| Exports | Yes | Yes | Yes |
| Template autofill | No | No | Yes |
| Custom resize | No | Yes | Yes |

**Note**: For making individual posts (image/video/text), the free tier covers you.

## MCP Server Configuration

```json
{
  "mcpServers": {
    "canva": {
      "type": "http",
      "url": "https://mcp.canva.com/mcp"
    }
  }
}
```

## Important Notes

### OAuth2 with Dynamic Client Registration (DCR)

Canva's MCP uses OAuth2 with Dynamic Client Registration. For third-party/custom integrations (not Claude.ai/ChatGPT's built-in connector), you may need to:

1. Apply via Canva's waitlist form
2. Get your redirect URI allowlisted before the connection works
3. This matters for custom agents not using Claude.ai's connector

### Setup Steps

1. **Apply for access**: Visit Canva's MCP waitlist form for custom integrations
2. **Configure OAuth**: Once approved, configure your OAuth credentials
3. **Add to MCP config**: Add the canva server to your `.cursor/mcp.json`
4. **Test connection**: Verify the MCP server responds correctly

## Environment Variables

Add these to your `.env` file when you have Canva OAuth credentials:

```bash
# Canva MCP
CANVA_CLIENT_ID=""
CANVA_CLIENT_SECRET=""
CANVA_REDIRECT_URI="http://localhost:3000/callback"
CANVA_MCP_URL="https://mcp.canva.com/mcp"
```

## Use Cases for BarkTech

- **Product images**: Generate professional product photos and marketing materials
- **Social media posts**: Create branded content for Instagram, Facebook, LinkedIn
- **Presentations**: Build sales decks and product presentations
- **Documents**: Generate invoices, proposals, and business documents
- **Video content**: Create short promotional videos and product demos

## Cursor MCP Configuration

To add Canva MCP to your Cursor IDE:

1. Create or edit `.cursor/mcp.json` in your project root
2. Add the canva server configuration
3. Restart Cursor to load the new MCP server

```json
{
  "mcpServers": {
    "canva": {
      "type": "http",
      "url": "https://mcp.canva.com/mcp"
    }
  }
}
```
