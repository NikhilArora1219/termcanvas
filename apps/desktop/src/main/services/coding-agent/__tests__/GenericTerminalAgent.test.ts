import { beforeEach, describe, expect, it } from 'vitest';
import { GenericTerminalAgent } from '../GenericTerminalAgent';
import type { AgentConfig } from '../types';
import { AgentErrorCode } from '../types';

describe('GenericTerminalAgent', () => {
  let agent: GenericTerminalAgent;
  const config: AgentConfig = { type: 'generic' };

  beforeEach(() => {
    agent = new GenericTerminalAgent(config);
  });

  describe('identity', () => {
    it('should have agentType "generic"', () => {
      expect(agent.agentType).toBe('generic');
    });
  });

  describe('capabilities', () => {
    it('should report all capabilities as false', () => {
      const caps = agent.getCapabilities();
      expect(caps.canGenerate).toBe(false);
      expect(caps.canResumeSession).toBe(false);
      expect(caps.canForkSession).toBe(false);
      expect(caps.canListSessions).toBe(false);
      expect(caps.supportsStreaming).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('should initialize successfully', async () => {
      const result = await agent.initialize();
      expect(result.success).toBe(true);
    });

    it('should always be available', async () => {
      expect(await agent.isAvailable()).toBe(true);
    });

    it('should dispose without error', async () => {
      await expect(agent.dispose()).resolves.not.toThrow();
    });

    it('should cancelAll without error', async () => {
      await expect(agent.cancelAll()).resolves.not.toThrow();
    });
  });

  describe('context management', () => {
    it('should set and get agentId', () => {
      expect(agent.getAgentId()).toBeNull();
      agent.setAgentId('test-agent-1');
      expect(agent.getAgentId()).toBe('test-agent-1');
    });

    it('should set and get gitBranch', () => {
      expect(agent.getGitBranch()).toBeNull();
      agent.setGitBranch('main');
      expect(agent.getGitBranch()).toBe('main');
    });
  });

  describe('generation (unsupported)', () => {
    it('should return CAPABILITY_NOT_SUPPORTED for generate', async () => {
      const result = await agent.generate({ prompt: 'test' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });

    it('should return CAPABILITY_NOT_SUPPORTED for generateStreaming', async () => {
      const result = await agent.generateStreaming({ prompt: 'test' }, () => {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });

    it('should return CAPABILITY_NOT_SUPPORTED for generateStreamingStructured', async () => {
      const result = await agent.generateStreamingStructured({ prompt: 'test' }, () => {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });
  });

  describe('session operations (unsupported)', () => {
    it('should return CAPABILITY_NOT_SUPPORTED for continueSession', async () => {
      const result = await agent.continueSession({ type: 'latest' }, 'test');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });

    it('should return CAPABILITY_NOT_SUPPORTED for continueSessionStreaming', async () => {
      const result = await agent.continueSessionStreaming({ type: 'latest' }, 'test', () => {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });

    it('should return CAPABILITY_NOT_SUPPORTED for forkSession', async () => {
      const result = await agent.forkSession({ sessionId: 'test' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AgentErrorCode.CAPABILITY_NOT_SUPPORTED);
      }
    });
  });

  describe('chat history (empty results)', () => {
    it('should return empty session summaries', async () => {
      const result = await agent.listSessionSummaries();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return null for getSession', async () => {
      const result = await agent.getSession('any-id');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return empty modification times', async () => {
      const result = await agent.getSessionModificationTimes();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.size).toBe(0);
      }
    });

    it('should return empty data paths', () => {
      expect(agent.getDataPaths()).toEqual([]);
    });
  });

  describe('session validation', () => {
    it('should return false for sessionFileExists', async () => {
      expect(await agent.sessionFileExists('any-id', '/any/path')).toBe(false);
    });
  });

  describe('events', () => {
    it('should return an event registry', () => {
      const registry = agent.getEventRegistry();
      expect(registry).toBeDefined();
    });
  });
});
