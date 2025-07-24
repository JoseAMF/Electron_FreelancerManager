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
exports.AttachmentService = void 0;
const attachment_entity_1 = require("../entities/attachment.entity");
const fs = require("fs/promises");
const path = require("path");
const electron_1 = require("electron");
const entities_1 = require("../entities");
class AttachmentService {
    constructor(dbService) {
        this.dbService = dbService;
        this.attachmentRepository = this.dbService.getDataSource().getRepository(attachment_entity_1.Attachment);
        this.configRepository = this.dbService.getDataSource().getRepository(entities_1.Config);
        this.attachmentsPath = path.join(electron_1.app.getPath('userData'), 'attachments');
        this.setAttachmentsPath();
        this.ensureAttachmentsDirectory();
    }
    ensureAttachmentsDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.access(this.attachmentsPath);
            }
            catch (_a) {
                yield fs.mkdir(this.attachmentsPath, { recursive: true });
            }
        });
    }
    setAttachmentsPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.configRepository.findOne({ where: { key: 'attachmentsPath' } });
            if (config == null || config.value)
                return;
            this.attachmentsPath = config === null || config === void 0 ? void 0 : config.value;
        });
    }
    createAttachment(attachmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const attachment = this.attachmentRepository.create(attachmentData);
            return yield this.attachmentRepository.save(attachment);
        });
    }
    getAllAttachments() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.attachmentRepository.find({
                relations: ['job'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getAttachmentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.attachmentRepository.findOne({
                where: { id },
                relations: ['job']
            });
        });
    }
    getAttachmentsByJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.attachmentRepository.find({
                where: { job: { id: jobId } },
                relations: ['job']
            });
        });
    }
    updateAttachment(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.attachmentRepository.update(id, updateData);
            return yield this.getAttachmentById(id);
        });
    }
    deleteAttachment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attachment = yield this.getAttachmentById(id);
            if (attachment) {
                // Delete physical file
                try {
                    yield fs.unlink(attachment.file_path);
                }
                catch (error) {
                    console.warn('Could not delete physical file:', error);
                }
            }
            const result = yield this.attachmentRepository.delete(id);
            return result.affected != undefined && result.affected > 0;
        });
    }
    saveFile(fileName, fileBuffer, subPath, jobId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Debug parameters to file
            const debugInfo = {
                timestamp: new Date().toISOString(),
                method: 'saveFile',
                parameters: {
                    fileName,
                    fileBufferSize: fileBuffer ? fileBuffer.byteLength : 0,
                    subPath,
                    jobId,
                    paymentId
                }
            };
            try {
                const debugPath = path.join(this.attachmentsPath, 'debug.txt');
                const debugLine = JSON.stringify(debugInfo) + '\n';
                yield fs.appendFile(debugPath, debugLine);
            }
            catch (error) {
                console.warn('Could not write debug info:', error);
            }
            const fileExtension = path.extname(fileName);
            const baseName = path.basename(fileName, fileExtension);
            const timestamp = Date.now();
            const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;
            // Determine directory path based on jobId and paymentId
            let directoryPath;
            if (paymentId && jobId) {
                // Payment files: jobs/{jobId}/payments/
                directoryPath = path.join(this.attachmentsPath, 'jobs', jobId.toString(), 'payments');
            }
            else if (jobId) {
                // Job files: jobs/{jobId}/
                directoryPath = path.join(this.attachmentsPath, 'jobs', jobId.toString());
            }
            else {
                // Fallback: general/
                directoryPath = path.join(this.attachmentsPath, 'general');
            }
            // Ensure directory exists
            yield this.ensureDirectoryExists(directoryPath);
            const filePath = path.join(directoryPath, uniqueFileName);
            // Write the file to disk
            try {
                yield fs.writeFile(filePath, Buffer.from(fileBuffer));
            }
            catch (error) {
                console.error('Error writing file:', error);
            }
            const attachmentData = {
                file_name: fileName,
                file_extension: fileExtension,
                file_path: filePath,
                job: jobId ? { id: jobId } : undefined,
                payment: paymentId ? { id: paymentId } : undefined
            };
            return yield this.createAttachment(attachmentData);
        });
    }
    ensureDirectoryExists(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.access(dirPath);
            }
            catch (_a) {
                yield fs.mkdir(dirPath, { recursive: true });
            }
        });
    }
    getFileContent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attachment = yield this.getAttachmentById(id);
            if (!attachment)
                return null;
            try {
                return yield fs.readFile(attachment.file_path);
            }
            catch (error) {
                console.error('Error reading file:', error);
                return null;
            }
        });
    }
    getAttachmentsPath() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attachmentsPath;
        });
    }
}
exports.AttachmentService = AttachmentService;
//# sourceMappingURL=attachment.service.js.map