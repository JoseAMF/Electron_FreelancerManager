import { Repository } from 'typeorm';
import { JobType } from '../entities/job-type.entity';
import { OrmDatabaseService } from '../database/orm-database.service';

export class JobTypeService {
    private jobTypeRepository: Repository<JobType>;

    constructor(private databaseService: OrmDatabaseService) {
        this.jobTypeRepository = this.databaseService.getJobTypeRepository();
    }

    async createJobType(jobTypeData: Partial<JobType>): Promise<JobType> {
        try {
            const jobType = this.jobTypeRepository.create(jobTypeData);
            return await this.jobTypeRepository.save(jobType);
        } catch (error: any) {
            console.error('Error creating job type:', error);
            throw new Error(`Failed to create job type: ${error.message}`);
        }
    }

    async getAllJobTypes(): Promise<JobType[]> {
        try {
            return await this.jobTypeRepository.find({
                order: { name: 'ASC' }
            });
        } catch (error: any) {
            console.error('Error fetching job types:', error);
            throw new Error(`Failed to fetch job types: ${error.message}`);
        }
    }

    async getJobTypeById(id: number): Promise<JobType | null> {
        try {
            return await this.jobTypeRepository.findOne({
                where: { id },
                relations: ['jobs']
            });
        } catch (error: any) {
            console.error('Error fetching job type:', error);
            throw new Error(`Failed to fetch job type: ${error.message}`);
        }
    }

    async updateJobType(id: number, updateData: Partial<JobType>): Promise<JobType | null> {
        try {
            await this.jobTypeRepository.update(id, updateData);
            return await this.getJobTypeById(id);
        } catch (error: any) {
            console.error('Error updating job type:', error);
            throw new Error(`Failed to update job type: ${error.message}`);
        }
    }

    async deleteJobType(id: number): Promise<boolean> {
        try {
            // Check if job type is being used by any jobs
            const jobType = await this.jobTypeRepository.findOne({
                where: { id },
                relations: ['jobs']
            });

            if (jobType && jobType.jobs && jobType.jobs.length > 0) {
                throw new Error('Cannot delete job type that is being used by existing jobs');
            }

            const result = await this.jobTypeRepository.delete(id);
            return result.affected! > 0;
        } catch (error: any) {
            console.error('Error deleting job type:', error);
            throw new Error(`Failed to delete job type: ${error.message}`);
        }
    }

    async searchJobTypes(searchTerm: string): Promise<JobType[]> {
        try {
            return await this.jobTypeRepository
                .createQueryBuilder('jobType')
                .where('jobType.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
                .orWhere('jobType.description LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
                .orderBy('jobType.name', 'ASC')
                .getMany();
        } catch (error: any) {
            console.error('Error searching job types:', error);
            throw new Error(`Failed to search job types: ${error.message}`);
        }
    }
}
