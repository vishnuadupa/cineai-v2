---
name: mongodb-mcp-setup
description: >
  Set up the MongoDB MCP (Model Context Protocol) Server to enable AI agents
  to interact directly with MongoDB databases. Use when configuring MCP for
  Claude Code, Cursor, or other MCP-compatible agents, when authenticating
  with Atlas, or when you want agents to run live queries, inspect schemas,
  or manage indexes interactively. Triggers on: "MCP server", "mongodb mcp",
  "connect agent to MongoDB", "live database access", "Atlas MCP".
source:
  repository: mongodb/agent-skills
  ref: main
  path: skills/mongodb-mcp-setup
---

# MongoDB MCP Server Setup

The MongoDB MCP Server lets agents run live queries, inspect schemas,
create indexes, and manage data directly — no manual copy-pasting of results.

## Install

```bash
npx mongodb-mcp-server@1 setup
```

This creates an `mcp.json` in your project root and walks through auth.

## Manual mcp.json (Atlas connection string)

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server@1"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://user:pass@cluster.mongodb.net/movie-recs"
      }
    }
  }
}
```

Never commit `mcp.json` with credentials. Add to `.gitignore`:
```
mcp.json
```

Or use environment variable injection instead of hardcoding in the file:
```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server@1"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "${MONGODB_URI}"
      }
    }
  }
}
```

## What the MCP Server Enables

Once connected, agents can:
- `list_collections` — see all collections
- `find` — run find queries with filters
- `aggregate` — run aggregation pipelines
- `create_index` — add indexes
- `explain` — get query plans
- `count_documents` — count with filters
- `insert_one` / `insert_many` — insert documents
- `update_one` / `update_many` — update documents
- `delete_one` / `delete_many` — delete documents

## For This Project

For `movie-rec-engine` + Atlas M0:

1. Get connection string from Atlas → Connect → Drivers
2. Run: `npx mongodb-mcp-server@1 setup`
3. When prompted, paste your connection string
4. Add `mcp.json` to `.gitignore`
5. Restart your agent (Claude Code / Cursor)

The agent can then inspect the `sessions` collection, check index usage,
run test queries, and verify TTL index is working — all without leaving
the chat.
