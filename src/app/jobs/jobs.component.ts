import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Job, Client, Attachment } from '../../../app/backend/entities';
import { PanelModule } from 'primeng/panel';
import { JobService, ClientService, AttachmentService } from '../core/services';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DialogService } from '../core/dialog.service';

@Component({
  selector: 'app-jobs',
  imports: [TableModule, CommonModule, TagModule, DecimalPipe, ButtonModule, PanelModule, ConfirmDialog, ToastModule, DatePipe], 
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class JobsComponent implements OnInit {

  //#region Properties
  jobs: Job[] = [];
  clients: Client[] = [];
  //#endregion

  //#region Constructor & Lifecycle
  constructor(
    private jobService: JobService,
    private clientService: ClientService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    this.listJobs();
    this.loadClients();
  }
  //#endregion

  //#region Data Loading
  listJobs() {
    this.jobs = [];
    this.jobService.getAllJobs().then(jobs => {
      this.jobs = jobs;
    });
  }

  loadClients() {
    this.clientService.getAllClients().then(clients => {
      this.clients = clients;
    });
  }
  //#endregion

  //#region Job CRUD Operations
  async addJob() {
    try {
      const result = await this.dialogService.openJobDialog({
        isEdit: false
      });
      
      if (result.success) {
        this.listJobs();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Job created successfully' 
        });
      }
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to create job' 
      });
    }
  }

  async editJob(job: Job) {
    try {
      const result = await this.dialogService.openJobDialog({
        job: job,
        isEdit: true
      });
      
      if (result.success) {
        this.listJobs();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Job updated successfully' 
        });
      }
    } catch (error) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to update job' 
      });
    }
  }

  deleteJob(event: Event, job: Job) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Do you want to delete this record?',
      header: 'Delete Job',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.jobService.deleteJob(job.id!).then(() => {
          this.jobs = this.jobs.filter(j => j.id !== job.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Job deleted successfully' 
          });
        }).catch(error => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to delete job' 
          });
        });
      },
    });
  }
  //#endregion

  //#region UI Helper Methods
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'cancelled': return 'danger';
      default: return 'warn';
    }
  }

  getClientName(clientId: number): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  }
  //#endregion
}