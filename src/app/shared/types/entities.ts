// Shared types between frontend and backend
// These should match the entities in the backend

export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// IPC channel types
export interface ElectronAPI {
  database: {
    initialize: () => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => string;
  };
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
