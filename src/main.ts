import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // ← Importez la config unique

// Utilisez UNIQUEMENT la configuration de app.config.ts
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
