import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { MaraudeAction } from '../../models/maraude.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-maraude-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maraude-list.component.html',
  styleUrls: ['./maraude-list.component.css']
})
export class MaraudeListComponent implements OnInit {
  maraudes: MaraudeAction[] = [];
  filteredMaraudes: MaraudeAction[] = [];
  currentUser: User | null = null;
  isAdmin = false;
  loading = true;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'date-desc';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'admin';
    await this.loadMaraudes();
  }

  async loadMaraudes() {
    try {
      this.loading = true;

      const response = await firstValueFrom(
        this.apiService.getMaraudes()
      );

      this.maraudes = response?.actions || [];
      this.applyFilters();

      console.log('✅ Maraudes loaded:', this.maraudes.length);
    } catch (error) {
      console.error('❌ Error loading maraudes:', error);
      this.maraudes = [];
      this.filteredMaraudes = [];
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.maraudes];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.title?.toLowerCase().includes(term) ||
        m.address?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term)
      );
    }

    // Status filter (utilisez les vrais statuts du modèle)
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === this.statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date-desc':
          const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
          const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
          return dateB - dateA;

        case 'date-asc':
          const dateA2 = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
          const dateB2 = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
          return dateA2 - dateB2;

        case 'title':
          return (a.title || '').localeCompare(b.title || '');

        case 'beneficiaries':
          return (b.beneficiariesHelped || 0) - (a.beneficiariesHelped || 0);

        default:
          return 0;
      }
    });

    this.filteredMaraudes = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  navigateToMaraude(maraudeId: string) {
    console.log(maraudeId);

    this.router.navigate(['/dashboard/edit-maraude', maraudeId]);
  }

  navigateToAddMaraude() {
    this.router.navigate(['/dashboard/add-maraude']);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'planned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'planned': 'Planifiée',
      'in_progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return texts[status] || status;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'Date non définie';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  formatTime(timeString: string | undefined): string {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  }

}
