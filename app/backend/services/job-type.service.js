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
exports.JobTypeService = void 0;
class JobTypeService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.jobTypeRepository = this.databaseService.getJobTypeRepository();
    }
    createJobType(jobTypeData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jobType = this.jobTypeRepository.create(jobTypeData);
                return yield this.jobTypeRepository.save(jobType);
            }
            catch (error) {
                console.error('Error creating job type:', error);
                throw new Error(`Failed to create job type: ${error.message}`);
            }
        });
    }
    getAllJobTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.jobTypeRepository.find({
                    order: { name: 'ASC' }
                });
            }
            catch (error) {
                console.error('Error fetching job types:', error);
                throw new Error(`Failed to fetch job types: ${error.message}`);
            }
        });
    }
    getJobTypeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.jobTypeRepository.findOne({
                    where: { id },
                    relations: ['jobs']
                });
            }
            catch (error) {
                console.error('Error fetching job type:', error);
                throw new Error(`Failed to fetch job type: ${error.message}`);
            }
        });
    }
    updateJobType(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.jobTypeRepository.update(id, updateData);
                return yield this.getJobTypeById(id);
            }
            catch (error) {
                console.error('Error updating job type:', error);
                throw new Error(`Failed to update job type: ${error.message}`);
            }
        });
    }
    deleteJobType(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if job type is being used by any jobs
                const jobType = yield this.jobTypeRepository.findOne({
                    where: { id },
                    relations: ['jobs']
                });
                if (jobType && jobType.jobs && jobType.jobs.length > 0) {
                    throw new Error('Cannot delete job type that is being used by existing jobs');
                }
                const result = yield this.jobTypeRepository.delete(id);
                return result.affected > 0;
            }
            catch (error) {
                console.error('Error deleting job type:', error);
                throw new Error(`Failed to delete job type: ${error.message}`);
            }
        });
    }
    searchJobTypes(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.jobTypeRepository
                    .createQueryBuilder('jobType')
                    .where('jobType.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
                    .orWhere('jobType.description LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
                    .orderBy('jobType.name', 'ASC')
                    .getMany();
            }
            catch (error) {
                console.error('Error searching job types:', error);
                throw new Error(`Failed to search job types: ${error.message}`);
            }
        });
    }
}
exports.JobTypeService = JobTypeService;
//# sourceMappingURL=job-type.service.js.map