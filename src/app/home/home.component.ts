import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { BackendService } from '../core/services/backend/backend.service';
import { JobService } from '../core/services/job.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { 
  CalendarEvent, 
  CalendarView, 
  CalendarModule as AngularCalendarModule,
  CalendarEventTimesChangedEvent,
  CalendarDateFormatter,
  CalendarA11y,
  CalendarUtils,
  CalendarEventTitleFormatter,
  CalendarMonthViewDay
} from 'angular-calendar';
import { Subject } from 'rxjs';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours, parseISO } from 'date-fns';

import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Status } from '../../../app/backend/entities/status.enum';
import { Job } from '../../../app/backend/entities';
import { DialogService } from '../core/dialog.service';

const statusColors: { [key in Status]: any } = {
  [Status.PENDING]: {
    primary: '#fbbf24',
    secondary: '#fef3c7'
  },
  [Status.IN_PROGRESS]: {
    primary: '#3b82f6',
    secondary: '#dbeafe'
  },
  [Status.COMPLETED]: {
    primary: '#10b981',
    secondary: '#d1fae5'
  },
  [Status.CANCELLED]: {
    primary: '#ef4444',
    secondary: '#fee2e2'
  }
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink, 
    TranslateModule, 
    ButtonModule,
    AngularCalendarModule,
    CardModule,
    MenuModule,
    TagModule,
    TooltipModule
  ],
  providers: [
    CalendarDateFormatter,
    CalendarA11y,
    CalendarUtils,
    CalendarEventTitleFormatter
  ]
})
export class HomeComponent implements OnInit {

  CalendarView = CalendarView;
  Status = Status;

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = true;
  
  jobs: Job[] = [];
  loading = false;
  
  viewMenuItems: MenuItem[] = [
    {
      label: 'Month',
      icon: 'pi pi-calendar',
      command: () => this.setView(CalendarView.Month)
    },
    {
      label: 'Week',
      icon: 'pi pi-table',
      command: () => this.setView(CalendarView.Week)
    },
    {
      label: 'Day',
      icon: 'pi pi-clock',
      command: () => this.setView(CalendarView.Day)
    }
  ];

  constructor(
    private router: Router,
    private backendService: BackendService,
    private jobService: JobService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) { }

  async ngOnInit(): Promise<void> {    
      await this.backendService.initializeDatabase();
      await this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    this.loading = true;
    try {
      this.jobs = await this.jobService.getAllJobs();
      // Filter out cancelled jobs since there will be no more work on them
      const activeJobs = this.jobs.filter(job => job.status !== Status.CANCELLED);
      this.events = activeJobs.map(job => this.jobToCalendarEvent(job));
      this.refresh.next();
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private jobToCalendarEvent(job: Job): CalendarEvent {
    const startDate = job.start_date ? new Date(job.start_date) : new Date();
    let endDate: Date | null = null;
    if(job.completed_date) {
      endDate = new Date(job.completed_date);
    } else {
      endDate = job.due_date ? new Date(job.due_date) : null;
    }
    
    return {
      id: job.id,
      start: startDate,
      end: endDate || undefined,
      title: job.title,
      color: statusColors[job.status as Status] || statusColors[Status.PENDING],
      meta: {
        job: job,
        status: job.status,
        client: job.client?.name || 'No Client'
      },
      cssClass: `job-event status-${job.status?.toLowerCase().replace('_', '-')}`,
      resizable: {
        beforeStart: false,
        afterEnd: false
      },
      draggable: false
    };
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    console.log(action, event);
    
    if (action === 'Clicked' && event.meta?.job) {
      // Navigate to job details or open job modal
      this.router.navigate(['/jobs'], { 
        queryParams: { id: event.meta.job.id } 
      });
    }
  }

  setView(view: CalendarView) {
    this.view = view;
    this.cdr.detectChanges();
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  previousView() {
    this.closeOpenMonthViewDay();
  }

  nextView() {
    this.closeOpenMonthViewDay();
  }

  goToToday() {
    this.viewDate = new Date();
    this.closeOpenMonthViewDay();
  }

  getStatusSeverity(status: Status): string {
    switch (status) {
      case Status.COMPLETED:
        return 'success';
      case Status.IN_PROGRESS:
        return 'info';
      case Status.PENDING:
        return 'warning';
      case Status.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: Status): string {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  async refreshJobs(): Promise<void> {
    await this.loadJobs();
  }

  async createNewJob(): Promise<void> {
    const result = await this.dialogService.openJobDialog();
    if (result.success) {
      await this.loadJobs();
    }
  }
}
