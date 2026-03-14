/**
 * GenericTerminalAgent — Spawns any CLI command as an agent.
 *
 * No SDK dependency. The actual PTY is managed by TerminalNode —
 * this agent type simply identifies the terminal as "generic"
 * for the CodingAgent registry. All generation/session methods
 * are no-ops since generic terminals are controlled via PTY directly.
 */

import { EventEmitter } from 'node:events';
import type { EventRegistry } from '@termcanvas/shared';
import type { CodingAgent } from './CodingAgent';
import type {
  AgentCapabilities,
  AgentConfig,
  AgentError,
  CodingAgentSessionContent,
  CodingAgentType,
  ContinueOptions,
  ForkOptions,
  GenerateRequest,
  GenerateResponse,
  MessageFilterOptions,
  Result,
  SessionFilterOptions,
  SessionIdentifier,
  SessionInfo,
  SessionSummary,
  StreamCallback,
  StructuredStreamCallback,
} from './types';
import { AgentErrorCode, agentError, err, ok } from './types';

export class GenericTerminalAgent extends EventEmitter implements CodingAgent {
  readonly agentType: CodingAgentType = 'generic';
  private agentId: string | null = null;
  private gitBranch: string | null = null;

  constructor(private config: AgentConfig) {
    super();
  }

  getCapabilities(): AgentCapabilities {
    return {
      canGenerate: false,
      canResumeSession: false,
      canForkSession: false,
      canListSessions: false,
      supportsStreaming: false,
    };
  }

  // Lifecycle — generic terminals are always available
  async initialize(): Promise<Result<void, AgentError>> {
    return ok(undefined);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async cancelAll(): Promise<void> {
    // no-op — PTY processes are managed by TerminalNode
  }

  async dispose(): Promise<void> {
    // no-op
  }

  // Context management
  setAgentId(id: string): void {
    this.agentId = id;
  }

  getAgentId(): string | null {
    return this.agentId;
  }

  setGitBranch(branch: string): void {
    this.gitBranch = branch;
  }

  getGitBranch(): string | null {
    return this.gitBranch;
  }

  // Generation — not supported for generic terminals
  async generate(_request: GenerateRequest): Promise<Result<GenerateResponse, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support generation. Use PTY directly.'
      )
    );
  }

  async generateStreaming(
    _request: GenerateRequest,
    _onChunk: StreamCallback
  ): Promise<Result<GenerateResponse, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support streaming generation.'
      )
    );
  }

  async generateStreamingStructured(
    _request: GenerateRequest,
    _onChunk: StructuredStreamCallback
  ): Promise<Result<GenerateResponse, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support structured streaming.'
      )
    );
  }

  // Session continuation — not supported
  async continueSession(
    _identifier: SessionIdentifier,
    _prompt: string,
    _options?: ContinueOptions
  ): Promise<Result<GenerateResponse, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support sessions.'
      )
    );
  }

  async continueSessionStreaming(
    _identifier: SessionIdentifier,
    _prompt: string,
    _onChunk: StreamCallback,
    _options?: ContinueOptions
  ): Promise<Result<GenerateResponse, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support sessions.'
      )
    );
  }

  // Session forking — not supported
  async forkSession(_options: ForkOptions): Promise<Result<SessionInfo, AgentError>> {
    return err(
      agentError(
        AgentErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Generic terminals do not support forking.'
      )
    );
  }

  // Chat history — returns empty results
  async listSessionSummaries(
    _filter?: SessionFilterOptions
  ): Promise<Result<SessionSummary[], AgentError>> {
    return ok([]);
  }

  async getSession(
    _sessionId: string,
    _filter?: MessageFilterOptions
  ): Promise<Result<CodingAgentSessionContent | null, AgentError>> {
    return ok(null);
  }

  async getSessionModificationTimes(
    _filter?: SessionFilterOptions
  ): Promise<Result<Map<string, number>, AgentError>> {
    return ok(new Map());
  }

  getDataPaths(): string[] {
    return [];
  }

  // Session validation
  async sessionFileExists(_sessionId: string, _workspacePath: string): Promise<boolean> {
    return false;
  }

  // Events — no event registry for generic terminals
  getEventRegistry(): EventRegistry {
    return { handlers: new Map() } as unknown as EventRegistry;
  }
}
