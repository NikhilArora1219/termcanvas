# TermCanvas

Infinite canvas terminal multiplexer for coding agents. Forked from AgentBase.

## Build & Run

```bash
npm install && npm run dev
```

## Test

```bash
npm run test                    # All tests
cd apps/desktop && npx vitest run  # Desktop tests only
```

## Architecture

- **Monorepo**: `apps/desktop` (Electron) + `packages/shared` (types/parsers)
- **Canvas**: @xyflow/react v12 in `apps/desktop/src/renderer/Canvas.tsx`
- **Terminals**: xterm.js in `apps/desktop/src/renderer/nodes/TerminalNode.tsx`
- **PTY**: node-pty in `apps/desktop/src/main/main.ts`
- **State**: Zustand + SQLite persistence
- **Agent abstraction**: CodingAgent interface in `apps/desktop/src/main/services/coding-agent/`
- **Agent types**: `claude_code` (Claude SDK) | `generic` (any CLI command)

## Key Patterns

- No defensive defaults — let code fail explicitly
- No spread operator — use explicit assignment
- Views = UI only, business logic → Services + Stores
- `useExpose()` required for interactive components (MCP automation)
