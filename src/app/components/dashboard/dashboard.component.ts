import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
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
  stats = {
    totalMaraudes: 0,
    activeMaraudes: 0,
    completedMaraudes: 0,
    totalBeneficiaries: 0
  };
  loading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
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
    // Load maraudes for the user's association
    this.apiService.getMaraudes({
      associationId: this.currentUser?.associationId,
      limit: 100
    }).subscribe({
      next: (response) => {
        this.myMaraudes = response.actions;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.stats.totalMaraudes = this.myMaraudes.length;
    this.stats.activeMaraudes = this.myMaraudes.filter(m => m.status === 'planned' || m.status === 'in_progress').length;
    this.stats.completedMaraudes = this.myMaraudes.filter(m => m.status === 'completed').length;
    this.stats.totalBeneficiaries = this.myMaraudes.reduce((sum, m) => sum + (m.beneficiariesHelped || 0), 0);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToAddMaraude() {
    this.router.navigate(['/dashboard/add-maraude']);
  }

  navigateToEditMaraude(maraudeId: string) {
    this.router.navigate(['/dashboard/edit-maraude', maraudeId]);
  }

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
}
