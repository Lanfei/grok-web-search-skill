# Grok Search Skill

An AI agent skill that enables real-time Web Search and X Search using xAI's Grok model with automatic citation and source extraction.

## Features

- 🔍 Real-time web search with xAI's Grok model
- X Real-time X search for posts, handles, and threads
- 📚 Automatic source URL extraction and citations
- 🎯 **Auto-triggered by keywords**: "搜索", "查询", "最新", "实时", "search", "latest", etc.
- ⚡ Priority usage when users request current/recent information
- 🌐 Multi-language support (English, Chinese, etc.)
- ⏱️ Fast responses (~15-25 seconds average)

## Quick Start

### Agent-Assisted Install

Tell your agent:

```text
Please install and configure this Skill interactively for me:

npx -y -p grok-search-skill install-skill --skills-dir <skills-directory>
```

### Manual Install

1) Install the skill

```bash
npx -y -p grok-search-skill install-skill --skills-dir <skills-directory>
```

2) Set API key

Get your API key from [console.x.ai](https://console.x.ai).

```bash
export XAI_API_KEY="your-api-key-here"
```

Then restart your agent client and use:

```text
/grok-search "<query to search>"
```

## Using in Agents

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
/grok-search "<query to search>"
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
| Skill not found in agent client | Check your configured skills directory and restart your agent client |
| No sources returned | Normal - model didn't need web search for that query                  |
| Dependencies error | `cd <skills-directory>/grok-search && npm install`                    |

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
