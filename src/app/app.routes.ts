import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/map', pathMatch: 'full' },
  { path: 'map', loadComponent: () => import('./app.component').then(c => c.AppComponent) },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent }
];
