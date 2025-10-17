import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Association, AssociationCreateUpdate } from '../../models/association.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-associations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './associations.component.html',
  styleUrls: ['./associations.component.css']
})
export class AssociationsComponent implements OnInit {
  associations: Association[] = [];
  filteredAssociations: Association[] = [];
  loading = true;
  isAdmin = false;

  // Filtres
  filterActive: 'all' | 'true' | 'false' = 'all';
  searchQuery = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalAssociations = 0;

  // Modal
  showModal = false;
  editingAssociation: Association | null = null;

  // Formulaire - utilisez AssociationCreateUpdate au lieu de Partial<Association>
  formData: AssociationCreateUpdate = {
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    isActive: true
  };

  formErrors: { [key: string]: string } = {};
  submitError = '';

  constructor(
    private associationService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';

    if (!this.isAdmin) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAssociations();
  }

  async loadAssociations() {
    this.loading = true;
    try {
      const response = await firstValueFrom(
        this.associationService.getAssociations({
          page: this.currentPage,
          limit: this.pageSize,
          active: this.filterActive
        })
      );

      this.associations = response.associations;
      this.filteredAssociations = [...this.associations];
      this.totalAssociations = response.pagination.total;
      this.totalPages = response.pagination.pages;

      this.applyFilters();
    } catch (error: any) {
      console.error('Erreur chargement associations:', error);
      alert('Erreur lors du chargement des associations');
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.associations];

    // Filtre de recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.address?.toLowerCase().includes(query)
      );
    }

    this.filteredAssociations = filtered;
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadAssociations();
  }

  onSearchChange() {
    this.applyFilters();
  }

  // ===== MODAL =====
  openCreateModal() {
    this.editingAssociation = null;
    this.formData = {
      name: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      isActive: true
    };
    this.formErrors = {};
    this.submitError = '';
    this.showModal = true;
  }

  openEditModal(association: Association) {
    this.editingAssociation = association;
    // Copier seulement les champs modifiables
    this.formData = {
      name: association.name,
      description: association.description,
      email: association.email,
      phone: association.phone,
      address: association.address,
      website: association.website,
      isActive: association.isActive
    };
    this.formErrors = {};
    this.submitError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingAssociation = null;
    this.formData = {
      name: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      isActive: true
    };
    this.formErrors = {};
    this.submitError = '';
  }

  // ===== VALIDATION =====
 validateForm(): boolean {
  this.formErrors = {};
  let isValid = true;

  // Name (requis)
  if (!this.formData.name || this.formData.name.trim().length < 2) {
    this.formErrors['name'] = 'Le nom doit contenir au moins 2 caractères';
    isValid = false;
  }

  // Email (requis)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!this.formData.email || !emailRegex.test(this.formData.email)) {
    this.formErrors['email'] = 'Email invalide';
    isValid = false;
  }

  // Phone (optionnel mais si rempli, doit être valide)
  if (this.formData.phone && this.formData.phone.trim() !== '') {
    const cleanPhone = this.formData.phone.replace(/\s/g, '');
    if (cleanPhone.length < 10) {
      this.formErrors['phone'] = 'Le téléphone doit contenir au moins 10 chiffres';
      isValid = false;
    }
  }

  // Website (optionnel mais si rempli, doit être valide)
  if (this.formData.website && this.formData.website.trim() !== '') {
    const urlRegex = /^https?:\/\/.+\..+/i;
    if (!urlRegex.test(this.formData.website)) {
      this.formErrors['website'] = 'URL invalide (doit commencer par http:// ou https://)';
      isValid = false;
    }
  }

  console.log('🔍 Validation:', {
    isValid,
    errors: this.formErrors,
    data: this.formData
  });

  return isValid;
}

async submitForm() {
  if (!this.validateForm()) {
    return;
  }

  this.submitError = '';

  try {
    // ✅ Nettoyer les données avant envoi
    const cleanedData = {
      name: this.formData.name.trim(),
      description: this.formData.description?.trim() || '',
      email: this.formData.email.trim().toLowerCase(),
      phone: this.formData.phone?.trim() || '',
      address: this.formData.address?.trim() || '',
      website: this.formData.website?.trim() || ''
    };

    console.log('📤 Envoi formulaire nettoyé:', cleanedData);

    if (this.editingAssociation) {
      await firstValueFrom(
        this.associationService.updateAssociation(
          this.editingAssociation.id,
          cleanedData
        )
      );
      alert('Association modifiée avec succès');
    } else {
      const response = await firstValueFrom(
        this.associationService.createAssociation(cleanedData)
      );
      console.log('✅ Association créée:', response);
      alert('Association créée avec succès');
    }

    this.closeModal();
    this.loadAssociations();
  } catch (error: any) {
    console.error('❌ Erreur soumission complète:', error);
    console.error('❌ Error response:', error.error);

    // Gestion des erreurs de validation
    if (error.status === 400 || error.status === 409) {
      if (error.error?.details) {
        this.formErrors = error.error.details;
        this.submitError = error.error.message || 'Erreur de validation';
      } else {
        this.submitError = error.error?.message || 'Données invalides';
      }
    } else {
      this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
    }
  }
}


  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ===== SUBMIT =====
  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.submitError = '';

    try {
      if (this.editingAssociation) {
        // Mise à jour - utiliser Partial<AssociationCreateUpdate>
        const updateData: Partial<AssociationCreateUpdate> = {
          name: this.formData.name,
          description: this.formData.description,
          email: this.formData.email,
          phone: this.formData.phone,
          address: this.formData.address,
          website: this.formData.website,
          isActive: this.formData.isActive
        };

        await firstValueFrom(
          this.associationService.updateAssociation(
            this.editingAssociation.id,
            updateData
          )
        );
        alert('Association mise à jour avec succès');
      } else {
        // Création - utiliser AssociationCreateUpdate
        await firstValueFrom(
          this.associationService.createAssociation(this.formData)
        );
        alert('Association créée avec succès');
      }

      this.closeModal();
      this.loadAssociations();
    } catch (error: any) {
      console.error('Erreur:', error);
      this.submitError = error.error?.error || 'Une erreur est survenue';
    }
  }

  // ===== ACTIONS =====
  async toggleActiveStatus(association: Association) {
    if (!confirm(`Voulez-vous ${association.isActive ? 'désactiver' : 'activer'} cette association ?`)) {
      return;
    }

    try {
      await firstValueFrom(
        this.associationService.updateAssociation(association.id, {
          isActive: !association.isActive
        })
      );
      this.loadAssociations();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification du statut');
    }
  }

  viewDetails(associationId: string) {
    this.router.navigate(['/dashboard/associations', associationId]);
  }

  // ===== PAGINATION =====
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAssociations();
    }
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // ===== HELPERS =====
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
