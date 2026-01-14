import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';

// Mock fs module
vi.mock('fs');
vi.mock('os');

describe('DBeaverConfigParser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.platform).mockReturnValue('darwin');
    vi.mocked(os.homedir).mockReturnValue('/Users/test');
  });

  describe('getDefaultWorkspacePath', () => {
    it('should return macOS path on darwin', async () => {
      vi.mocked(os.platform).mockReturnValue('darwin');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      // Dynamic import to get fresh instance
      const { DBeaverConfigParser } = await import('../src/config-parser.js');
      const parser = new DBeaverConfigParser({});

      expect(parser.getWorkspacePath()).toContain('Library/DBeaverData');
    });
  });

  describe('parseConnections', () => {
    it('should return empty array when no config exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const { DBeaverConfigParser } = await import('../src/config-parser.js');
      const parser = new DBeaverConfigParser({});

      const connections = await parser.parseConnections();
      expect(connections).toEqual([]);
    });
  });
});
