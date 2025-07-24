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
exports.JobService = void 0;
const job_entity_1 = require("../entities/job.entity");
const status_enum_1 = require("../entities/status.enum");
class JobService {
    constructor(dbService) {
        this.dbService = dbService;
        this.jobRepository = this.dbService.getDataSource().getRepository(job_entity_1.Job);
    }
    createJob(jobData) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = this.jobRepository.create(Object.assign(Object.assign({}, jobData), { status: jobData.status || status_enum_1.Status.PENDING }));
            return yield this.jobRepository.save(job);
        });
    }
    getAllJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository.find({
                relations: ['client'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getJobById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository.findOne({
                where: { id },
                relations: ['client']
            });
        });
    }
    getJobsByClient(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository.find({
                where: { client: { id: clientId } },
                relations: ['client'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getJobsByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository.find({
                where: { status },
                relations: ['client'],
                order: { created_at: 'DESC' }
            });
        });
    }
    updateJob(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.jobRepository
                    .createQueryBuilder()
                    .update(job_entity_1.Job)
                    .set({
                    title: updateData.title,
                    description: updateData.description,
                    status: updateData.status,
                    price: updateData.price,
                    client: updateData.client,
                    due_date: updateData.due_date,
                    start_date: updateData.start_date,
                })
                    .where("id = :id", { id })
                    .execute();
                if (result.affected === 0) {
                    return null;
                }
                // Return the updated job
                return yield this.getJobById(id);
            }
            catch (error) {
                console.error('Error updating job:', error);
                return null;
            }
        });
    }
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.jobRepository
                    .createQueryBuilder()
                    .update(job_entity_1.Job)
                    .set({ status })
                    .where("id = :id", { id })
                    .execute();
                if (result.affected === 0) {
                    return null;
                }
                return yield this.getJobById(id);
            }
            catch (error) {
                console.error('Error updating job status:', error);
                return null;
            }
        });
    }
    deleteJob(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.jobRepository.delete(id);
            return result.affected != undefined && result.affected > 0;
        });
    }
    searchJobs(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository
                .createQueryBuilder('job')
                .leftJoinAndSelect('job.client', 'client')
                .where('job.title LIKE :search OR job.description LIKE :search OR client.name LIKE :search', {
                search: `%${searchTerm}%`
            })
                .orderBy('job.created_at', 'DESC')
                .getMany();
        });
    }
    getJobStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalJobs = yield this.jobRepository.count();
            const pendingJobs = yield this.jobRepository.count({ where: { status: status_enum_1.Status.PENDING } });
            const inProgressJobs = yield this.jobRepository.count({ where: { status: status_enum_1.Status.IN_PROGRESS } });
            const completedJobs = yield this.jobRepository.count({ where: { status: status_enum_1.Status.COMPLETED } });
            const cancelledJobs = yield this.jobRepository.count({ where: { status: status_enum_1.Status.CANCELLED } });
            return {
                total: totalJobs,
                pending: pendingJobs,
                inProgress: inProgressJobs,
                completed: completedJobs,
                cancelled: cancelledJobs
            };
        });
    }
    getJobsWithHighestPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.jobRepository
                .createQueryBuilder('job')
                .leftJoinAndSelect('job.client', 'client')
                .orderBy('job.price', 'DESC')
                .limit(10)
                .getMany();
        });
    }
}
exports.JobService = JobService;
//# sourceMappingURL=job.service.js.map