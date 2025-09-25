import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ReportService } from '../../services/report.service';
import { User } from '../../models/user.model';
import { MaraudeAction } from '../../models/maraude.model';

interface DashboardStats {
  totalMaraudes: number;
  completedMaraudes: number;
  activeMaraudes: number;
  totalBeneficiaries: number;
  totalReports: number;
  validatedReports: number;
  pendingReports: number;
  draftReports: number;
  avgBeneficiariesPerReport: number;
  totalVolunteers: number;
}

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
  stats: DashboardStats = {
    totalMaraudes: 0,
    completedMaraudes: 0,
    activeMaraudes: 0,
    totalBeneficiaries: 0,
    totalReports: 0,
    validatedReports: 0,
    pendingReports: 0,
    draftReports: 0,
    avgBeneficiariesPerReport: 0,
    totalVolunteers: 0
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
    // Charger les données en parallèle
    Promise.all([
      this.loadStats(), // NOUVEAU : utilise l'endpoint dédié
      this.loadMaraudes(),
      this.loadReports()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      console.error('Erreur lors du chargement des données:', error);
      this.loading = false;
    });
  }

  // NOUVEAU : Charger les vraies statistiques depuis l'endpoint dédié
  private async loadStats() {
    try {
      const response = await firstValueFrom(
        this.apiService.getDashboardStats() // Nouvelle méthode à ajouter
      );
      this.stats = response?.stats || this.stats;
      console.log('Stats chargées:', this.stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      // Fallback sur l'ancien calcul si l'endpoint échoue
      this.calculateStatsFromMaraudesAndReports();
    }
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
        limit: 10
      }));
      this.recentReports = response?.reports || [];
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      this.recentReports = [];
    }
  }

  // BACKUP : Calcul local si l'endpoint stats n'est pas disponible
  private calculateStatsFromMaraudesAndReports() {
    console.log('Fallback: calcul des stats localement');

    // Stats maraudes (garde l'ancien calcul)
    this.stats.totalMaraudes = this.myMaraudes.length;
    this.stats.activeMaraudes = this.myMaraudes.filter(m =>
      m.status === 'planned' || m.status === 'in_progress'
    ).length;
    this.stats.completedMaraudes = this.myMaraudes.filter(m =>
      m.status === 'completed'
    ).length;

    // Stats rapports (calcul depuis les rapports chargés)
    this.stats.totalReports = this.recentReports.length;
    this.stats.totalBeneficiaries = this.recentReports.reduce((sum, report) =>
      sum + (report.beneficiariesCount || 0), 0
    );
    this.stats.totalVolunteers = this.recentReports.reduce((sum, report) =>
      sum + (report.volunteersCount || 0), 0
    );
    this.stats.validatedReports = this.recentReports.filter(r =>
      r.status === 'validated'
    ).length;
    this.stats.pendingReports = this.recentReports.filter(r =>
      r.status === 'submitted'
    ).length;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // ===== NAVIGATION =====
  navigateToAddMaraude() {
    this.router.navigate(['/dashboard/add-maraude']);
  }

  navigateToEditMaraude(maraudeId: string) {
    this.router.navigate(['/dashboard/edit-maraude', maraudeId]);
  }

  navigateToReports() {
    this.router.navigate(['/reports']);
  }

  navigateToAddReport() {
    this.router.navigate(['/reports/create']);
  }

  navigateToEditReport(reportId: string) {
    this.router.navigate(['/reports/edit', reportId]);
  }

  navigateToViewReport(reportId: string) {
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
