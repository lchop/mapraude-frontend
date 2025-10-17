import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateMaraudeComponent } from './components/create-maraude/create-maraude.component';
import { authGuard } from './guards/auth.guard';
import { MapPageComponent } from './components/pages/map/map.component';
import { ReportFormComponent } from './components/reports/report-form/report-form.component';
import { ReportListComponent } from './components/reports/report-list/report-list.component';
import { AssociationsComponent } from './components/associations/associations.component';
import { MaraudeListComponent } from './components/maraude-list/maraude-list.component';

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

  // ===== ROUTES MARAUDES (Protégées) =====
  {
    path: 'dashboard/add-maraude',
    component: CreateMaraudeComponent,
    title: 'Nouvelle Maraude - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent créer des maraudes
  },
  {
    path: 'dashboard/associations',
    component: AssociationsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/maraudes',
    component: MaraudeListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/edit-maraude/:id',
    component: CreateMaraudeComponent,
    title: 'Modifier Maraude - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent modifier des maraudes
  },

  // ===== ROUTES RAPPORTS (Protégées) =====
  {
    path: 'reports',
    component: ReportListComponent,
    title: 'Comptes-rendus - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent voir les rapports
  },

  {
    path: 'reports/create',
    component: ReportFormComponent,
    title: 'Nouveau Rapport - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent créer des rapports
  },
  {
    path: 'reports/:id/edit',
    component: ReportFormComponent,
    title: 'Modifier Rapport - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent modifier des rapports
  },
  {
    path: 'reports/:id',
    component: ReportFormComponent,
    title: 'Voir Rapport - Mapraude',
    canActivate: [authGuard]  // ← Protégé : seules les associations connectées peuvent voir des rapports
  },

  // ===== FALLBACK =====
  {
    path: '**',
    redirectTo: '/map'
  }
];
