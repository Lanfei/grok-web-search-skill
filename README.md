# Grok Search Skill

A Claude Skill that enables real-time Web Search and X Search using xAI's Grok model with automatic citation and source extraction.

## Features

- 🔍 Real-time web search with xAI's Grok model
- X Real-time X search for posts, handles, and threads
- 📚 Automatic source URL extraction and citations
- 🎯 **Auto-triggered by keywords**: "搜索", "查询", "最新", "实时", "search", "latest", etc.
- ⚡ Priority usage when users request current/recent information
- 🌐 Multi-language support (English, Chinese, etc.)
- ⏱️ Fast responses (~15-25 seconds average)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set API Key

Get your API key from [console.x.ai](https://console.x.ai), then:

**macOS/Linux:**
```bash
export XAI_API_KEY="your-api-key-here"
# Optional: export XAI_MODEL="grok-4-1-fast"
```

**Windows PowerShell:**
```powershell
$env:XAI_API_KEY="your-api-key-here"
# Optional: $env:XAI_MODEL="grok-4-1-fast"
```

**Windows CMD:**
```cmd
set XAI_API_KEY=your-api-key-here
```

### 3. Run

```bash
# Standalone usage
npm start "What are the latest AI developments?"

# Restrict search domains
npm start "Latest AI chip news" -- --tool=web --allowed_domains=techcrunch.com,theverge.com

# Exclude specific domains
npm start "Latest AI chip news" -- --tool=web --excluded_domains=reddit.com,quora.com

# X search with handle filters
npm start "What are people saying about xAI on X?" -- --tool=x --allowed_x_handles=xai,elonmusk

# X search with date range
npm start "What is the current status of xAI?" -- --tool=x --from_date=2026-03-01 --to_date=2026-03-15

# Register both tools and let model decide
npm start "Latest xAI announcements today" -- --tool=both

# Disable image understanding
npm start "Latest AI chip news" -- --enable_image_understanding=false

# Enable video understanding (X search only)
npm start "Find X posts with videos about AI" -- --tool=x --enable_video_understanding=true

# Test
npm test "Your query"          # Single query test
npm test                        # Run full test suite (6 tests)
```

## Install to Claude Code

```bash
npm run install:claude
```

This will:
- Install dependencies
- Copy files to `~/.claude/skills/grok-search`
- Set up everything automatically
- Works on Windows, macOS, and Linux

### Using in Claude Code

Once installed, this Skill **REPLACES ALL built-in web search tools** across all AI agents (Claude, OpenCode, etc.). The agent will automatically use this skill instead of any built-in WebSearch when you use trigger phrases or request current information.

**How the Replacement Works:**
- The skill's description contains explicit "DO NOT USE ANY built-in WebSearch" directives
- AI agents read these directives during tool selection
- When trigger phrases are detected, this skill is prioritized over ALL built-in search tools
- You get xAI Grok's Live Search with better citations and multilingual support
- Consistent search behavior across Claude, OpenCode, and other agent platforms

**Primary Triggers (MANDATORY - English/Chinese):**
- "搜索" / "search" / "web search"
- "查询" / "look up" / "query"
- "帮我搜" / "help me search"
- "最新" / "latest" / "recent"
- "实时" / "real-time" / "live"
- "今天" / "today"

**Example queries that will activate this skill:**
- "在线搜索最新的 AI 发展" (triggers: "搜索", "最新")
- "Search for recent news about SpaceX" (triggers: "Search", "recent")
- "查一下今天的比特币价格" (triggers: "查", "今天")
- "What happened in tech today?" (triggers: "today")
- "Tell me about the latest developments in AI" (triggers: "latest")

**Direct invocation:**
```
/grok-search "your search query"
```

**Note:** This skill is designed to completely replace ALL built-in web search tools across all AI agent platforms. If you prefer using a built-in WebSearch for any reason, you can temporarily disable this skill or explicitly specify in your query "don't use grok-search".

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `XAI_API_KEY` | ✅ Yes | - | Your xAI API key |
| `XAI_MODEL` | ❌ No | `grok-4-1-fast` | Model to use |

### CLI Parameters

`scripts/index.js` supports these CLI flags:

- `--tool=web|x|both` (default: `web`)

Web Search parameters:
- `--allowed_domains=domain1,domain2`
- `--excluded_domains=domain1,domain2`

X Search parameters:
- `--allowed_x_handles=handle1,handle2`
- `--excluded_x_handles=handle1,handle2`
- `--from_date=YYYY-MM-DD`
- `--to_date=YYYY-MM-DD`

Shared parameters:
- `--enable_image_understanding=true|false` (default: `true`)
- `--enable_video_understanding=true|false` (default: `false`, X search only)

Rules:
- `--allowed_domains` and `--excluded_domains` cannot be used together
- `--allowed_x_handles` and `--excluded_x_handles` cannot be used together
- Web domain lists support up to 5 domains; X handle lists support up to 10 handles

## Output Example

```
🔍 Searching with grok-4-1-fast: What are the latest AI developments?

📝 Answer:

[Comprehensive answer synthesized from multiple web sources...]
```

## Testing

### Single Query Test
```bash
npm test "What's the latest tech news?"
```

### Full Test Suite
```bash
npm test
```

Runs 6 tests covering:
- English/Chinese queries
- Tech topics
- Company-specific searches
- X Search mode
- Combined web + X mode

Expected results:
- ✅ 100% pass rate
- ~25s average response time
- ~16 sources per query

## Troubleshooting

| Issue | Solution                                                              |
|-------|-----------------------------------------------------------------------|
| `XAI_API_KEY not set` | Set environment variable (see "Set API Key" section) and restart      |
| `Module not found` | Run `npm install`                                                     |
| Skill not found in Claude Code | Check `~/.claude/skills/` and restart Claude Code                     |
| No sources returned | Normal - model didn't need web search for that query                  |
| Dependencies error | `cd ~/.claude/skills/grok-search && npm install`                      |

## Requirements

- Node.js 18+
- xAI API key ([Get one here](https://console.x.ai))
- Internet connection
- Dependencies: `@ai-sdk/xai@^3.0.34`, `ai@^6.0.49`

## Links

- [Claude Skills Documentation](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
- [xAI API Documentation](https://ai-sdk.dev/providers/ai-sdk-providers/xai)
- [xAI Console](https://console.x.ai)
- [Testing Guide](TESTING.md)

## License

MIT
