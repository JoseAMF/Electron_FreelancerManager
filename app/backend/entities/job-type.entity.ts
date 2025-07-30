import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Job } from "./job.entity";

@Entity('job_types')
export class JobType extends BaseEntity {
    @Column()
    name!: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    base_price!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
    base_hours!: number;

    @Column({ length: 7, default: '#3B82F6' }) // Default blue color
    color_hex!: string;

    @OneToMany(() => Job, job => job.job_type)
    jobs?: Job[];
}
