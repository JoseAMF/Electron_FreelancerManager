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
const moment = require('moment');
class JobService {
    constructor(dbService) {
        this.dbService = dbService;
        this.jobRepository = this.dbService.getDataSource().getRepository(job_entity_1.Job);
    }
    // Utility function to convert Date to DD/MM/YYYY string using Moment.js
    dateToString(date) {
        if (typeof date === 'string') {
            // If it's already a string, validate and return it
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (dateRegex.test(date)) {
                return date;
            }
            // If it's an ISO string or other format, parse it with moment
            return moment(date).format('DD/MM/YYYY');
        }
        return moment(date).format('DD/MM/YYYY');
    }
    // Utility function to convert DD/MM/YYYY string to Date for comparisons using Moment.js
    stringToDate(dateString) {
        return moment(dateString, 'DD/MM/YYYY').toDate();
    }
    // Utility function to check if a date string matches a specific day using Moment.js
    isSameDay(dateString, targetDate) {
        const dateFromString = moment(dateString, 'DD/MM/YYYY');
        const targetMoment = moment(targetDate);
        return dateFromString.isSame(targetMoment, 'day');
    }
    // Utility function to check if a date string is within a date range using Moment.js
    isJobDateInRange(dateString, startDate, endDate) {
        const dateFromString = moment(dateString, 'DD/MM/YYYY');
        const startMoment = moment(startDate).startOf('day');
        const endMoment = moment(endDate).endOf('day');
        return dateFromString.isBetween(startMoment, endMoment, 'day', '[]');
    }
    createJob(jobData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Convert dates to DD/MM/YYYY string format
            const processedJobData = Object.assign({}, jobData);
            if (processedJobData.start_date) {
                processedJobData.start_date = this.dateToString(processedJobData.start_date);
            }
            if (processedJobData.due_date) {
                processedJobData.due_date = this.dateToString(processedJobData.due_date);
            }
            if (processedJobData.completed_date) {
                processedJobData.completed_date = this.dateToString(processedJobData.completed_date);
            }
            const job = this.jobRepository.create(Object.assign(Object.assign({}, processedJobData), { status: jobData.status || status_enum_1.Status.PENDING }));
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
    getJobsByDateRange(startDate, endDate, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryBuilder = this.jobRepository
                .createQueryBuilder('job')
                .leftJoinAndSelect('job.client', 'client');
            // Convert dates to DD/MM/YYYY strings for database comparison
            const startDateString = this.dateToString(startDate);
            const endDateString = endDate ? this.dateToString(endDate) : startDateString;
            // Build date filtering based on job status and date range logic
            if (endDate) {
                // Range filtering - complex logic based on status
                if (status) {
                    // Filter for specific status
                    if (status === status_enum_1.Status.COMPLETED) {
                        queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :endDate AND job.completed_date >= :startDate`, {
                            status,
                            startDate: startDateString,
                            endDate: endDateString
                        });
                    }
                    else if (status === status_enum_1.Status.PENDING) {
                        queryBuilder.andWhere(`job.status = :status AND job.due_date >= :startDate AND job.due_date <= :endDate`, {
                            status,
                            startDate: startDateString,
                            endDate: endDateString
                        });
                    }
                    else if (status === status_enum_1.Status.IN_PROGRESS) {
                        queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL 
           AND job.start_date <= :endDate AND (job.completed_date IS NULL OR job.completed_date >= :startDate)`, {
                            status,
                            startDate: startDateString,
                            endDate: endDateString
                        });
                    }
                }
                else {
                    // All statuses
                    queryBuilder.andWhere(`(
          (job.status = '${status_enum_1.Status.COMPLETED}' AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :endDate AND job.completed_date >= :startDate) OR
          (job.status = '${status_enum_1.Status.PENDING}' AND job.due_date >= :startDate AND job.due_date <= :endDate) OR
          (job.status = '${status_enum_1.Status.IN_PROGRESS}' AND job.start_date IS NOT NULL 
           AND job.start_date <= :endDate AND (job.completed_date IS NULL OR job.completed_date >= :startDate))
        )`, {
                        startDate: startDateString,
                        endDate: endDateString
                    });
                }
            }
            else {
                // Exact date matching - different field based on status
                if (status) {
                    // Filter for specific status
                    if (status === status_enum_1.Status.COMPLETED) {
                        queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :exactDate AND job.completed_date >= :exactDate`, {
                            status,
                            exactDate: startDateString
                        });
                    }
                    else if (status === status_enum_1.Status.PENDING) {
                        queryBuilder.andWhere(`job.status = :status AND job.due_date = :exactDate`, {
                            status,
                            exactDate: startDateString
                        });
                    }
                    else if (status === status_enum_1.Status.IN_PROGRESS) {
                        queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL 
           AND job.start_date <= :exactDate AND (job.completed_date IS NULL OR job.completed_date >= :exactDate)`, {
                            status,
                            exactDate: startDateString
                        });
                    }
                }
                else {
                    // All statuses
                    queryBuilder.andWhere(`(
          (job.status = '${status_enum_1.Status.COMPLETED}' AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :exactDate AND job.completed_date >= :exactDate) OR
          (job.status = '${status_enum_1.Status.PENDING}' AND job.due_date = :exactDate) OR
          (job.status = '${status_enum_1.Status.IN_PROGRESS}' AND job.start_date IS NOT NULL 
           AND job.start_date <= :exactDate AND (job.completed_date IS NULL OR job.completed_date >= :exactDate))
        )`, {
                        exactDate: startDateString
                    });
                }
            }
            return yield queryBuilder
                .orderBy('job.due_date', 'ASC')
                .getMany();
        });
    }
    updateJob(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Convert dates to DD/MM/YYYY string format
                const processedData = Object.assign({}, updateData);
                if (processedData.start_date) {
                    processedData.start_date = this.dateToString(processedData.start_date);
                }
                if (processedData.due_date) {
                    processedData.due_date = this.dateToString(processedData.due_date);
                }
                if (processedData.completed_date) {
                    processedData.completed_date = this.dateToString(processedData.completed_date);
                }
                const result = yield this.jobRepository
                    .createQueryBuilder()
                    .update(job_entity_1.Job)
                    .set({
                    title: processedData.title,
                    description: processedData.description,
                    status: processedData.status,
                    price: processedData.price,
                    client: processedData.client,
                    due_date: processedData.due_date,
                    start_date: processedData.start_date,
                    completed_date: processedData.completed_date
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