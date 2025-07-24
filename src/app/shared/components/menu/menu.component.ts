import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Ripple } from 'primeng/ripple';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { JobService, ClientService } from '../../../core/services';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';

interface SearchResult {
  type: 'job' | 'client';
  id: number;
  title: string;
  subtitle?: string;
  icon: string;
  routerLink: string;
}

@Component({
  selector: 'app-menu',
  imports: [MenubarModule, BadgeModule, AvatarModule, InputTextModule, Ripple, CommonModule, ButtonModule, RouterModule, AutoCompleteModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  items: MenuItem[] = [];
  searchResults: SearchResult[] = [];
  searchQuery: string = '';

  constructor(
    private router: Router,
    private jobService: JobService,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.initializeMenuItems();
  }

  private initializeMenuItems() {
    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi-home',
        routerLink: ['/dashboard']
      },
      {
        label: 'Clients',
        icon: 'pi-users',
        routerLink: ['/clients']
      },
      {
        label: 'Jobs',
        icon: 'pi-briefcase',
        routerLink: ['/jobs']
      },
      {
        label: 'Payments',
        icon: 'pi-credit-card',
        routerLink: ['/payments']
      }
    ];
  }

  async searchGlobal(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.searchQuery = query;

    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    try {
      const [jobs, clients] = await Promise.all([
        this.jobService.searchJobs(query),
        this.clientService.searchClients(query)
      ]);

      this.searchResults = [
        ...clients.map(client => ({
          type: 'client' as const,
          id: client.id!,
          title: client.name,
          subtitle: '', // Remove subtitle for single line
          icon: 'pi-user',
          routerLink: `/clients?id=${client.id}`
        })),
        ...jobs.map(job => ({
          type: 'job' as const,
          id: job.id!,
          title: job.title,
          subtitle: '', // Remove subtitle for single line
          icon: 'pi-briefcase',
          routerLink: `/jobs?id=${job.id}`
        }))
      ];
    } catch (error) {
      console.error('Search error:', error);
      this.searchResults = [];
    }
  }

  onSearchSelect(result: AutoCompleteSelectEvent) {
    const searchResult = result as unknown as SearchResult;
    this.router.navigate([searchResult.routerLink.split('?')[0]], {
      queryParams: searchResult.routerLink.includes('?') ? 
        { id: searchResult.id } : {}
    });
    this.searchQuery = '';
  }

  getSearchItemTemplate(result: SearchResult): string {
    return `
      <div class="search-result-item">
        <i class="pi ${result.icon} search-result-icon"></i>
        <div class="search-result-content">
          <div class="search-result-title">${result.title}</div>
          <div class="search-result-subtitle">${result.subtitle || ''}</div>
        </div>
        <span class="search-result-type">${result.type}</span>
      </div>
    `;
  }
}
