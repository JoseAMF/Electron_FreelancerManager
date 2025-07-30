import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FileItem, FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { Client, Attachment, Payment } from '../../../../app/backend/entities';
import { JobType } from '../../shared/types/entities';
import { DialogState, DialogService, PomodoroSession } from '../dialog.service';
import { ClientService, JobService, JobTypeService, AttachmentService, PomodoroService, PaymentService } from '../services';
import { PomodoroConfig } from '../services/pomodoro.service';
import { DateUtils } from '../utils';



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
    ColorPickerModule,
    FileUploaderComponent,
    AccordionModule,
    CheckboxModule,
    BadgeModule
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
  jobTypeForm: FormGroup;
  pomodoroConfigForm: FormGroup;
  paymentForm: FormGroup;

  // Pomodoro data
  currentSession!: PomodoroSession;
  currentConfig!: PomodoroConfig;
  circumference = 2 * Math.PI * 45; // radius = 45

  // Data
  clients: Client[] = [];
  jobTypes: JobType[] = [];
  filteredClients: Client[] = [];
  selectedFiles: FileItem[] = [];
  selectedPaymentFiles: FileItem[] = [];
  currentJobAttachments: Attachment[] = [];
  currentJobPayments: Payment[] = [];
  currentPaymentAttachments: Attachment[] = [];
  editingPaymentIndex: number = -1;
  showAddPaymentForm = false;

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
    private jobTypeService: JobTypeService,
    private attachmentService: AttachmentService,
    private paymentService: PaymentService,
    private pomodoroService: PomodoroService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.clientForm = this.createClientForm();
    this.jobForm = this.createJobForm();
    this.jobTypeForm = this.createJobTypeForm();
    this.pomodoroConfigForm = this.createPomodoroConfigForm();
    this.paymentForm = this.createPaymentForm();
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

    // Subscribe to Pomodoro service state
    this.pomodoroService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.currentSession = session;
        this.cdr.detectChanges();
      });

    this.pomodoroService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.currentConfig = config;
        this.updatePomodoroConfigForm(config);
        this.cdr.detectChanges();
      });

    this.loadClients();
    this.loadJobTypes();
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
    } else if (state.type === 'jobType') {
      await this.initializeJobTypeDialog();
    } else if (state.type === 'pomodoro') {
      this.initializePomodoroDialog();
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
        job_type: jobData.job.job_type,
        due_date: DateUtils.parseStringToDate(jobData.job.due_date!)
      });
      await this.loadJobAttachments(jobData.job.id!);
      await this.loadJobPayments(jobData.job.id!);
    } else {
      // Add mode
      this.jobForm.reset({ status: 'pending', price: 0 });
      this.selectedFiles = [];
      this.currentJobAttachments = [];
      this.currentJobPayments = [];
    }
    // Reset payment form
    this.resetPaymentForm();
  }

  private initializePomodoroDialog() {
    // Initialize current session and config from service
    this.currentSession = this.pomodoroService.getSession();
    this.currentConfig = this.pomodoroService.getConfig();
    this.updatePomodoroConfigForm(this.currentConfig);
  }

  private async initializeJobTypeDialog() {
    const jobTypeData = this.dialogState.data;
    if (jobTypeData?.jobType) {
      // Edit mode
      this.jobTypeForm.patchValue({
        name: jobTypeData.jobType.name,
        description: jobTypeData.jobType.description || '',
        base_price: jobTypeData.jobType.base_price,
        base_hours: jobTypeData.jobType.base_hours,
        color_hex: jobTypeData.jobType.color_hex
      });
    } else {
      // Add mode
      this.jobTypeForm.reset({
        base_price: 0,
        base_hours: 1,
        color_hex: '#3B82F6'
      });
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
      job_type: [null],
      due_date: [null, [Validators.required]]
    });
  }

  private createJobTypeForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      base_price: [0, [Validators.required, Validators.min(0)]],
      base_hours: [1, [Validators.required, Validators.min(0.1)]],
      color_hex: ['#3B82F6', [Validators.required]]
    });
  }

  private createPomodoroConfigForm(): FormGroup {
    return this.fb.group({
      workDuration: [25, [Validators.required, Validators.min(1), Validators.max(60)]],
      shortBreakDuration: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
      longBreakDuration: [15, [Validators.required, Validators.min(1), Validators.max(60)]],
      longBreakInterval: [4, [Validators.required, Validators.min(2), Validators.max(10)]],
      autoStartBreaks: [false],
      autoStartPomodoros: [false],
      soundEnabled: [true],
      notificationsEnabled: [true],
      napalm: [false]
    });
  }

  private createPaymentForm(): FormGroup {
    return this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      payment_date: ['', [Validators.required]],
      description: ['']
    });
  }

  private updatePomodoroConfigForm(config: PomodoroConfig): void {
    this.pomodoroConfigForm.patchValue(config, { emitEvent: false });
  }

  // Data Loading
  private async loadClients() {
    try {
      this.clients = await this.clientService.getAllClients();
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  private async loadJobTypes() {
    try {
      this.jobTypes = await this.jobTypeService.getAllJobTypes();
    } catch (error) {
      console.error('Error loading job types:', error);
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

  private async loadJobPayments(jobId: number): Promise<void> {
    try {
      const payments = await this.paymentService.getPaymentsByJob(jobId);
      this.currentJobPayments = payments;
    } catch (error) {
      console.error('Error loading job payments:', error);
      this.currentJobPayments = [];
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
          formData.job_type_id = formData.job_type?.id;
          
          // Handle completion date based on status
          const currentStatus = formData.status;
          const previousStatus = isEdit ? this.dialogState.data.job.status : null;
          
          if (currentStatus === 'completed' && previousStatus !== 'completed') {
            // Set completion date when status changes to completed
            formData.completed_date = new Date();
          } else if (currentStatus !== 'completed' && previousStatus === 'completed') {
            // Clear completion date when status changes from completed to something else
            formData.completed_date = null;
          } else if (currentStatus === 'completed' && isEdit && this.dialogState.data.job.completed_date) {
            // Keep existing completion date if already completed
            formData.completed_date = this.dialogState.data.job.completed_date;
          }
          
          let result;

          if (isEdit) {
            result = await this.jobService.updateJob(this.dialogState.data.job.id, formData);
            if (this.selectedFiles.length > 0) {
              await this.uploadFiles(this.dialogState.data.job.id, this.selectedFiles);
            }
            // Save payments and their attachments
            await this.saveJobPayments(this.dialogState.data.job.id);
          } else {
            result = await this.jobService.createJob(formData);
            if (this.selectedFiles.length > 0) {
              await this.uploadFiles(result.id!, this.selectedFiles);
            }
            // Save payments and their attachments
            if (result.id) {
              await this.saveJobPayments(result.id);
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

  // JobType Actions
  saveJobType(event: Event) {
    if (this.jobTypeForm.invalid) {
      this.markFormGroupTouched(this.jobTypeForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const isEdit = this.dialogState.data?.jobType;
    
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure that you want to ${isEdit ? 'edit' : 'add'} this job type?`,
      header: `${isEdit ? 'Edit' : 'Add'} Job Type`,
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
          const formData = this.jobTypeForm.value;
          let result;

          if (isEdit) {
            result = await this.jobTypeService.updateJobType(this.dialogState.data.jobType.id, formData);
          } else {
            result = await this.jobTypeService.createJobType(formData);
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Job type ${isEdit ? 'updated' : 'created'} successfully`
          });

          await this.loadJobTypes(); // Refresh the job types list
          this.dialogService.closeDialog({ success: true, data: result });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || `Failed to ${isEdit ? 'update' : 'create'} job type`
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

  // Payment Management Methods
  onPaymentFilesChanged(files: FileItem[]) {
    this.selectedPaymentFiles = files;
  }

  async addPayment() {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      
      // Convert Date object to DD/MM/YYYY string format
      let paymentDateString = '';
      if (formValue.payment_date) {
        if (formValue.payment_date instanceof Date) {
          paymentDateString = this.formatDateToString(formValue.payment_date);
        } else {
          paymentDateString = formValue.payment_date;
        }
      }

      try {
        if (this.editingPaymentIndex >= 0) {
          // Update existing payment
          const existingPayment = this.currentJobPayments[this.editingPaymentIndex];
          existingPayment.amount = formValue.amount;
          existingPayment.payment_date = paymentDateString;
          existingPayment.description = formValue.description;
          
          // Handle file uploads for editing
          if (this.selectedPaymentFiles.length > 0) {
            // For now, just add to the attachments array - real upload happens when job is saved
            existingPayment.attachments = existingPayment.attachments || [];
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment updated successfully'
          });
        } else {
          // Add new payment
          const newPayment: Partial<Payment> = {
            amount: formValue.amount,
            payment_date: paymentDateString,
            description: formValue.description,
            attachments: []
          };

          this.currentJobPayments.push(newPayment as Payment);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment added successfully'
          });
        }
        
        this.resetPaymentForm();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save payment'
        });
      }
    }
  }

  editPayment(payment: Payment, index: number) {
    this.editingPaymentIndex = index;
    this.paymentForm.patchValue({
      amount: payment.amount,
      payment_date: this.parseDateString(payment.payment_date || ''),
      description: payment.description
    });
    this.currentPaymentAttachments = payment.attachments || [];
    this.selectedPaymentFiles = [];
    this.showAddPaymentForm = true;
  }

  deletePayment(payment: Payment, index: number) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this payment of ${payment.amount}?`,
      header: 'Delete Payment',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.currentJobPayments.splice(index, 1);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Payment deleted successfully'
        });
      }
    });
  }

  cancelAddPayment() {
    this.resetPaymentForm();
  }

  private resetPaymentForm() {
    this.paymentForm.reset();
    this.currentPaymentAttachments = [];
    this.selectedPaymentFiles = [];
    this.editingPaymentIndex = -1;
    this.showAddPaymentForm = false;
  }

  private async uploadPaymentFiles(paymentId: number, files: FileItem[]): Promise<void> {
    if (files.length === 0) return;
    try {
      for (const fileItem of files) {
        if (fileItem.file && !fileItem.isUploaded) {
          const arrayBuffer = await this.fileToBuffer(fileItem.file);
          await this.attachmentService.saveFile(fileItem.file.name, arrayBuffer, '', undefined, paymentId);
        }
      }
    } catch (error) {
      console.error('Payment file upload error:', error);
      throw error;
    }
  }

  private async saveJobPayments(jobId: number): Promise<void> {
    for (let i = 0; i < this.currentJobPayments.length; i++) {
      const payment = this.currentJobPayments[i];
      try {
        let savedPayment: Payment;
        
        if (payment.id) {
          // Update existing payment
          const updateData: Partial<Payment> = {
            amount: payment.amount,
            payment_date: payment.payment_date,
            description: payment.description,
            job: { id: jobId } as any // Set job relationship
          };
          const updated = await this.paymentService.updatePayment(payment.id, updateData);
          if (updated) {
            savedPayment = updated;
          } else {
            throw new Error('Failed to update payment');
          }
        } else {
          // Create new payment
          const paymentData: Partial<Payment> = {
            amount: payment.amount,
            payment_date: payment.payment_date,
            description: payment.description,
            job: { id: jobId } as any // Set job relationship
          };
          savedPayment = await this.paymentService.createPayment(paymentData);
        }
        
        // Upload payment files if any (for this specific payment during editing)
        if (this.editingPaymentIndex === i && this.selectedPaymentFiles.length > 0 && savedPayment) {
          await this.uploadPaymentFiles(savedPayment.id, this.selectedPaymentFiles);
        }
      } catch (error) {
        console.error('Error saving payment:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Payment Error',
          detail: 'Some payments failed to save'
        });
      }
    }
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

  // Pomodoro Timer Methods
  toggleTimer(): void {
    if (this.currentSession.isRunning) {
      this.pomodoroService.pauseTimer();
    } else {
      this.pomodoroService.startTimer();
    }
  }

  resetTimer(): void {
    this.pomodoroService.resetTimer();
  }

  skipSession(): void {
    this.pomodoroService.skipSession();
  }

  resetPomodoro(): void {
    this.pomodoroService.resetPomodoro();
  }

  async resetPomodoroConfig(): Promise<void> {
    try {
      await this.pomodoroService.resetConfigToDefaults();
      this.messageService.add({
        severity: 'success',
        summary: 'Settings Reset',
        detail: 'Pomodoro settings have been reset to defaults'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reset Pomodoro settings'
      });
    }
  }

  async applySettings(): Promise<void> {
    if (this.pomodoroConfigForm.valid) {
      try {
        const config = this.pomodoroConfigForm.value;
        await this.pomodoroService.updateConfig(config);
        this.messageService.add({
          severity: 'success',
          summary: 'Settings Applied',
          detail: 'Pomodoro settings have been updated successfully'
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save Pomodoro settings'
        });
      }
    }
  }

  // Pomodoro Utility Methods
  formatTime(seconds: number): string {
    return this.pomodoroService.formatTime(seconds);
  }

  getSessionTypeLabel(type: string): string {
    return this.pomodoroService.getSessionTypeLabel(type as any);
  }

  getProgressColor(): string {
    switch (this.currentSession.type) {
      case 'work':
        return '#e74c3c'; // Red for work
      case 'shortBreak':
        return '#f39c12'; // Orange for short break
      case 'longBreak':
        return '#27ae60'; // Green for long break
      default:
        return '#3498db'; // Blue default
    }
  }

  get strokeDashoffset(): number {
    const progress = this.pomodoroService.getProgress();
    return this.circumference - (progress / 100) * this.circumference;
  }

  // Date Utility Methods
  private formatDateToString(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  private parseDateString(dateString: string): Date | null {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    // Handle 2-digit years
    const fullYear = year < 50 ? 2000 + year : (year < 100 ? 1900 + year : year);
    
    return new Date(fullYear, month, day);
  }
}
