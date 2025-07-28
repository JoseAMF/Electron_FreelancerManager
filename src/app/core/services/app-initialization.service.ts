import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BackendService } from './backend/backend.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  private _isInitialized = new BehaviorSubject<boolean>(false);
  private _isInitializing = new BehaviorSubject<boolean>(false);
  private _initializationError = new BehaviorSubject<string | null>(null);

  constructor(private backendService: BackendService) {}

  get isInitialized$(): Observable<boolean> {
    return this._isInitialized.asObservable();
  }

  get isInitializing$(): Observable<boolean> {
    return this._isInitializing.asObservable();
  }

  get initializationError$(): Observable<string | null> {
    return this._initializationError.asObservable();
  }

  get isInitialized(): boolean {
    return this._isInitialized.value;
  }

  get isInitializing(): boolean {
    return this._isInitializing.value;
  }

  get initializationError(): string | null {
    return this._initializationError.value;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized.value || this._isInitializing.value) {
      return;
    }

    this._isInitializing.next(true);
    this._initializationError.next(null);

    try {
      // Wait a bit to ensure Electron is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initialize the database
      await this.backendService.initializeDatabase();
      
      // Mark as initialized
      this._isInitialized.next(true);
      console.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this._initializationError.next(
        error instanceof Error ? error.message : 'Unknown initialization error'
      );
    } finally {
      this._isInitializing.next(false);
    }
  }

  reset(): void {
    this._isInitialized.next(false);
    this._isInitializing.next(false);
    this._initializationError.next(null);
  }
}
