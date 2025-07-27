import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BackendService } from '../core/services/backend/backend.service';
import { JobService } from '../core/services/job.service';
import { ClientService } from '../core/services/client.service';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { Job } from '../../../app/backend/entities';
import { DialogService } from '../core/dialog.service';
import { JobCalendarComponent } from '../shared/components/job-calendar/job-calendar.component';
import { Status } from '../../../app/backend/entities/status.enum';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    JobCalendarComponent
  ]
})
export class HomeComponent implements OnInit {
  jobs: Job[] = [];
  loading = false;
  
  // Calendar state tracking
  currentView: CalendarView = CalendarView.Month;
  currentViewDate: Date = new Date();

  // Cache for filtered jobs by status
  private pendingJobsCache: Job[] = [];
  private ongoingJobsCache: Job[] = [];
  private completedJobsCache: Job[] = [];

  constructor(
    private router: Router,
    private backendService: BackendService,
    private jobService: JobService,
    private clientService: ClientService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) { }

  async ngOnInit(): Promise<void> {    
    await this.backendService.initializeDatabase();
    await this.loadJobsForCurrentView();
  }

  async loadJobsForCurrentView(): Promise<void> {
    this.loading = true;
    try {
      // Load jobs based on current calendar view using backend filtering
      switch (this.currentView) {
        case CalendarView.Day:
          await this.loadJobsByDay();
          break;
        case CalendarView.Week:
          await this.loadJobsByWeek();
          break;
        case CalendarView.Month:
        default:
          await this.loadJobsByMonth();
          break;
      }
    } catch (error) {
      console.error('Error loading jobs for current view:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadJobsByDay(): Promise<void> {
    const [pending, ongoing, completed] = await Promise.all([
      this.jobService.getJobsByDay(this.currentViewDate, Status.PENDING),
      this.jobService.getJobsByDay(this.currentViewDate, Status.IN_PROGRESS),
      this.jobService.getJobsByDay(this.currentViewDate, Status.COMPLETED)
    ]);
    
    this.pendingJobsCache = pending;
    this.ongoingJobsCache = ongoing;
    this.completedJobsCache = completed;
    this.jobs = [...pending, ...ongoing, ...completed];
  }

  private async loadJobsByWeek(): Promise<void> {
    const [pending, ongoing, completed] = await Promise.all([
      this.jobService.getJobsByWeek(this.currentViewDate, Status.PENDING),
      this.jobService.getJobsByWeek(this.currentViewDate, Status.IN_PROGRESS),
      this.jobService.getJobsByWeek(this.currentViewDate, Status.COMPLETED)
    ]);
    
    this.pendingJobsCache = pending;
    this.ongoingJobsCache = ongoing;
    this.completedJobsCache = completed;
    this.jobs = [...pending, ...ongoing, ...completed];
  }

  private async loadJobsByMonth(): Promise<void> {
    const [pending, ongoing, completed] = await Promise.all([
      this.jobService.getJobsByMonth(this.currentViewDate, Status.PENDING),
      this.jobService.getJobsByMonth(this.currentViewDate, Status.IN_PROGRESS),
      this.jobService.getJobsByMonth(this.currentViewDate, Status.COMPLETED)
    ]);
    
    this.pendingJobsCache = pending;
    this.ongoingJobsCache = ongoing;
    this.completedJobsCache = completed;
    this.jobs = [...pending, ...ongoing, ...completed];
  }

  onEventClicked(event: CalendarEvent): void {
    if (event.meta?.job) {
      // Navigate to job details or open job modal
      this.router.navigate(['/jobs'], { 
        queryParams: { id: event.meta.job.id } 
      });
    }
  }

  async onCreateNewJob(): Promise<void> {
    const result = await this.dialogService.openJobDialog();
    if (result.success) {
      await this.loadJobsForCurrentView();
    }
  }

  // Calendar view change handlers
  onCalendarViewChanged(view: CalendarView): void {
    this.currentView = view;
    this.loadJobsForCurrentView(); // Reload jobs for new view
    this.cdr.detectChanges();
  }

  onCalendarDateChanged(date: Date): void {
    this.currentViewDate = date;
    this.loadJobsForCurrentView(); // Reload jobs for new date
    this.cdr.detectChanges();
  }

  // Simplified getters using cached data from backend filtering
  get pendingJobs(): Job[] {
    return this.pendingJobsCache;
  }

  get ongoingJobs(): Job[] {
    return this.ongoingJobsCache;
  }

  get completedJobs(): Job[] {
    return this.completedJobsCache;
  }

  // Additional getters for counts and summaries
  get totalJobsInView(): number {
    return this.jobs.length;
  }

  get pendingJobsCount(): number {
    return this.pendingJobsCache.length;
  }

  get ongoingJobsCount(): number {
    return this.ongoingJobsCache.length;
  }

  get completedJobsCount(): number {
    return this.completedJobsCache.length;
  }

  get currentViewLabel(): string {
    switch (this.currentView) {
      case CalendarView.Month:
        return this.currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case CalendarView.Week:
        const weekStart = startOfWeek(this.currentViewDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(this.currentViewDate, { weekStartsOn: 1 });
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case CalendarView.Day:
        return this.currentViewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return '';
    }
  }

  // Helper methods for template
  getClientName(clientId: number | undefined): string {
    if (!clientId) return 'No Client';
    // This would need to be implemented with client lookup
    // For now, return a placeholder
    return `Client ${clientId}`;
  }

  getStatusSeverity(status: Status): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (status) {
      case Status.COMPLETED:
        return 'success';
      case Status.IN_PROGRESS:
        return 'info';
      case Status.PENDING:
        return 'warning';
      default:
        return 'secondary';
    }
  }

}
