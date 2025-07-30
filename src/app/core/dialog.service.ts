import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DialogConfig {
  title: string;
  width?: string;
  height?: string;
  modal?: boolean;
  closable?: boolean;
  dismissableMask?: boolean;
}

export interface ClientDialogData {
  client?: any;
  isEdit?: boolean;
}

export interface JobDialogData {
  job?: any;
  isEdit?: boolean;
}

export interface JobTypeDialogData {
  jobType?: any;
  isEdit?: boolean;
}

export interface PomodoroDialogData {
  // No specific data needed since config is handled by ConfigService
}

export interface PomodoroSession {
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  completedPomodoros: number;
}

export interface DialogResult<T = any> {
  success: boolean;
  data?: T;
  cancelled?: boolean;
}

export interface DialogState {
  type: 'client' | 'job' | 'jobType' | 'pomodoro' | null;
  visible: boolean;
  config: DialogConfig;
  data: any;
  resolve?: (result: DialogResult) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogState = new BehaviorSubject<DialogState>({
    type: null,
    visible: false,
    config: { title: '' },
    data: null
  });

  public dialogState$ = this.dialogState.asObservable();

  openClientDialog(data: ClientDialogData = {}, config: Partial<DialogConfig> = {}): Promise<DialogResult> {
    return new Promise((resolve) => {
      const defaultConfig: DialogConfig = {
        title: data.isEdit ? 'Edit Client' : 'Add Client',
        width: '50vw',
        modal: true,
        closable: false,
        dismissableMask: true,
        ...config
      };

      this.dialogState.next({
        type: 'client',
        visible: true,
        config: defaultConfig,
        data,
        resolve
      });
    });
  }

  openJobDialog(data: JobDialogData = {}, config: Partial<DialogConfig> = {}): Promise<DialogResult> {
    return new Promise((resolve) => {
      const defaultConfig: DialogConfig = {
        title: data.isEdit ? 'Edit Job' : 'Add Job',
        width: '60vw',
        modal: true,
        closable: false,
        dismissableMask: true,
        ...config
      };

      this.dialogState.next({
        type: 'job',
        visible: true,
        config: defaultConfig,
        data,
        resolve
      });
    });
  }

  openJobTypeDialog(data: JobTypeDialogData = {}, config: Partial<DialogConfig> = {}): Promise<DialogResult> {
    return new Promise((resolve) => {
      const defaultConfig: DialogConfig = {
        title: data.isEdit ? 'Edit Job Type' : 'Add Job Type',
        width: '50vw',
        modal: true,
        closable: false,
        dismissableMask: true,
        ...config
      };

      this.dialogState.next({
        type: 'jobType',
        visible: true,
        config: defaultConfig,
        data,
        resolve
      });
    });
  }

  openPomodoroDialog(data: PomodoroDialogData = {}, config: Partial<DialogConfig> = {}): Promise<DialogResult> {
    return new Promise((resolve) => {
      const defaultConfig: DialogConfig = {
        title: 'Pomodoro Timer',
        width: '50vw',
        modal: true,
        closable: true,
        dismissableMask: false,
        ...config
      };

      this.dialogState.next({
        type: 'pomodoro',
        visible: true,
        config: defaultConfig,
        data,
        resolve
      });
    });
  }

  closeDialog(result: DialogResult = { success: false, cancelled: true }) {
    const currentState = this.dialogState.value;
    if (currentState.resolve) {
      currentState.resolve(result);
    }

    this.dialogState.next({
      type: null,
      visible: false,
      config: { title: '' },
      data: null
    });
  }
}