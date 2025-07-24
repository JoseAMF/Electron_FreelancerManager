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
exports.ClientService = void 0;
const client_entity_1 = require("../entities/client.entity");
class ClientService {
    constructor(dbService) {
        this.dbService = dbService;
        this.clientRepository = this.dbService.getDataSource().getRepository(client_entity_1.Client);
    }
    createClient(clientData) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.clientRepository.create(clientData);
            return yield this.clientRepository.save(client);
        });
    }
    getAllClients() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.clientRepository.find({
                relations: ['jobs'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getClientById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.clientRepository.findOne({
                where: { id },
                relations: ['jobs']
            });
        });
    }
    getClientByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.clientRepository.findOne({
                where: { email },
                relations: ['jobs']
            });
        });
    }
    updateClient(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use raw update with only basic fields, no relations
                const result = yield this.clientRepository
                    .createQueryBuilder()
                    .update(client_entity_1.Client)
                    .set({
                    name: updateData.name,
                    email: updateData.email,
                    phone: updateData.phone,
                    discord: updateData.discord
                })
                    .where("id = :id", { id })
                    .execute();
                if (result.affected === 0) {
                    return null;
                }
                // Return the updated client
                return yield this.getClientById(id);
            }
            catch (error) {
                console.error('Error updating client:', error);
                return null;
            }
        });
    }
    deleteClient(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.clientRepository.delete(id);
            return result.affected != undefined && result.affected > 0;
        });
    }
    searchClients(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.clientRepository
                .createQueryBuilder('client')
                .where('client.name LIKE :search OR client.email LIKE :search', {
                search: `%${searchTerm}%`
            })
                .leftJoinAndSelect('client.jobs', 'jobs')
                .orderBy('client.created_at', 'DESC')
                .getMany();
        });
    }
    getClientsWithJobCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const { entities } = yield this.clientRepository
                .createQueryBuilder('client')
                .leftJoin('client.jobs', 'job')
                .select([
                'client.id',
                'client.name',
                'client.email',
                'client.phone',
                'client.discord',
                'client.created_at'
            ])
                .addSelect('COUNT(job.id)', 'jobCount')
                .groupBy('client.id')
                .getRawAndEntities();
            return entities;
        });
    }
}
exports.ClientService = ClientService;
//# sourceMappingURL=client.service.js.map