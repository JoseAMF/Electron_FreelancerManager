import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { BackendService } from '../core/services/backend/backend.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [RouterLink, TranslateModule, ButtonModule]
})
export class HomeComponent implements OnInit {

  constructor(
    private router: Router,
    private backendService: BackendService
  ) { }

  async ngOnInit(): Promise<void> {
    console.log('HomeComponent INIT ', this.backendService.isElectron);
    
    // Example of using the backend service
    if (this.backendService.isElectron) {
      try {
        await this.backendService.initializeDatabase();
        const version = await this.backendService.getAppVersion();
        console.log('App version:', version);
        console.log('Platform:', this.backendService.getPlatform());
      } catch (error) {
        console.error('Failed to initialize backend:', error);
      }
    }
  }

}
