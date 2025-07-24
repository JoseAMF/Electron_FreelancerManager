"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    database: {
        initialize: () => electron_1.ipcRenderer.invoke('database:initialize')
    },
    client: {
        create: (clientData) => electron_1.ipcRenderer.invoke('client:create', clientData),
        getAll: () => electron_1.ipcRenderer.invoke('client:getAll'),
        getById: (id) => electron_1.ipcRenderer.invoke('client:getById', id),
        update: (id, updateData) => electron_1.ipcRenderer.invoke('client:update', id, updateData),
        delete: (id) => electron_1.ipcRenderer.invoke('client:delete', id),
        search: (searchTerm) => electron_1.ipcRenderer.invoke('client:search', searchTerm)
    },
    job: {
        create: (jobData) => electron_1.ipcRenderer.invoke('job:create', jobData),
        getAll: () => electron_1.ipcRenderer.invoke('job:getAll'),
        getById: (id) => electron_1.ipcRenderer.invoke('job:getById', id),
        getByClient: (clientId) => electron_1.ipcRenderer.invoke('job:getByClient', clientId),
        getByStatus: (status) => electron_1.ipcRenderer.invoke('job:getByStatus', status),
        update: (id, updateData) => electron_1.ipcRenderer.invoke('job:update', id, updateData),
        updateStatus: (id, status) => electron_1.ipcRenderer.invoke('job:updateStatus', id, status),
        delete: (id) => electron_1.ipcRenderer.invoke('job:delete', id),
        search: (searchTerm) => electron_1.ipcRenderer.invoke('job:search', searchTerm),
        getStats: () => electron_1.ipcRenderer.invoke('job:getStats')
    },
    attachment: {
        create: (attachmentData) => electron_1.ipcRenderer.invoke('attachment:create', attachmentData),
        getAll: () => electron_1.ipcRenderer.invoke('attachment:getAll'),
        getById: (id) => electron_1.ipcRenderer.invoke('attachment:getById', id),
        getByJob: (jobId) => electron_1.ipcRenderer.invoke('attachment:getByJob', jobId),
        delete: (id) => electron_1.ipcRenderer.invoke('attachment:delete', id),
        saveFile: (fileName, fileBuffer, jobId, paymentId) => electron_1.ipcRenderer.invoke('attachment:saveFile', fileName, fileBuffer, jobId, paymentId),
        getContent: (id) => electron_1.ipcRenderer.invoke('attachment:getContent', id)
    },
    payment: {
        create: (paymentData) => electron_1.ipcRenderer.invoke('payment:create', paymentData),
        getAll: () => electron_1.ipcRenderer.invoke('payment:getAll'),
        getById: (id) => electron_1.ipcRenderer.invoke('payment:getById', id),
        getByJob: (jobId) => electron_1.ipcRenderer.invoke('payment:getByJob', jobId),
        getByDateRange: (startDate, endDate) => electron_1.ipcRenderer.invoke('payment:getByDateRange', startDate, endDate),
        update: (id, updateData) => electron_1.ipcRenderer.invoke('payment:update', id, updateData),
        delete: (id) => electron_1.ipcRenderer.invoke('payment:delete', id),
        getStats: () => electron_1.ipcRenderer.invoke('payment:getStats')
    },
    config: {
        get: (key) => electron_1.ipcRenderer.invoke('config:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('config:set', key, value),
        getAll: () => electron_1.ipcRenderer.invoke('config:getAll'),
        delete: (key) => electron_1.ipcRenderer.invoke('config:delete', key)
    },
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
        getPlatform: () => electron_1.ipcRenderer.invoke('app:getPlatform')
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map