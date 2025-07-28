import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { PomodoroSession } from '../dialog.service';
import { ConfigService } from './config.service';

export interface PomodoroConfig {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  napalm: boolean; // Custom alert mode
}

@Injectable({
  providedIn: 'root'
})
export class PomodoroService {
  private defaultConfig: PomodoroConfig = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    notificationsEnabled: true,
    napalm: false
  };

  private sessionState = new BehaviorSubject<PomodoroSession>({
    type: 'work',
    duration: this.defaultConfig.workDuration * 60, // Convert to seconds
    remaining: this.defaultConfig.workDuration * 60,
    isRunning: false,
    isPaused: false,
    currentRound: 1,
    completedPomodoros: 0
  });

  private configState = new BehaviorSubject<PomodoroConfig>(this.defaultConfig);
  private timerSubscription?: Subscription;

  public session$ = this.sessionState.asObservable();
  public config$ = this.configState.asObservable();

  // Config keys with pomodoro_ prefix
  private readonly CONFIG_KEYS = {
    workDuration: 'pomodoro_workDuration',
    shortBreakDuration: 'pomodoro_shortBreakDuration',
    longBreakDuration: 'pomodoro_longBreakDuration',
    longBreakInterval: 'pomodoro_longBreakInterval',
    autoStartBreaks: 'pomodoro_autoStartBreaks',
    autoStartPomodoros: 'pomodoro_autoStartPomodoros',
    soundEnabled: 'pomodoro_soundEnabled',
    notificationsEnabled: 'pomodoro_notificationsEnabled',
    napalm: 'pomodoro_napalm'
  };

  constructor(private configService: ConfigService) {
    // Load saved config from database
    this.loadConfig();
  }

  getSession(): PomodoroSession {
    return this.sessionState.value;
  }

  getConfig(): PomodoroConfig {
    return this.configState.value;
  }

  async updateConfig(config: Partial<PomodoroConfig>): Promise<void> {
    const updatedConfig = { ...this.configState.value, ...config };
    this.configState.next(updatedConfig);
    await this.saveConfig(updatedConfig);
    
    // Update current session if not running
    const currentSession = this.sessionState.value;
    if (!currentSession.isRunning) {
      this.resetTimer();
    }
  }

  startTimer(): void {
    const session = this.sessionState.value;
    if (session.isRunning) return;

    this.updateSession({ isRunning: true, isPaused: false });
    
    this.timerSubscription = interval(1000).subscribe(() => {
      this.tick();
    });
  }

  pauseTimer(): void {
    const session = this.sessionState.value;
    if (!session.isRunning) return;

    this.updateSession({ isRunning: false, isPaused: true });
    this.timerSubscription?.unsubscribe();
  }

  resetTimer(): void {
    this.timerSubscription?.unsubscribe();
    const config = this.configState.value;
    const session = this.sessionState.value;
    
    let duration: number;
    switch (session.type) {
      case 'work':
        duration = config.workDuration * 60;
        break;
      case 'shortBreak':
        duration = config.shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = config.longBreakDuration * 60;
        break;
    }

    this.updateSession({
      duration,
      remaining: duration,
      isRunning: false,
      isPaused: false
    });
  }

  skipSession(): void {
    this.timerSubscription?.unsubscribe();
    this.completeSession();
  }

  resetPomodoro(): void {
    this.timerSubscription?.unsubscribe();
    const config = this.configState.value;
    
    this.sessionState.next({
      type: 'work',
      duration: config.workDuration * 60,
      remaining: config.workDuration * 60,
      isRunning: false,
      isPaused: false,
      currentRound: 1,
      completedPomodoros: 0
    });
  }

  async resetConfigToDefaults(): Promise<void> {
    await this.updateConfig(this.defaultConfig);
  }

  private tick(): void {
    const session = this.sessionState.value;
    const newRemaining = Math.max(0, session.remaining - 1);
    
    this.updateSession({ remaining: newRemaining });
    
    if (newRemaining === 0) {
      this.completeSession();
    }
  }

  private completeSession(): void {
    const session = this.sessionState.value;
    const config = this.configState.value;
    
    this.timerSubscription?.unsubscribe();
    
    // Play sound if enabled
    if (config.soundEnabled) {
      this.playNotificationSound();
    }
    
    // Show notification if enabled
    if (config.notificationsEnabled) {
      this.showNotification(session.type);
    }
    
    // Determine next session type
    if (session.type === 'work') {
      const newCompletedPomodoros = session.completedPomodoros + 1;
      const isLongBreak = newCompletedPomodoros % config.longBreakInterval === 0;
      const nextType = isLongBreak ? 'longBreak' : 'shortBreak';
      
      this.startNextSession(nextType, {
        completedPomodoros: newCompletedPomodoros,
        currentRound: session.currentRound + 1
      });
    } else {
      // Break completed, start work session
      this.startNextSession('work');
    }
  }

  private startNextSession(type: PomodoroSession['type'], updates: Partial<PomodoroSession> = {}): void {
    const config = this.configState.value;
    let duration: number;
    
    switch (type) {
      case 'work':
        duration = config.workDuration * 60;
        break;
      case 'shortBreak':
        duration = config.shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = config.longBreakDuration * 60;
        break;
    }

    const newSession: PomodoroSession = {
      ...this.sessionState.value,
      type,
      duration,
      remaining: duration,
      isRunning: false,
      isPaused: false,
      ...updates
    };

    this.sessionState.next(newSession);

    // Auto-start if configured
    const shouldAutoStart = (type === 'work' && config.autoStartPomodoros) || 
                           (type !== 'work' && config.autoStartBreaks);
    
    if (shouldAutoStart) {
      setTimeout(() => this.startTimer(), 1000); // Small delay for UI updates
    }
  }

  private updateSession(updates: Partial<PomodoroSession>): void {
    const currentSession = this.sessionState.value;
    this.sessionState.next({ ...currentSession, ...updates });
  }

  private playNotificationSound(): void {
    try {
      const config = this.configState.value;
      
      if (config.napalm) {
        // Use custom Napalm alert sound
        const audio = new Audio('assets/alert.mp3');
        audio.volume = 1; // Adjust volume as needed
        audio.play().catch(error => {
          console.warn('Could not play custom alert sound:', error);
          // Fallback to default beep
          this.playDefaultBeep();
        });
      } else {
        // Use default beep sound
        this.playDefaultBeep();
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  private playDefaultBeep(): void {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  private showNotification(sessionType: PomodoroSession['type']): void {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const messages = {
        work: 'Work session completed! Time for a break.',
        shortBreak: 'Break time is over! Ready to work?',
        longBreak: 'Long break finished! Let\'s get back to work!'
      };
      
      new Notification('Pomodoro Timer', {
        body: messages[sessionType],
        icon: '/assets/icons/favicon.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(sessionType);
        }
      });
    }
  }

  private async saveConfig(config: PomodoroConfig): Promise<void> {
    try {
      // Save each config value with pomodoro_ prefix
      await Promise.all([
        this.configService.setConfig(this.CONFIG_KEYS.workDuration, config.workDuration.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.shortBreakDuration, config.shortBreakDuration.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.longBreakDuration, config.longBreakDuration.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.longBreakInterval, config.longBreakInterval.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.autoStartBreaks, config.autoStartBreaks.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.autoStartPomodoros, config.autoStartPomodoros.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.soundEnabled, config.soundEnabled.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.notificationsEnabled, config.notificationsEnabled.toString()),
        this.configService.setConfig(this.CONFIG_KEYS.napalm, config.napalm.toString())
      ]);
    } catch (error) {
      console.warn('Could not save Pomodoro config to database:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      // Load each config value from database
      const [
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        longBreakInterval,
        autoStartBreaks,
        autoStartPomodoros,
        soundEnabled,
        notificationsEnabled,
        napalm
      ] = await Promise.all([
        this.configService.getConfig(this.CONFIG_KEYS.workDuration),
        this.configService.getConfig(this.CONFIG_KEYS.shortBreakDuration),
        this.configService.getConfig(this.CONFIG_KEYS.longBreakDuration),
        this.configService.getConfig(this.CONFIG_KEYS.longBreakInterval),
        this.configService.getConfig(this.CONFIG_KEYS.autoStartBreaks),
        this.configService.getConfig(this.CONFIG_KEYS.autoStartPomodoros),
        this.configService.getConfig(this.CONFIG_KEYS.soundEnabled),
        this.configService.getConfig(this.CONFIG_KEYS.notificationsEnabled),
        this.configService.getConfig(this.CONFIG_KEYS.napalm)
      ]);

      // Build config object with loaded values or defaults
      const loadedConfig: PomodoroConfig = {
        workDuration: workDuration ? parseInt(workDuration) : this.defaultConfig.workDuration,
        shortBreakDuration: shortBreakDuration ? parseInt(shortBreakDuration) : this.defaultConfig.shortBreakDuration,
        longBreakDuration: longBreakDuration ? parseInt(longBreakDuration) : this.defaultConfig.longBreakDuration,
        longBreakInterval: longBreakInterval ? parseInt(longBreakInterval) : this.defaultConfig.longBreakInterval,
        autoStartBreaks: autoStartBreaks ? autoStartBreaks === 'true' : this.defaultConfig.autoStartBreaks,
        autoStartPomodoros: autoStartPomodoros ? autoStartPomodoros === 'true' : this.defaultConfig.autoStartPomodoros,
        soundEnabled: soundEnabled ? soundEnabled === 'true' : this.defaultConfig.soundEnabled,
        notificationsEnabled: notificationsEnabled ? notificationsEnabled === 'true' : this.defaultConfig.notificationsEnabled,
        napalm: napalm ? napalm === 'true' : this.defaultConfig.napalm
      };

      this.configState.next(loadedConfig);
      
      // Update session duration if not running
      const currentSession = this.sessionState.value;
      if (!currentSession.isRunning) {
        this.resetTimer();
      }
    } catch (error) {
      console.warn('Could not load Pomodoro config from database:', error);
      // Keep default config if loading fails
    }
  }

  // Utility methods for formatting
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    const session = this.sessionState.value;
    return ((session.duration - session.remaining) / session.duration) * 100;
  }

  getSessionTypeLabel(type: PomodoroSession['type']): string {
    const labels = {
      work: 'Work Session',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
    };
    return labels[type];
  }
}
