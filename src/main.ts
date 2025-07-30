import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './environments/environment';
import { CoreModule } from './app/core/core.module';
import { SharedModule } from './app/shared/shared.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { PageNotFoundComponent } from './app/shared/components';
import { HomeComponent } from './app/home/home.component';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { ClientsComponent } from './app/clients/clients.component';
import { JobsComponent } from './app/jobs/jobs.component';
import { JobTypesComponent } from './app/job-types/job-types.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    providePrimeNG({
       theme: {
                preset: Aura
            }
    }),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter([
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'jobs',
        component: JobsComponent
      },
      {
        path: 'job-types',
        component: JobTypesComponent
      },
      {
        path: 'clients',
        component: ClientsComponent
      },
      {
        path: '**',
        component: PageNotFoundComponent
      }
    ]),
    // Provide the DateAdapter for Angular Calendar
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    importProvidersFrom(
      CoreModule,
      SharedModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
}).catch(err => console.error(err));
