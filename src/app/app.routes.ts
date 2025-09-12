import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { MapPageComponent } from './components/pages/map/map.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/map',
    pathMatch: 'full'
  },
  {
    path: 'map',
    component: MapPageComponent,
    title: 'Carte des Maraudes - Mapraude'
    // ← Pas de guard ici = accessible à tous
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Connexion Association - Mapraude'
    // ← Pas de guard ici = accessible à tous
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Espace Association - Mapraude',
    canActivate: [authGuard]  // ← Protégé par l'auth guard
  },
  {
    path: '**',
    redirectTo: '/map'
  }
];
