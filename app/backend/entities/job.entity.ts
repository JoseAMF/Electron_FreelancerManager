import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Client } from "./client.entity";
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

    @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
    price?: number;

    @Column({
        type: 'varchar',
        enum: Status,
        default: Status.PENDING
    })
    status!: Status;

    @Column({ nullable: true })
    due_date?: Date;

    @Column({ nullable: true })
    start_date?: Date;

    @OneToMany(() => Payment, payment => payment.job)
    payments?: Payment[];

    @OneToMany(() => Attachment, attachment => attachment.job)
    attachments?: Attachment[];
}