import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-list.component.html',
  styles: []
})
export class ReportListComponent implements OnInit {
  reports: any[] = [];
  loading = false;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;
    this.reportService.getReports().subscribe({
      next: (response) => {
        this.reports = response.reports || [];
        console.log('Reports loaded:', this.reports);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement rapports:', error);
        this.loading = false;
      }
    });
  }

  // Actions
  viewReport(report: any) {
    console.log('Voir rapport:', report);
    this.router.navigate(['/reports', report.id]);
  }

  editReport(report: any) {
    console.log('Modifier rapport:', report);
    this.router.navigate(['/reports', report.id, 'edit']);
  }

  validateReport(report: any) {
    if (confirm('Valider ce rapport définitivement ?')) {
      this.reportService.validateReport(report.id).subscribe({
        next: () => {
          console.log('Rapport validé');
          alert('Rapport validé avec succès !');
          this.loadReports(); // Recharger
        },
        error: (error) => {
          console.error('Erreur validation:', error);
          alert('Erreur lors de la validation du rapport');
        }
      });
    }
  }

  deleteReport(report: any) {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ce rapport ?\n\nRapport du ${this.formatDate(report.reportDate)}\nStatut: ${this.getStatusLabel(report.status)}\n\nCette action est irréversible.`;

    if (confirm(confirmMessage)) {
      this.reportService.deleteReport(report.id).subscribe({
        next: () => {
          console.log('Rapport supprimé');
          alert('Rapport supprimé avec succès');
          this.loadReports(); // Recharger
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
          alert('Erreur lors de la suppression du rapport');
        }
      });
    }
  }

  // Permission helpers
  canEdit(report: any): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Admin can edit any report
    if (user.role === 'admin') return true;

    // Coordinator can edit reports from their association
    if (user.role === 'coordinator' && report.creator?.associationId === user.associationId) return true;

    // Creator can edit their own reports (submitted or draft)
    if (report.creator?.id === user.id && (report.status === 'submitted' || report.status === 'draft')) return true;

    return false;
  }

  canDelete(report: any): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Admin can delete any report
    if (user.role === 'admin') return true;

    // Coordinator can delete reports from their association (not validated)
    if (user.role === 'coordinator' && report.status !== 'validated' && report.creator?.associationId === user.associationId) return true;

    // Creator can delete their own reports (not validated)
    if (report.creator?.id === user.id && report.status !== 'validated') return true;

    return false;
  }

  canValidate(report: any): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Only coordinators and admins can validate
    if (!['coordinator', 'admin'].includes(user.role)) return false;

    // Only submitted reports can be validated
    if (report.status !== 'submitted') return false;

    // Admin can validate any submitted report
    if (user.role === 'admin') return true;

    // Coordinator can validate reports from their association
    return report.creator?.associationId === user.associationId;
  }

  // Helpers
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'draft': 'Brouillon',
      'submitted': 'Soumis',
      'validated': 'Validé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'validated': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5); // Remove seconds
  }
}
