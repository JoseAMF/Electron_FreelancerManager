import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Client } from '../../../app/backend/entities';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ClientService } from '../core/services';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clients',
  imports: [TableModule, ButtonModule, PanelModule, DialogModule, InputTextModule, ReactiveFormsModule, ConfirmDialog, InputGroupModule, InputGroupAddonModule, ToastModule, FloatLabelModule, DatePipe],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  clientForm: FormGroup;
  displayClientDialog: boolean = false;
  isAdd: boolean = true;
  currentClientId?: number;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService, 
    private confirmationService: ConfirmationService, 
    private messageService: MessageService
  ) {
    this.clientForm = this.createClientForm();
  }
  
  ngOnInit(): void {
    this.listClients();
  }

  private createClientForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      discord: ['']
    });
  }
  
  listClients() {
    this.clients = [];
    this.clientService.getAllClients().then(clients => {
      this.clients = clients;
    });
  }

  addClient() {
    this.isAdd = true;
    this.currentClientId = undefined;
    this.clientForm.reset();
    this.displayClientDialog = true;
  }

  editClient(client: Client) {
    this.isAdd = false;
    this.currentClientId = client.id;
    this.clientForm.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      discord: client.discord || ''
    });
    this.displayClientDialog = true;
  }

  cancelAddClient() {
    this.displayClientDialog = false;
    this.clientForm.reset();
  }

  saveNewClient($event: Event) {
    if (this.clientForm.invalid) {
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
      message: `Are you sure that you want to ${this.isAdd ? 'add' : 'edit'} this client?`,
      header: `${this.isAdd ? 'Add' : 'Edit'} Client`,
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
        const formData = this.clientForm.value;
        
        if (this.isAdd) {
          this.clientService.createClient(formData).then(() => {
            this.listClients();
            this.displayClientDialog = false;
            this.clientForm.reset();
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Client created successfully' 
            });
          }).catch(error => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Failed to create client' 
            });
          });
        } else {
          this.clientService.updateClient(this.currentClientId!, formData).then(() => {
            this.listClients();
            this.displayClientDialog = false;
            this.clientForm.reset();
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Client updated successfully' 
            });
          }).catch(error => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Failed to update client' 
            });
          });
        }
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      control?.markAsTouched();
    });
  }

  getDialogTitle(): string {
    return this.isAdd ? 'Add Client' : 'Edit Client';
  }

  // Validation helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.clientForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid phone number';
    }
    return '';
  }

  deleteClient(event: Event, client: Client) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Do you want to delete this record?',
      header: 'Delete Client',
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
        this.clientService.deleteClient(client.id!).then(() => {
          this.clients = this.clients.filter(c => c.id !== client.id);
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Client deleted successfully' 
          });
        }).catch(error => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to delete client' 
          });
        });
      },
    });
  }
}
