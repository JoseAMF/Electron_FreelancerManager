"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const orm_database_service_1 = require("./database/orm-database.service");
const services_1 = require("./services");
let dbService;
let clientService;
let jobService;
let attachmentService;
let paymentService;
let configService;
function setupIpcHandlers() {
    // Initialize database and services
    electron_1.ipcMain.handle('database:initialize', () => __awaiter(this, void 0, void 0, function* () {
        try {
            dbService = new orm_database_service_1.OrmDatabaseService();
            yield dbService.initialize();
            // Initialize all services
            clientService = new services_1.ClientService(dbService);
            jobService = new services_1.JobService(dbService);
            attachmentService = new services_1.AttachmentService(dbService);
            paymentService = new services_1.PaymentService(dbService);
            configService = new services_1.ConfigService(dbService);
            return { success: true, message: 'Database and services initialized successfully' };
        }
        catch (error) {
            console.error('Database initialization failed:', error);
            return { success: false, message: error.message };
        }
    }));
    // Client handlers
    electron_1.ipcMain.handle('client:create', (event, clientData) => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.createClient(clientData);
    }));
    electron_1.ipcMain.handle('client:getAll', () => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.getAllClients();
    }));
    electron_1.ipcMain.handle('client:getById', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.getClientById(id);
    }));
    electron_1.ipcMain.handle('client:update', (event, id, updateData) => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.updateClient(id, updateData);
    }));
    electron_1.ipcMain.handle('client:delete', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.deleteClient(id);
    }));
    electron_1.ipcMain.handle('client:search', (event, searchTerm) => __awaiter(this, void 0, void 0, function* () {
        return yield clientService.searchClients(searchTerm);
    }));
    // Job handlers
    electron_1.ipcMain.handle('job:create', (event, jobData) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.createJob(jobData);
    }));
    electron_1.ipcMain.handle('job:getAll', () => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.getAllJobs();
    }));
    electron_1.ipcMain.handle('job:getById', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.getJobById(id);
    }));
    electron_1.ipcMain.handle('job:getByClient', (event, clientId) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.getJobsByClient(clientId);
    }));
    electron_1.ipcMain.handle('job:getByStatus', (event, status) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.getJobsByStatus(status);
    }));
    electron_1.ipcMain.handle('job:update', (event, id, updateData) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.updateJob(id, updateData);
    }));
    electron_1.ipcMain.handle('job:updateStatus', (event, id, status) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.updateStatus(id, status);
    }));
    electron_1.ipcMain.handle('job:delete', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.deleteJob(id);
    }));
    electron_1.ipcMain.handle('job:search', (event, searchTerm) => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.searchJobs(searchTerm);
    }));
    electron_1.ipcMain.handle('job:getStats', () => __awaiter(this, void 0, void 0, function* () {
        return yield jobService.getJobStats();
    }));
    // Date-filtered job handlers
    electron_1.ipcMain.handle('job:getByDateRange', (event, startDate, endDate, status) => __awaiter(this, void 0, void 0, function* () {
        if (endDate) {
            return yield jobService.getJobsByDateRange(new Date(startDate), new Date(endDate), status);
        }
        else {
            return yield jobService.getJobsByDateRange(new Date(startDate), undefined, status);
        }
    }));
    // Attachment handlers
    electron_1.ipcMain.handle('attachment:create', (event, attachmentData) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.createAttachment(attachmentData);
    }));
    electron_1.ipcMain.handle('attachment:getAll', () => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.getAllAttachments();
    }));
    electron_1.ipcMain.handle('attachment:getById', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.getAttachmentById(id);
    }));
    electron_1.ipcMain.handle('attachment:getByJob', (event, jobId) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.getAttachmentsByJob(jobId);
    }));
    electron_1.ipcMain.handle('attachment:delete', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.deleteAttachment(id);
    }));
    electron_1.ipcMain.handle('attachment:saveFile', (event, fileName, fileBuffer, subPath, jobId, paymentId) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.saveFile(fileName, fileBuffer, subPath, jobId, paymentId);
    }));
    electron_1.ipcMain.handle('attachment:getContent', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield attachmentService.getFileContent(id);
    }));
    // Payment handlers
    electron_1.ipcMain.handle('payment:create', (event, paymentData) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.createPayment(paymentData);
    }));
    electron_1.ipcMain.handle('payment:getAll', () => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.getAllPayments();
    }));
    electron_1.ipcMain.handle('payment:getById', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.getPaymentById(id);
    }));
    electron_1.ipcMain.handle('payment:getByJob', (event, jobId) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.getPaymentsByJob(jobId);
    }));
    electron_1.ipcMain.handle('payment:getByDateRange', (event, startDate, endDate) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.getPaymentsByDateRange(new Date(startDate), new Date(endDate));
    }));
    electron_1.ipcMain.handle('payment:update', (event, id, updateData) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.updatePayment(id, updateData);
    }));
    electron_1.ipcMain.handle('payment:delete', (event, id) => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.deletePayment(id);
    }));
    electron_1.ipcMain.handle('payment:getStats', () => __awaiter(this, void 0, void 0, function* () {
        return yield paymentService.getPaymentStats();
    }));
    // Config handlers
    electron_1.ipcMain.handle('config:get', (event, key) => __awaiter(this, void 0, void 0, function* () {
        return yield configService.getConfig(key);
    }));
    electron_1.ipcMain.handle('config:set', (event, key, value) => __awaiter(this, void 0, void 0, function* () {
        return yield configService.setConfig(key, value);
    }));
    electron_1.ipcMain.handle('config:getAll', () => __awaiter(this, void 0, void 0, function* () {
        return yield configService.getAllConfigs();
    }));
    electron_1.ipcMain.handle('config:delete', (event, key) => __awaiter(this, void 0, void 0, function* () {
        return yield configService.deleteConfig(key);
    }));
    // App handlers
    electron_1.ipcMain.handle('app:getVersion', () => __awaiter(this, void 0, void 0, function* () {
        const { app } = require('electron');
        return app.getVersion();
    }));
    electron_1.ipcMain.handle('app:getPlatform', () => __awaiter(this, void 0, void 0, function* () {
        return process.platform;
    }));
}
//# sourceMappingURL=ipc-handlers.js.map