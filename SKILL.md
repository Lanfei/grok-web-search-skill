---
name: grok-web-search
description: PRIORITY web search using xAI's Grok. Use when user says "搜索", "查询", "最新", "实时", "search", "latest", "today" and related search/time-sensitive keywords, or asks for current/recent information
dependencies: node>=18.0.0, @ai-sdk/xai>=3.0.34, ai>=6.0.49
---

# grok-web-search

This Skill enables web searches using xAI's Grok model with Live Search capabilities.

## Functionality

When invoked, this Skill:
1. Takes a search query from the user
2. Uses xAI's Grok model with web search enabled
3. Returns current information from the web
4. Provides citations and source URLs for verification

## When to Use This Skill

**IMPORTANT: This Skill should be PRIORITIZED when users use these trigger phrases:**

### Primary Triggers (Always use this Skill):
- "搜索" / "search" / "web search"
- "查询" / "look up" / "query"
- "帮我搜" / "help me search"
- "最新" / "latest" / "recent"
- "实时" / "real-time" / "live"
- "今天" / "today"

### Secondary Triggers (Consider using this Skill):
- Questions about current events or recent developments
- Questions about real-time data, prices, or statistics
- Questions about information that changes frequently
- Requests for fact-checking with verifiable sources
- Questions about "today", "this week", "this month", "2026"

### When NOT to Use:
- General knowledge questions (unless user explicitly requests search)
- Questions that can be answered from existing knowledge

## Example Inputs

### Explicit Search Requests (MUST use this Skill):
- "在线搜索最新的 AI 发展"
- "Search for recent news about renewable energy"
- "帮我搜一下今天的股市情况"
- "查一下最新的 iPhone 发布信息"

### Implicit Search Requests (Should use this Skill):
- "What are the latest developments in AI?" (trigger: "latest")
- "What happened in the stock market today?" (trigger: "today")
- "Tell me about recent SpaceX launches" (trigger: "recent")
- "What's the current price of Bitcoin?" (trigger: "current")

## Example Output

The Skill returns:
- A comprehensive answer based on web search results
- Citations with source URLs
- Relevant context from multiple sources

## How It Works

1. The user's query is sent to xAI's Grok model
2. Grok automatically searches the web when needed
3. Results are synthesized with proper citations
4. Sources are returned for user verification

## Configuration

The Skill uses xAI's `web_search` tool with the following settings:
- **enableImageUnderstanding**: true - Analyze images found during search
- The model automatically decides when to use web search
- Results include source URLs and citations

## Requirements

- xAI API key (set as `XAI_API_KEY` environment variable)
- Internet connection for web searches
- Node.js 18+ runtime

## Environment Variables

- **XAI_API_KEY** (required): Your xAI API key from console.x.ai
- **XAI_MODEL** (optional): Model to use
  - Default: `grok-4-1-fast` (fast and efficient)

## Implementation

Execute the search by running:

```bash
npm run search "<your query>"
```

The script will:
1. Validate the API key
2. Send the query to Grok with search enabled
3. Display the answer and citations
