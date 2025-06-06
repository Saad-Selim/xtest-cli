import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface Config {
  apiKey: string;
  serverUrl: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.xtest');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export async function getConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      apiKey: '',
      serverUrl: 'https://xtest.ing',
    };
  }
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  try {
    // Ensure config directory exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    
    // Get existing config
    const existing = await getConfig();
    
    // Merge with new config
    const updated = { ...existing, ...config };
    
    // Save to file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
} 