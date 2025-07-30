import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

// Services
import { JobTypeService } from '../core/services/job-type/job-type.service';
import { DialogService } from '../core/dialog.service';
import { ConfirmationService, MessageService } from 'primeng/api';

// Types
import { JobType } from '../shared/types/entities';

@Component({
  selector: 'app-job-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './job-types.component.html',
  styleUrls: ['./job-types.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class JobTypesComponent implements OnInit {
  jobTypes: JobType[] = [];
  loading = false;

  constructor(
    private jobTypeService: JobTypeService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadJobTypes();
  }

  async loadJobTypes() {
    try {
      this.loading = true;
      this.jobTypes = await this.jobTypeService.getAllJobTypes();
    } catch (error: any) {
      console.error('Error loading job types:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load job types'
      });
    } finally {
      this.loading = false;
    }
  }

  addJobType() {
    this.dialogService.openJobTypeDialog({
      jobType: null,
      isEdit: false
    }).then(async (result: any) => {
      if (result && result.success) {
        await this.loadJobTypes();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Job type added successfully'
        });
      }
    });
  }

  editJobType(jobType: JobType) {
    this.dialogService.openJobTypeDialog({
      jobType,
      isEdit: true
    }).then(async (result: any) => {
      if (result && result.success) {
        await this.loadJobTypes();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Job type updated successfully'
        });
      }
    });
  }

  deleteJobType(event: Event, jobType: JobType) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete "${jobType.name}"? This action cannot be undone.`,
      header: 'Delete Job Type',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: async () => {
        try {
          await this.jobTypeService.deleteJobType(jobType.id);
          await this.loadJobTypes();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Job type deleted successfully'
          });
        } catch (error: any) {
          console.error('Error deleting job type:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete job type'
          });
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatHours(value: number): string {
    return `${value} ${value === 1 ? 'hour' : 'hours'}`;
  }
}
