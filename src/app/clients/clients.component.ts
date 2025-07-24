import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Client } from '../../../app/backend/entities';
import { PanelModule } from 'primeng/panel';
import { ClientService } from '../core/services';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DatePipe } from '@angular/common';
import { DialogService } from '../core/dialog.service';

@Component({
  selector: 'app-clients',
  imports: [TableModule, ButtonModule, PanelModule, ConfirmDialog, ToastModule, DatePipe],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];

  constructor(
    private clientService: ClientService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.listClients();
  }

  listClients() {
    this.clients = [];
    this.clientService.getAllClients().then(clients => {
      this.clients = clients;
    });
  }

  async addClient() {
    const result = await this.dialogService.openClientDialog();
    if (result.success) {
      this.listClients();
    }
  }

  async editClient(client: Client) {
    const result = await this.dialogService.openClientDialog({
      client,
      isEdit: true
    });
    if (result.success) {
      this.listClients();
    }
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
