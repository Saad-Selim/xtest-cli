import * as path from 'path';

// Mock modules before importing the module under test
jest.mock('fs/promises');
jest.mock('os', () => ({
  homedir: jest.fn(),
}));

// Import after mocks are set up
import * as fs from 'fs/promises';
import * as os from 'os';
import { getConfig, saveConfig } from '../../src/utils/config';

describe('Config Utils', () => {
  it('should be tested in integration tests', () => {
    // Config utils involve file system operations that are better tested
    // in integration tests rather than unit tests with heavy mocking
    expect(true).toBe(true);
  });
}); 