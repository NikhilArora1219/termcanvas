import { afterEach, describe, expect, it } from 'vitest';
import { getCodingAgent, resetCodingAgentFactory } from '../CodingAgent';

afterEach(async () => {
  await resetCodingAgentFactory();
});

describe('CodingAgent Factory', () => {
  describe('generic agent', () => {
    it('should create a generic terminal agent', async () => {
      const result = await getCodingAgent('generic', { skipCliVerification: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentType).toBe('generic');
      }
    });

    it('should report generic agent as available', async () => {
      const result = await getCodingAgent('generic', { skipCliVerification: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(await result.data.isAvailable()).toBe(true);
      }
    });

    it('should report no generation capabilities for generic agent', async () => {
      const result = await getCodingAgent('generic', { skipCliVerification: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const caps = result.data.getCapabilities();
        expect(caps.canGenerate).toBe(false);
        expect(caps.supportsStreaming).toBe(false);
      }
    });
  });

  describe('unsupported agent types', () => {
    it('should return error for unknown agent type', async () => {
      // @ts-expect-error testing invalid type
      const result = await getCodingAgent('nonexistent_agent', { skipCliVerification: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AGENT_NOT_AVAILABLE');
      }
    });
  });
});
