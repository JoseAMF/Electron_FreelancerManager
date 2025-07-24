import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FileItem, FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { Client, Attachment } from '../../../../app/backend/entities';
import { DialogState, DialogService } from '../dialog.service';
import { ClientService, JobService, AttachmentService } from '../services';



@Component({
  selector: 'app-global-dialogs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    IftaLabelModule,
    FloatLabelModule,
    AutoCompleteModule,
    DropdownModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    ConfirmDialog,
    ToastModule,
    FileUploaderComponent,
    DatePipe
  ],
  templateUrl: './global-dialog.component.html',
  styleUrls: ['./global-dialog.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class GlobalDialogsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  dialogState: DialogState = {
    type: null,
    visible: false,
    config: { title: '' },
    data: null
  };

  // Forms
  clientForm: FormGroup;
  jobForm: FormGroup;

  // Data
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedFiles: FileItem[] = [];
  currentJobAttachments: Attachment[] = [];

  // Options
  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private clientService: ClientService,
    private jobService: JobService,
    private attachmentService: AttachmentService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.clientForm = this.createClientForm();
    this.jobForm = this.createJobForm();
  }

  ngOnInit() {
    this.dialogService.dialogState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (state) => {
        this.dialogState = state;
        
        if (state.visible) {
          await this.initializeDialog(state);
        }
        
        this.cdr.detectChanges();
      });

    this.loadClients();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeDialog(state: DialogState) {
    if (state.type === 'client') {
      this.initializeClientDialog();
    } else if (state.type === 'job') {
      await this.initializeJobDialog();
    }
  }

  private initializeClientDialog() {
    const clientData = this.dialogState.data;
    if (clientData?.client) {
      // Edit mode
      this.clientForm.patchValue({
        name: clientData.client.name,
        email: clientData.client.email,
        phone: clientData.client.phone || '',
        discord: clientData.client.discord || ''
      });
    } else {
      // Add mode
      this.clientForm.reset();
    }
  }

  private async initializeJobDialog() {
    const jobData = this.dialogState.data;
    if (jobData?.job) {
      // Edit mode
      this.jobForm.patchValue({
        title: jobData.job.title,
        description: jobData.job.description || '',
        status: jobData.job.status,
        price: jobData.job.price,
        client: jobData.job.client,
        due_date: new Date(jobData.job.due_date!)
      });
      await this.loadJobAttachments(jobData.job.id!);
    } else {
      // Add mode
      this.jobForm.reset({ status: 'pending', price: 0 });
      this.selectedFiles = [];
      this.currentJobAttachments = [];
    }
  }

  // Form Creation
  private createClientForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      discord: ['']
    });
  }

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

  // Data Loading
  private async loadClients() {
    try {
      this.clients = await this.clientService.getAllClients();
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  private async loadJobAttachments(jobId: number): Promise<void> {
    try {
      const attachments = await this.attachmentService.getAttachmentsByJob(jobId);
      this.currentJobAttachments = attachments;
    } catch (error) {
      console.error('Error loading job attachments:', error);
      this.currentJobAttachments = [];
    }
  }

  // Client Actions
  saveClient(event: Event) {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const isEdit = this.dialogState.data?.client;
    
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure that you want to ${isEdit ? 'edit' : 'add'} this client?`,
      header: `${isEdit ? 'Edit' : 'Add'} Client`,
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
      accept: async () => {
        try {
          const formData = this.clientForm.value;
          let result;

          if (isEdit) {
            result = await this.clientService.updateClient(this.dialogState.data.client.id, formData);
          } else {
            result = await this.clientService.createClient(formData);
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Client ${isEdit ? 'updated' : 'created'} successfully`
          });

          this.dialogService.closeDialog({ success: true, data: result });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to ${isEdit ? 'update' : 'create'} client`
          });
        }
      }
    });
  }

  // Job Actions
  saveJob(event: Event) {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched(this.jobForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const isEdit = this.dialogState.data?.job;
    
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure that you want to ${isEdit ? 'edit' : 'add'} this job?`,
      header: `${isEdit ? 'Edit' : 'Add'} Job`,
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
      accept: async () => {
        try {
          let formData = this.jobForm.value;
          formData.client_id = formData.client?.id;
          let result;

          if (isEdit) {
            result = await this.jobService.updateJob(this.dialogState.data.job.id, formData);
            if (this.selectedFiles.length > 0) {
              await this.uploadFiles(this.dialogState.data.job.id, this.selectedFiles);
            }
          } else {
            result = await this.jobService.createJob(formData);
            if (this.selectedFiles.length > 0) {
              await this.uploadFiles(result.id!, this.selectedFiles);
            }
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Job ${isEdit ? 'updated' : 'created'} successfully`
          });

          this.dialogService.closeDialog({ success: true, data: result });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to ${isEdit ? 'update' : 'create'} job`
          });
        }
      }
    });
  }

  // Helper Methods
  cancelDialog() {
    this.dialogService.closeDialog({ success: false, cancelled: true });
  }

  searchClients(event: any) {
    const query = event.query.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }

  onFilesChanged(files: FileItem[]) {
    this.selectedFiles = files;
  }

  private async uploadFiles(jobId: number, files: FileItem[]): Promise<void> {
    if (files.length === 0) return;
    try {
      for (const fileItem of files) {
        if (fileItem.file && !fileItem.isUploaded) {
          const arrayBuffer = await this.fileToBuffer(fileItem.file);
          await this.attachmentService.saveFile(fileItem.file.name, arrayBuffer, '', jobId, undefined);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Validation Methods
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirst(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${this.capitalizeFirst(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid phone number';
      if (field.errors['min']) return `${this.capitalizeFirst(fieldName)} must be greater than or equal to ${field.errors['min'].min}`;
    }
    return '';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
  }
}
