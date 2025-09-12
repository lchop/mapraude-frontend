import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';  // ← Ajoutez ça
import { routes } from './app/app.routes';        // ← Ajoutez ça

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes)  // ← Ajoutez ça
  ]
});
