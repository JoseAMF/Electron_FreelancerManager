import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Job, Client, Attachment } from '../../../app/backend/entities';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { JobService, ClientService, AttachmentService } from '../core/services';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule  } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { FileUploadEvent, FileUploadModule } from 'primeng/fileupload';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploaderComponent, FileItem } from '../shared/components/file-uploader/file-uploader.component';

@Component({
  selector: 'app-jobs',
  imports: [TableModule, FileUploadModule, DropdownModule, CommonModule, TagModule, DecimalPipe, ButtonModule, PanelModule, DialogModule, InputTextModule, ReactiveFormsModule, ConfirmDialog, InputGroupModule, InputGroupAddonModule, ToastModule, IftaLabelModule, DatePipe, AutoCompleteModule, TextareaModule, InputNumberModule, DatePickerModule, FileUploaderComponent ], 
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class JobsComponent implements OnInit {

  //#region Properties
  jobs: Job[] = [];
  clients: Client[] = [];
  filteredClients: Client[] = [];
  jobForm: FormGroup;
  displayJobDialog: boolean = false;
  isAdd: boolean = true;
  currentJobId?: number;

  uploadedFiles: File[] = [];
  selectedFiles: FileItem[] = [];
  currentJobAttachments: Attachment[] = [];

  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];
  //#endregion

  //#region Constructor & Lifecycle
  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private clientService: ClientService,
    private attachmentService: AttachmentService,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService
  ) {
    this.jobForm = this.createJobForm();
  }
  
  ngOnInit(): void {
    this.listJobs();
    this.loadClients();
  }
  //#endregion

  //#region Form Management
  private createJobForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['pending', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      client: [null, [Validators.required]],
      due_date: [null, [Validators.required]]
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      control?.markAsTouched();
    });
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

  searchClients(event: any) {
    const query = event.query.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }
  //#endregion

  //#region Job CRUD Operations
  addJob() {
    this.isAdd = true;
    this.currentJobId = undefined;
    this.jobForm.reset({ status: 'pending', price: 0 });  
    this.displayJobDialog = true;
  }

  editJob(job: Job) {
    this.isAdd = false;
    this.currentJobId = job.id;
    this.jobForm.patchValue({
      title: job.title,
      description: job.description || '',
      status: job.status,
      price: job.price,
      client: job.client,
      due_date: new Date(job.due_date!)
    });
    this.loadJobAttachments(job.id!);
    this.displayJobDialog = true;
  }

  cancelAddJob() {
    this.displayJobDialog = false;
    this.jobForm.reset();
    this.selectedFiles = [];
    this.currentJobAttachments = [];
  }

  saveNewJob($event: Event) {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched();
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Validation Error', 
        detail: 'Please fill in all required fields correctly' 
      });
      return;
    }

    this.confirmationService.confirm({
      target: $event!.target as EventTarget,
      message: `Are you sure that you want to ${this.isAdd ? 'add' : 'edit'} this job?`,
      header: `${this.isAdd ? 'Add' : 'Edit'} Job`,
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'danger',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Save',
        severity: 'success',
      },
      accept: () => {
        this.saveJob();
      },
    });
  }

  private saveJob() {
    let formData = this.jobForm.value;
    // Set client_id from the selected client object
    formData.client_id = formData.client?.id;
    
    if (this.isAdd) {
      this.jobService.createJob(formData).then(async (createdJob) => {
        // Upload files if any are selected
        if (this.selectedFiles.length > 0) {
          await this.uploadFiles(createdJob.id!, this.selectedFiles);
        }
        this.listJobs();
        this.displayJobDialog = false;
        this.jobForm.reset();
        this.selectedFiles = [];
        this.currentJobAttachments = [];
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Job created successfully' 
        });
      }).catch(error => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to create job' 
        });
      });
    } else {
      this.jobService.updateJob(this.currentJobId!, formData).then(async () => {
        // Upload files if any are selected
        if (this.selectedFiles.length > 0) {
          await this.uploadFiles(this.currentJobId!, this.selectedFiles);
        }
        this.listJobs();
        this.displayJobDialog = false;
        this.jobForm.reset();
        this.selectedFiles = [];
        this.currentJobAttachments = [];
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Job updated successfully' 
        });
      }).catch(error => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update job' 
        });
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

  //#region File Management
  onFilesChanged(files: FileItem[]) {
    this.selectedFiles = files;
  }

  private async loadJobAttachments(jobId: number): Promise<void> {
    try {
      const attachments = await this.attachmentService.getAttachmentsByJob(jobId);
      this.currentJobAttachments = attachments;
    } catch (error) {
      console.error('Error loading job attachments:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to load job attachments' 
      });
      this.currentJobAttachments = [];
    }
  }

  private async uploadFiles(jobId: number, files: FileItem[]): Promise<void> {
    if (files.length === 0) return;
    try {
      for (const fileItem of files) {
        if (fileItem.file && !fileItem.isUploaded) {
          const arrayBuffer = await this.fileToBuffer(fileItem.file);
          const result = await this.attachmentService.saveFile(fileItem.file.name, arrayBuffer, '', jobId, undefined);
        }
      }
      
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: 'Files uploaded successfully' 
      });
    } catch (error) {
      console.error('Upload error:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to upload files' 
      });
    }
  }

  private fileToBuffer(file: File): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Buffer.from(reader.result));
        } else {
          reject(new Error('File read result is not an ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  //#endregion

  //#region UI Helper Methods
  getDialogTitle(): string {
    return this.isAdd ? 'Add Job' : 'Edit Job';
  }

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

  //#region Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirst(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.capitalizeFirst(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.capitalizeFirst(fieldName)} must be greater than or equal to ${field.errors['min'].min}`;
    }
    return '';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
  }
  //#endregion
}