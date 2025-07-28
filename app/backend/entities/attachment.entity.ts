import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Job } from "./job.entity";
import { Payment } from "./payment.entity";

@Entity('attachments')
export class Attachment extends BaseEntity {
    @Column()
    file_name!: string;

    @Column()
    file_extension!: string;

    @Column()
    file_path!: string;

    @ManyToOne(() => Job, job => job.attachments, { nullable: true })
    @JoinColumn({ name: 'job_id' })
    job?: Job;

    @ManyToOne(() => Payment, payment => payment.attachments, { nullable: true })
    @JoinColumn({ name: 'payment_id' })
    payment?: Payment;
}