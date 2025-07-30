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
    initialize: () => Promise<any>;
  };
  
  client: {
    create: (clientData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
    search: (searchTerm: string) => Promise<any>;
  };

  job: {
    create: (jobData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    getByClient: (clientId: number) => Promise<any>;
    getByStatus: (status: string) => Promise<any>;
    update: (id: number, updateData: any) => Promise<any>;
    updateStatus: (id: number, status: string) => Promise<any>;
    delete: (id: number) => Promise<any>;
    search: (searchTerm: string) => Promise<any>;
    getStats: () => Promise<any>;
    getByDateRange: (startDate: string, endDate?: string, status?: string) => Promise<any>;
  };

  jobType: {
    create: (jobTypeData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
    search: (searchTerm: string) => Promise<any>;
  };

  attachment: {
    create: (attachmentData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    getByJob: (jobId: number) => Promise<any>;
    delete: (id: number) => Promise<any>;
    saveFile: (fileName: string, fileBuffer: Buffer, subPath: string, jobId?: number, paymentId?: number) => Promise<any>;
    getContent: (id: number) => Promise<any>;
  };

  payment: {
    create: (paymentData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    getByJob: (jobId: number) => Promise<any>;
    getByDateRange: (startDate: string, endDate: string) => Promise<any>;
    update: (id: number, updateData: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
    getStats: () => Promise<any>;
  };

  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: string) => Promise<any>;
    getAll: () => Promise<any>;
    delete: (key: string) => Promise<any>;
  };

  filesystem: {
    openFile: (id: number) => Promise<any>;
    showInFolder: (id: number) => Promise<any>;
  };

  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };
}

// Entity interfaces
export interface JobType extends BaseEntity {
  name: string;
  description?: string;
  base_price: number;
  base_hours: number;
  color_hex: string;
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
