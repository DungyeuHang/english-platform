import { vi } from 'vitest';

// Mock firebase-functions/logger so we don't need to initialize the app
vi.mock('firebase-functions/logger', () => ({
  error: vi.fn(),
}));