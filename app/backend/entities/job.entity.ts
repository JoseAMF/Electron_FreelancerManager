import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Client } from "./client.entity";
import { JobType } from "./job-type.entity";
import { Status } from "./status.enum";
import { Payment } from "./payment.entity";
import { Attachment } from "./attachment.entity";

@Entity('jobs')
export class Job extends BaseEntity {
    @Column()
    title!: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @ManyToOne(() => Client, client => client.jobs, { nullable: true })
    @JoinColumn({ name: 'client_id' })
    client?: Client;

    @ManyToOne(() => JobType, jobType => jobType.jobs, { nullable: true })
    @JoinColumn({ name: 'job_type_id' })
    job_type?: JobType;

    @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
    price?: number;

    @Column({
        type: 'varchar',
        enum: Status,
        default: Status.PENDING
    })
    status!: Status;

    @Column({ nullable: true })
    due_date?: string; // Format: DD/MM/YYYY

    @Column({ nullable: true })
    completed_date?: string; // Format: DD/MM/YYYY

    @Column({ nullable: true })
    start_date?: string; // Format: DD/MM/YYYY

    @OneToMany(() => Payment, payment => payment.job)
    payments?: Payment[];

    @OneToMany(() => Attachment, attachment => attachment.job)
    attachments?: Attachment[];
}