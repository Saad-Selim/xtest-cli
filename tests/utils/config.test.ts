import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getConfig, saveConfig } from '../../src/utils/config';

// Mock fs and os modules
jest.mock('fs/promises');
jest.mock('os');

describe('Config Utils', () => {
  const mockHomedir = '/mock/home';
  const mockConfigPath = path.join(mockHomedir, '.xtest', 'config.json');

  beforeEach(() => {
    jest.clearAllMocks();
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
  });

  describe('getConfig', () => {
    it('should return default config when file does not exist', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const config = await getConfig();

      expect(config).toEqual({
        apiKey: '',
        serverUrl: 'https://xtest.ing',
      });
    });

    it('should return parsed config when file exists', async () => {
      const mockConfig = {
        apiKey: 'test-key-123',
        serverUrl: 'https://custom.xtest.ing',
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await getConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });
  });

  describe('saveConfig', () => {
    it('should create directory and save config', async () => {
      const existingConfig = {
        apiKey: 'old-key',
        serverUrl: 'https://xtest.ing',
      };
      const newConfig = {
        apiKey: 'new-key',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingConfig));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await saveConfig(newConfig);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockHomedir, '.xtest'),
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({ ...existingConfig, ...newConfig }, null, 2)
      );
    });

    it('should throw error when save fails', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('{}');
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await expect(saveConfig({ apiKey: 'test' })).rejects.toThrow(
        'Failed to save config: Error: Write failed'
      );
    });
  });
}); 