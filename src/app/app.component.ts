import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, AppInitializationService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/components/menu/menu.component';
import { GlobalDialogsComponent } from './core/global-dialog/global-dialog.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      RouterOutlet, 
      MenuComponent, 
      GlobalDialogsComponent,
      ProgressSpinnerModule
    ]
})
export class AppComponent implements OnInit {
  isInitialized$: Observable<boolean>;
  isInitializing$: Observable<boolean>;
  initializationError$: Observable<string | null>;

  constructor(
    private electronService: ElectronService,
    private appInitService: AppInitializationService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    this.isInitialized$ = this.appInitService.isInitialized$;
    this.isInitializing$ = this.appInitService.isInitializing$;
    this.initializationError$ = this.appInitService.initializationError$;

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }

  async ngOnInit() {
    // Initialize the application
    await this.appInitService.initialize();
  }

  async retryInitialization() {
    this.appInitService.reset();
    await this.appInitService.initialize();
  }
}
