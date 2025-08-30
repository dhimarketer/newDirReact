import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Set default auth token for tests
localStorageMock.getItem.mockImplementation((key: string) => {
  if (key === 'dirfinal_auth_token') {
    return 'test-auth-token';
  }
  if (key === 'dirfinal_refresh_token') {
    return 'test-refresh-token';
  }
  return null;
});

// Mock fetch globally to prevent real API calls
global.fetch = vi.fn();

// Mock axios to prevent real HTTP requests
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Mock all service modules
vi.mock('../services/familyService', () => ({
  default: {
    getFamilies: vi.fn(),
    getFamilyById: vi.fn(),
    createFamily: vi.fn(),
    updateFamily: vi.fn(),
    deleteFamily: vi.fn(),
  },
}));

vi.mock('../services/directoryService', () => ({
  default: {
    searchDirectory: vi.fn(),
    getDirectoryEntry: vi.fn(),
    createDirectoryEntry: vi.fn(),
    updateDirectoryEntry: vi.fn(),
    deleteDirectoryEntry: vi.fn(),
    getDirectoryStats: vi.fn(),
  },
}));

vi.mock('../services/atollService', () => ({
  default: {
    getAtolls: vi.fn(),
    getAtollById: vi.fn(),
  },
}));

vi.mock('../services/islandService', () => ({
  default: {
    getIslands: vi.fn(),
    getIslandById: vi.fn(),
  },
}));

vi.mock('../services/partyService', () => ({
  default: {
    getParties: vi.fn(),
    getPartyById: vi.fn(),
  },
}));

// Mock API service
vi.mock('../services/api', () => ({
  default: {
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
