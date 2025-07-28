import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Job } from "./job.entity";
import { Attachment } from "./attachment.entity";

@Entity('payments')
export class Payment extends BaseEntity {
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @OneToMany(() => Attachment, attachment => attachment.payment)
    attachments?: Attachment[];

    @Column({ nullable: true })
    payment_date?: string; // Format: DD/MM/YYYY

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @ManyToOne(() => Job, job => job.payments, { nullable: true })
    @JoinColumn({ name: 'job_id' })
    job?: Job;
}