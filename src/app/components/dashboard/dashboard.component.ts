import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ReportService } from '../../services/report.service';
import { User } from '../../models/user.model';
import { MaraudeAction } from '../../models/maraude.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  myMaraudes: MaraudeAction[] = [];
  recentReports: any[] = [];
  stats = {
    totalMaraudes: 0,
    activeMaraudes: 0,
    completedMaraudes: 0,
    totalBeneficiaries: 0,
    totalReports: 0,
    pendingReports: 0
  };
  loading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
  }

  loadDashboardData() {
    // Charger les maraudes et rapports en parallèle
    Promise.all([
      this.loadMaraudes(),
      this.loadReports()
    ]).then(() => {
      this.calculateStats();
      this.loading = false;
    }).catch(error => {
      console.error('Erreur lors du chargement des données:', error);
      this.loading = false;
    });
  }

  private async loadMaraudes() {
    try {
      const response = await firstValueFrom(this.apiService.getMaraudes({
        associationId: this.currentUser?.associationId,
        limit: 100
      }));
      this.myMaraudes = response?.actions || [];
    } catch (error) {
      console.error('Erreur chargement maraudes:', error);
      this.myMaraudes = [];
    }
  }

  private async loadReports() {
    try {
      const response = await firstValueFrom(this.reportService.getReports({
        limit: 10,
        // Le backend filtre automatiquement par association selon l'utilisateur connecté
      }));
      this.recentReports = response?.reports || [];
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      this.recentReports = [];
    }
  }

  calculateStats() {
    // Stats maraudes
    this.stats.totalMaraudes = this.myMaraudes.length;
    this.stats.activeMaraudes = this.myMaraudes.filter(m =>
      m.status === 'planned' || m.status === 'in_progress'
    ).length;
    this.stats.completedMaraudes = this.myMaraudes.filter(m =>
      m.status === 'completed'
    ).length;
    this.stats.totalBeneficiaries = this.myMaraudes.reduce((sum, m) =>
      sum + (m.beneficiariesHelped || 0), 0
    );

    // Stats rapports
    this.stats.totalReports = this.recentReports.length;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // ===== NAVIGATION MARAUDES =====
  navigateToAddMaraude() {
    this.router.navigate(['/dashboard/add-maraude']);
  }

  navigateToEditMaraude(maraudeId: string) {
    this.router.navigate(['/dashboard/edit-maraude', maraudeId]);
  }

  // ===== NAVIGATION RAPPORTS (MISE À JOUR) =====
  navigateToReports() {
    this.router.navigate(['/reports']); // Liste des rapports
  }

  navigateToAddReport() {
    this.router.navigate(['/reports/create']); // ← Changé de '/reports/new' vers '/reports/create'
  }

  navigateToEditReport(reportId: string) {
    this.router.navigate(['/reports/edit', reportId]);
  }

  navigateToViewReport(reportId: string) {
    // TODO: Créer une route pour voir un rapport
    this.router.navigate(['/reports', reportId]);
  }

  // ===== HELPERS =====
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      planned: 'Planifiée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getReportStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      draft: 'Brouillon',
      submitted: 'Soumis',
      validated: 'Validé'
    };
    return statusMap[status] || status;
  }

  getReportStatusClass(status: string): string {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  }
}
