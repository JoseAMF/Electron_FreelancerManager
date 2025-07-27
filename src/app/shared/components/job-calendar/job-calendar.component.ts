import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  CalendarEvent, 
  CalendarView, 
  CalendarModule as AngularCalendarModule,
  CalendarDateFormatter,
  CalendarA11y,
  CalendarUtils,
  CalendarEventTitleFormatter
} from 'angular-calendar';
import { Subject } from 'rxjs';
import { isSameDay, isSameMonth } from 'date-fns';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { Status } from '../../../../../app/backend/entities/status.enum';
import { Job } from '../../../../../app/backend/entities';
import { DateUtils } from '../../../core/utils';

const statusColors: { [key in Status]: any } = {
  [Status.PENDING]: {
    primary: '#f97316',
    secondary: '#fed7aa'
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
  selector: 'app-job-calendar',
  templateUrl: './job-calendar.component.html',
  styleUrls: ['./job-calendar.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularCalendarModule,
    ButtonModule,
    CardModule,
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
export class JobCalendarComponent implements OnInit, OnChanges {
  @Input() jobs: Job[] = [];
  @Input() loading: boolean = false;
  @Output() eventClicked = new EventEmitter<CalendarEvent>();
  @Output() newJobRequested = new EventEmitter<void>();
  @Output() viewChanged = new EventEmitter<CalendarView>();
  @Output() dateChanged = new EventEmitter<Date>();

  CalendarView = CalendarView;
  Status = Status;

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateEvents();
  }

  ngOnChanges(): void {
    this.updateEvents();
  }

  private updateEvents(): void {
    // Filter out cancelled jobs since there will be no more work on them
    const activeJobs = this.jobs.filter(job => job.status !== Status.CANCELLED);
    this.events = activeJobs.map(job => this.jobToCalendarEvent(job));
    this.refresh.next();
    this.cdr.detectChanges();
  }

  private jobToCalendarEvent(job: Job): CalendarEvent {
    let startDate = job.start_date ? DateUtils.parseStringToDate(job.start_date) : new Date();
    let endDate: Date | null = null;
    
    if (job.completed_date) {
      endDate = DateUtils.parseStringToDate(job.completed_date);
      startDate = endDate;
    } else if (job.due_date) {
      endDate = DateUtils.parseStringToDate(job.due_date);
    }
    
    return {
      id: job.id,
      start: startDate || new Date(), // Fallback to current date if null
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
      draggable: false,
      allDay: true,
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
      this.dateChanged.emit(this.viewDate);
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    if (action === 'Clicked') {
      this.eventClicked.emit(event);
    }
  }

  setView(view: CalendarView): void {
    this.view = view;
    this.viewChanged.emit(this.view);
    this.cdr.detectChanges();
  }

  closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }

  previousView(): void {
    this.closeOpenMonthViewDay();
    this.dateChanged.emit(this.viewDate);
  }

  nextView(): void {
    this.closeOpenMonthViewDay();
    this.dateChanged.emit(this.viewDate);
  }

  goToToday(): void {
    this.viewDate = new Date();
    this.dateChanged.emit(this.viewDate);
    this.closeOpenMonthViewDay();
  }

  getStatusSeverity(status: Status): string {
    switch (status) {
      case Status.COMPLETED:
        return 'success';
      case Status.IN_PROGRESS:
        return 'info';
      case Status.PENDING:
        return 'warn';
      case Status.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: Status): string {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  onCreateNewJob(): void {
    this.newJobRequested.emit();
  }
}
