import { ipcMain } from 'electron';
import { OrmDatabaseService } from './database/orm-database.service';
import { ClientService, JobService, AttachmentService, PaymentService, ConfigService } from './services';

let dbService: OrmDatabaseService;
let clientService: ClientService;
let jobService: JobService;
let attachmentService: AttachmentService;
let paymentService: PaymentService;
let configService: ConfigService;

export function setupIpcHandlers(): void {
  // Initialize database and services
  ipcMain.handle('database:initialize', async () => {
    try {
      dbService = new OrmDatabaseService();
      await dbService.initialize();
      
      // Initialize all services
      clientService = new ClientService(dbService);
      jobService = new JobService(dbService);
      attachmentService = new AttachmentService(dbService);
      paymentService = new PaymentService(dbService);
      configService = new ConfigService(dbService);
      
      return { success: true, message: 'Database and services initialized successfully' };
    } catch (error: any) {
      console.error('Database initialization failed:', error);
      return { success: false, message: error.message };
    }
  });

  // Client handlers
  ipcMain.handle('client:create', async (event, clientData) => {
    return await clientService.createClient(clientData);
  });

  ipcMain.handle('client:getAll', async () => {
    return await clientService.getAllClients();
  });

  ipcMain.handle('client:getById', async (event, id) => {
    return await clientService.getClientById(id);
  });

  ipcMain.handle('client:update', async (event, id, updateData) => {
    return await clientService.updateClient(id, updateData);
  });

  ipcMain.handle('client:delete', async (event, id) => {
    return await clientService.deleteClient(id);
  });

  ipcMain.handle('client:search', async (event, searchTerm) => {
    return await clientService.searchClients(searchTerm);
  });

  // Job handlers
  ipcMain.handle('job:create', async (event, jobData) => {
    return await jobService.createJob(jobData);
  });

  ipcMain.handle('job:getAll', async () => {
    return await jobService.getAllJobs();
  });

  ipcMain.handle('job:getById', async (event, id) => {
    return await jobService.getJobById(id);
  });

  ipcMain.handle('job:getByClient', async (event, clientId) => {
    return await jobService.getJobsByClient(clientId);
  });

  ipcMain.handle('job:getByStatus', async (event, status) => {
    return await jobService.getJobsByStatus(status);
  });

  ipcMain.handle('job:update', async (event, id, updateData) => {
    return await jobService.updateJob(id, updateData);
  });

  ipcMain.handle('job:updateStatus', async (event, id, status) => {
    return await jobService.updateStatus(id, status);
  });

  ipcMain.handle('job:delete', async (event, id) => {
    return await jobService.deleteJob(id);
  });

  ipcMain.handle('job:search', async (event, searchTerm) => {
    return await jobService.searchJobs(searchTerm);
  });

  ipcMain.handle('job:getStats', async () => {
    return await jobService.getJobStats();
  });

  // Attachment handlers
  ipcMain.handle('attachment:create', async (event, attachmentData) => {
    return await attachmentService.createAttachment(attachmentData);
  });

  ipcMain.handle('attachment:getAll', async () => {
    return await attachmentService.getAllAttachments();
  });

  ipcMain.handle('attachment:getById', async (event, id) => {
    return await attachmentService.getAttachmentById(id);
  });

  ipcMain.handle('attachment:getByJob', async (event, jobId) => {
    return await attachmentService.getAttachmentsByJob(jobId);
  });

  ipcMain.handle('attachment:delete', async (event, id) => {
    return await attachmentService.deleteAttachment(id);
  });

  ipcMain.handle('attachment:saveFile', async (event, fileName, fileBuffer, subPath, jobId, paymentId) => {
    return await attachmentService.saveFile(fileName, fileBuffer, subPath, jobId, paymentId);
  });

  ipcMain.handle('attachment:getContent', async (event, id) => {
    return await attachmentService.getFileContent(id);
  });

  // Payment handlers
  ipcMain.handle('payment:create', async (event, paymentData) => {
    return await paymentService.createPayment(paymentData);
  });

  ipcMain.handle('payment:getAll', async () => {
    return await paymentService.getAllPayments();
  });

  ipcMain.handle('payment:getById', async (event, id) => {
    return await paymentService.getPaymentById(id);
  });

  ipcMain.handle('payment:getByJob', async (event, jobId) => {
    return await paymentService.getPaymentsByJob(jobId);
  });

  ipcMain.handle('payment:getByDateRange', async (event, startDate, endDate) => {
    return await paymentService.getPaymentsByDateRange(new Date(startDate), new Date(endDate));
  });

  ipcMain.handle('payment:update', async (event, id, updateData) => {
    return await paymentService.updatePayment(id, updateData);
  });

  ipcMain.handle('payment:delete', async (event, id) => {
    return await paymentService.deletePayment(id);
  });

  ipcMain.handle('payment:getStats', async () => {
    return await paymentService.getPaymentStats();
  });

  // Config handlers
  ipcMain.handle('config:get', async (event, key) => {
    return await configService.getConfig(key);
  });

  ipcMain.handle('config:set', async (event, key, value) => {
    return await configService.setConfig(key, value);
  });

  ipcMain.handle('config:getAll', async () => {
    return await configService.getAllConfigs();
  });

  ipcMain.handle('config:delete', async (event, key) => {
    return await configService.deleteConfig(key);
  });

  // App handlers
  ipcMain.handle('app:getVersion', async () => {
    const { app } = require('electron');
    return app.getVersion();
  });

  ipcMain.handle('app:getPlatform', async () => {
    return process.platform;
  });
}