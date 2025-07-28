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
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FileItem, FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { Client, Attachment } from '../../../../app/backend/entities';
import { DialogState, DialogService, PomodoroSession } from '../dialog.service';
import { ClientService, JobService, AttachmentService, PomodoroService } from '../services';
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
    FileUploaderComponent,
    AccordionModule,
    CheckboxModule
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
  pomodoroConfigForm: FormGroup;

  // Pomodoro data
  currentSession!: PomodoroSession;
  currentConfig!: PomodoroConfig;
  circumference = 2 * Math.PI * 45; // radius = 45

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
    private pomodoroService: PomodoroService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.clientForm = this.createClientForm();
    this.jobForm = this.createJobForm();
    this.pomodoroConfigForm = this.createPomodoroConfigForm();
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
        due_date: DateUtils.parseStringToDate(jobData.job.due_date!)
      });
      await this.loadJobAttachments(jobData.job.id!);
    } else {
      // Add mode
      this.jobForm.reset({ status: 'pending', price: 0 });
      this.selectedFiles = [];
      this.currentJobAttachments = [];
    }
  }

  private initializePomodoroDialog() {
    // Initialize current session and config from service
    this.currentSession = this.pomodoroService.getSession();
    this.currentConfig = this.pomodoroService.getConfig();
    this.updatePomodoroConfigForm(this.currentConfig);
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
}
