# TermCanvas

**Infinite canvas terminal multiplexer for coding agents**

Launch and manage multiple terminal windows on an infinite zoomable canvas. Run Claude Code, OpenCode, bash, Python, or any CLI tool — each in its own draggable, resizable terminal node. Think Figma/Miro, but every node is a real PTY terminal.

Forked from [AgentBase](https://github.com/AgentOrchestrator/AgentBase) (MIT License).

## Features

- **Infinite zoomable canvas** — pan, zoom, drag nodes freely (powered by xyflow/React Flow)
- **Real PTY terminals** — each node runs a real terminal session (xterm.js + node-pty)
- **Quick Terminal** (Cmd+K) — spawn a shell instantly at any canvas position
- **Spawn Command** — launch any CLI command (claude, opencode, python3, htop...)
- **Bulk Spawn** — create 1-20 terminals in a grid, same or different commands
- **Claude Code integration** — full agent support with session management and forking
- **Generic terminal agent** — spawn any CLI as a managed agent
- **Canvas persistence** — save/restore canvas layouts via SQLite
- **JSON Canvas export** — export to `.canvas` format for Obsidian interop
- **Cross-platform** — macOS, Linux, Windows (Electron)

## Quick Start

```bash
git clone https://github.com/NikhilArora1219/termcanvas.git
cd termcanvas
npm install
cp .env.local.example .env
npm run dev
```

## Usage

- **Right-click canvas** — context menu with Quick Terminal, Spawn Command, Spawn Multiple, Add Agent
- **Cmd+K** — quick terminal at viewport center
- **Cmd+T** — add agent node (Claude Code)
- **Cmd+N** — new conversation
- **Drag nodes** — reposition freely on the canvas
- **Resize nodes** — drag edges to resize terminal windows
- **Zoom** — scroll to zoom, pinch on trackpad

## Architecture

```
termcanvas/
  apps/desktop/          # Electron + Vite + React + xterm.js
    src/main/            # Electron main process (PTY, DB, services)
    src/renderer/        # React UI (canvas, nodes, hooks, stores)
  packages/shared/       # Shared types, parsers, readers
```

| Layer | Tech |
|-------|------|
| Canvas | @xyflow/react v12 |
| Terminal | @xterm/xterm 5.5 + WebGL addon |
| PTY | node-pty |
| State | Zustand + SQLite |
| Build | Turborepo + Vite + TypeScript 5.9 |
| Shell | Electron 39 |

## Agent Types

| Type | Description |
|------|-------------|
| `claude_code` | Full Claude Code SDK integration with session management |
| `generic` | Any CLI command — no SDK dependency, pure PTY |

## Roadmap

- **v1.0** (current) — Infinite canvas + terminals + generic agent + JSON Canvas export
- **v2.0** — WebSocket backend (Bun + Hono + bun-pty) for browser access, OpenClaw + Sim Studio integration
- **v3.0** — Obsidian .canvas import, real-time collaboration, prediction parameter spawning, community release

## Testing

```bash
npm run test           # All tests (Turborepo)
cd apps/desktop
npx vitest run         # Desktop tests only
npx vitest --watch     # Watch mode
```

## Building

```bash
cd apps/desktop
npm run dist           # Build distributable (DMG on macOS)
```

## License

MIT — see [LICENSE](LICENSE)

## Credits

Built on [AgentBase](https://github.com/AgentOrchestrator/AgentBase) by Hai Dang and the Agent Orchestrator team.
