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
exports.OrmDatabaseService = void 0;
const typeorm_1 = require("typeorm");
const path = require("path");
const electron_1 = require("electron");
const client_entity_1 = require("../entities/client.entity");
const job_entity_1 = require("../entities/job.entity");
const attachment_entity_1 = require("../entities/attachment.entity");
const payment_entity_1 = require("../entities/payment.entity");
const config_entity_1 = require("../entities/config.entity");
class OrmDatabaseService {
    constructor() {
        this.dataSource = null;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userDataPath = electron_1.app.getPath('userData');
                const dbPath = path.join(userDataPath, 'app-database.db');
                this.dataSource = new typeorm_1.DataSource({
                    type: 'sqlite',
                    database: dbPath,
                    entities: [client_entity_1.Client, job_entity_1.Job, attachment_entity_1.Attachment, payment_entity_1.Payment, config_entity_1.Config],
                    synchronize: true, // Auto-create tables in development
                    logging: false
                });
                yield this.dataSource.initialize();
                console.log('ORM Database initialized successfully at:', dbPath);
            }
            catch (error) {
                console.error('Failed to initialize ORM database:', error);
                throw error;
            }
        });
    }
    getDataSource() {
        if (!this.dataSource) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.dataSource;
    }
    getClientRepository() {
        return this.getDataSource().getRepository(client_entity_1.Client);
    }
    getJobRepository() {
        return this.getDataSource().getRepository(job_entity_1.Job);
    }
    getAttachmentRepository() {
        return this.getDataSource().getRepository(attachment_entity_1.Attachment);
    }
    getPaymentRepository() {
        return this.getDataSource().getRepository(payment_entity_1.Payment);
    }
    getConfigRepository() {
        return this.getDataSource().getRepository(config_entity_1.Config);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dataSource && this.dataSource.isInitialized) {
                yield this.dataSource.destroy();
                this.dataSource = null;
            }
        });
    }
}
exports.OrmDatabaseService = OrmDatabaseService;
//# sourceMappingURL=orm-database.service.js.map