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
exports.ConfigService = void 0;
const config_entity_1 = require("../entities/config.entity");
class ConfigService {
    constructor(dbService) {
        this.dbService = dbService;
        this.configRepository = this.dbService.getDataSource().getRepository(config_entity_1.Config);
        this.initializeDefaultConfig();
    }
    initializeDefaultConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultConfigs = [
                { key: 'attachmentsPath', value: './attachments' },
                { key: 'currency', value: 'USD' },
                { key: 'taxRate', value: '0.00' },
                { key: 'companyName', value: 'Your Company' },
                { key: 'companyEmail', value: 'contact@yourcompany.com' }
            ];
            for (const config of defaultConfigs) {
                const existing = yield this.getConfig(config.key);
                if (!existing) {
                    yield this.setConfig(config.key, config.value);
                }
            }
        });
    }
    getConfig(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.configRepository.findOne({ where: { key } });
            return (config === null || config === void 0 ? void 0 : config.value) || null;
        });
    }
    setConfig(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = yield this.configRepository.findOne({ where: { key } });
            if (config) {
                config.value = value;
            }
            else {
                config = this.configRepository.create({ key, value });
            }
            return yield this.configRepository.save(config);
        });
    }
    getAllConfigs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.configRepository.find();
        });
    }
    deleteConfig(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.configRepository.delete({ key });
            return result.affected != undefined && result.affected > 0;
        });
    }
    getConfigAsNumber(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, defaultValue = 0) {
            const value = yield this.getConfig(key);
            return value ? parseFloat(value) : defaultValue;
        });
    }
    getConfigAsBoolean(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, defaultValue = false) {
            const value = yield this.getConfig(key);
            return value ? value.toLowerCase() === 'true' : defaultValue;
        });
    }
    // Specific config getters
    getAttachmentsPath() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getConfig('attachmentsPath')) || './attachments';
        });
    }
    getCurrency() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getConfig('currency')) || 'USD';
        });
    }
    getTaxRate() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getConfigAsNumber('taxRate', 0);
        });
    }
    getCompanyName() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getConfig('companyName')) || 'Your Company';
        });
    }
    getCompanyEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getConfig('companyEmail')) || 'contact@yourcompany.com';
        });
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map