import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  database: {
    initialize: () => ipcRenderer.invoke('database:initialize')
  },
  
  client: {
    create: (clientData: any) => ipcRenderer.invoke('client:create', clientData),
    getAll: () => ipcRenderer.invoke('client:getAll'),
    getById: (id: number) => ipcRenderer.invoke('client:getById', id),
    update: (id: number, updateData: any) => ipcRenderer.invoke('client:update', id, updateData),
    delete: (id: number) => ipcRenderer.invoke('client:delete', id),
    search: (searchTerm: string) => ipcRenderer.invoke('client:search', searchTerm)
  },

  job: {
    create: (jobData: any) => ipcRenderer.invoke('job:create', jobData),
    getAll: () => ipcRenderer.invoke('job:getAll'),
    getById: (id: number) => ipcRenderer.invoke('job:getById', id),
    getByClient: (clientId: number) => ipcRenderer.invoke('job:getByClient', clientId),
    getByStatus: (status: string) => ipcRenderer.invoke('job:getByStatus', status),
    update: (id: number, updateData: any) => ipcRenderer.invoke('job:update', id, updateData),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('job:updateStatus', id, status),
    delete: (id: number) => ipcRenderer.invoke('job:delete', id),
    search: (searchTerm: string) => ipcRenderer.invoke('job:search', searchTerm),
    getStats: () => ipcRenderer.invoke('job:getStats'),
    // Date-filtered methods
    getByDateRange: (startDate: string, endDate?: string, status?: string) => 
      ipcRenderer.invoke('job:getByDateRange', startDate, endDate, status),
  },

  attachment: {
    create: (attachmentData: any) => ipcRenderer.invoke('attachment:create', attachmentData),
    getAll: () => ipcRenderer.invoke('attachment:getAll'),
    getById: (id: number) => ipcRenderer.invoke('attachment:getById', id),
    getByJob: (jobId: number) => ipcRenderer.invoke('attachment:getByJob', jobId),
    delete: (id: number) => ipcRenderer.invoke('attachment:delete', id),
    saveFile: (fileName: string, fileBuffer: Buffer, subPath: string, jobId?: number, paymentId?: number) => 
      ipcRenderer.invoke('attachment:saveFile', fileName, fileBuffer, subPath, jobId, paymentId),
    getContent: (id: number) => ipcRenderer.invoke('attachment:getContent', id)
  },

  payment: {
    create: (paymentData: any) => ipcRenderer.invoke('payment:create', paymentData),
    getAll: () => ipcRenderer.invoke('payment:getAll'),
    getById: (id: number) => ipcRenderer.invoke('payment:getById', id),
    getByJob: (jobId: number) => ipcRenderer.invoke('payment:getByJob', jobId),
    getByDateRange: (startDate: string, endDate: string) => 
      ipcRenderer.invoke('payment:getByDateRange', startDate, endDate),
    update: (id: number, updateData: any) => ipcRenderer.invoke('payment:update', id, updateData),
    delete: (id: number) => ipcRenderer.invoke('payment:delete', id),
    getStats: () => ipcRenderer.invoke('payment:getStats')
  },

  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll'),
    delete: (key: string) => ipcRenderer.invoke('config:delete', key)
  },

  filesystem: {
    openFile: (id: number) => ipcRenderer.invoke('filesystem:openFile', id),
    showInFolder: (id: number) => ipcRenderer.invoke('filesystem:showInFolder', id)
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}