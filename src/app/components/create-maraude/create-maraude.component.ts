import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { MaraudeAction } from '../../models/maraude.model';

@Component({
  selector: 'app-create-maraude',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-maraude.component.html',
  styleUrls: ['./create-maraude.component.css']
})
export class CreateMaraudeComponent implements OnInit {
  currentUser: User | null = null;
  isEditing = false;
  maraudeId: string | null = null;
  loading = false;
  saving = false;
  error = '';

  // Form data
  maraudeData: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    isRecurring: boolean;
    dayOfWeek: number;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    participantsCount: number;
    notes: string;
  } = {
    title: '',
    description: '',
    latitude: 0,
    longitude: 0,
    address: '',
    isRecurring: true,
    dayOfWeek: 1, // Lundi par défaut
    scheduledDate: '',
    startTime: '',
    endTime: '',
    participantsCount: 0,
    notes: ''
  };

  // Options pour les jours de la semaine
  daysOfWeek = [
    { value: 1, name: 'Lundi', short: 'Lun' },
    { value: 2, name: 'Mardi', short: 'Mar' },
    { value: 3, name: 'Mercredi', short: 'Mer' },
    { value: 4, name: 'Jeudi', short: 'Jeu' },
    { value: 5, name: 'Vendredi', short: 'Ven' },
    { value: 6, name: 'Samedi', short: 'Sam' },
    { value: 7, name: 'Dimanche', short: 'Dim' }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Vérifier si c'est une édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.maraudeId = params['id'];
        this.loadMaraudeData();
      }
    });

    // Initialiser la géolocalisation par défaut (centre de la France)
    this.maraudeData.latitude = 46.603354;
    this.maraudeData.longitude = 1.888334;
  }

  async loadMaraudeData() {
    if (!this.maraudeId) return;

    this.loading = true;
    try {
      const response = await firstValueFrom(this.apiService.getMaraude(this.maraudeId));
      const maraude = response.action;

      this.maraudeData = {
        title: maraude.title,
        description: maraude.description || '',
        latitude: typeof maraude.latitude === 'string' ? parseFloat(maraude.latitude) : maraude.latitude,
        longitude: typeof maraude.longitude === 'string' ? parseFloat(maraude.longitude) : maraude.longitude,
        address: maraude.address || '',
        isRecurring: maraude.isRecurring,
        dayOfWeek: maraude.dayOfWeek || 1,
        scheduledDate: maraude.scheduledDate ?
          (maraude.scheduledDate instanceof Date ?
            maraude.scheduledDate.toISOString().split('T')[0] :
            maraude.scheduledDate) : '',
        startTime: maraude.startTime,
        endTime: maraude.endTime || '',
        participantsCount: maraude.participantsCount || 0,
        notes: maraude.notes || ''
      };

    } catch (error) {
      console.error('Erreur lors du chargement de la maraude:', error);
      this.error = 'Erreur lors du chargement des données de la maraude';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      const maraudePayload = {
        title: this.maraudeData.title,
        latitude: this.maraudeData.latitude,
        longitude: this.maraudeData.longitude,
        isRecurring: this.maraudeData.isRecurring,
        startTime: this.maraudeData.startTime,
        participantsCount: this.maraudeData.participantsCount,
        // Convert null to undefined for optional fields to match API types
        description: this.maraudeData.description.trim() === '' ? undefined : this.maraudeData.description,
        address: this.maraudeData.address.trim() === '' ? undefined : this.maraudeData.address,
        notes: this.maraudeData.notes.trim() === '' ? undefined : this.maraudeData.notes,
        endTime: this.maraudeData.endTime.trim() === '' ? undefined : this.maraudeData.endTime,
        // Conditional fields
        dayOfWeek: this.maraudeData.isRecurring ? this.maraudeData.dayOfWeek : undefined,
        scheduledDate: !this.maraudeData.isRecurring ? this.maraudeData.scheduledDate : undefined
      };

      // DEBUG: Log the payload and auth state
      console.log('=== DETAILED PAYLOAD DEBUG ===');
      console.log('Raw form data:', this.maraudeData);
      console.log('Final payload:', maraudePayload);
      console.log('Payload keys:', Object.keys(maraudePayload));
      console.log('Title:', maraudePayload.title);
      console.log('StartTime:', maraudePayload.startTime);
      console.log('IsRecurring:', maraudePayload.isRecurring);
      console.log('DayOfWeek:', maraudePayload.dayOfWeek);
      console.log('ScheduledDate:', maraudePayload.scheduledDate);
      console.log('Latitude:', maraudePayload.latitude, typeof maraudePayload.latitude);
      console.log('Longitude:', maraudePayload.longitude, typeof maraudePayload.longitude);
      console.log('================================');

      if (this.isEditing && this.maraudeId) {
        const result = await firstValueFrom(this.apiService.updateMaraude(this.maraudeId, maraudePayload));
        console.log('Résultat update:', result);
      } else {
        const result = await firstValueFrom(this.apiService.createMaraude(maraudePayload));
        console.log('Résultat create:', result);
      }

      // Rediriger vers le dashboard
      this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Erreur complète:', error);
      console.error('Statut:', error.status);
      console.error('Message:', error.message);
      console.error('Corps de l\'erreur:', error.error);

      this.error = error.error?.error || `Erreur ${error.status}: ${error.message}`;
    } finally {
      this.saving = false;
    }
  }

  validateForm(): boolean {
    this.error = '';

    if (!this.maraudeData.title.trim()) {
      this.error = 'Le titre est requis';
      return false;
    }

    if (!this.maraudeData.startTime) {
      this.error = 'L\'heure de début est requise';
      return false;
    }

    if (this.maraudeData.isRecurring && !this.maraudeData.dayOfWeek) {
      this.error = 'Le jour de la semaine est requis pour les maraudes récurrentes';
      return false;
    }

    if (!this.maraudeData.isRecurring && !this.maraudeData.scheduledDate) {
      this.error = 'La date est requise pour les maraudes ponctuelles';
      return false;
    }

    if (this.maraudeData.latitude < -90 || this.maraudeData.latitude > 90) {
      this.error = 'Latitude invalide';
      return false;
    }

    if (this.maraudeData.longitude < -180 || this.maraudeData.longitude > 180) {
      this.error = 'Longitude invalide';
      return false;
    }

    return true;
  }

  onRecurringChange() {
    // Reset les champs conditionnels quand on change le type
    if (this.maraudeData.isRecurring) {
      this.maraudeData.scheduledDate = '';
      if (!this.maraudeData.dayOfWeek) {
        this.maraudeData.dayOfWeek = 1; // Lundi par défaut
      }
    } else {
      this.maraudeData.dayOfWeek = 1;
    }
  }

  // Géolocalisation
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.maraudeData.latitude = position.coords.latitude;
          this.maraudeData.longitude = position.coords.longitude;
          this.reverseGeocode();
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible d\'obtenir votre position. Veuillez saisir manuellement les coordonnées.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  }

  // Geocoding inverse pour obtenir l'adresse
  async reverseGeocode() {
    try {
      // Utilisation de l'API Nominatim d'OpenStreetMap (gratuite)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${this.maraudeData.latitude}&lon=${this.maraudeData.longitude}&format=json`
      );
      const data = await response.json();

      if (data && data.display_name) {
        this.maraudeData.address = data.display_name;
      }
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.name : '';
  }

  // Add delete functionality
  deleting = false;

  async deleteMaraude() {
    if (!this.isEditing || !this.maraudeId) {
      return;
    }

    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer la maraude "${this.maraudeData.title}" ?\n\nCette action est irréversible.`);

    if (!confirmed) {
      return;
    }

    this.deleting = true;
    this.error = '';

    try {
      await firstValueFrom(this.apiService.deleteMaraude(this.maraudeId));

      console.log('Maraude supprimée avec succès');

      // Redirect to dashboard after successful deletion
      this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      this.error = error.error?.error || 'Erreur lors de la suppression de la maraude';
    } finally {
      this.deleting = false;
    }
  }

  // Check if current user can delete this maraude
  canDelete(): boolean {
    if (!this.isEditing || !this.currentUser) {
      return false;
    }

    // User can delete if they are admin, coordinator, or creator of the maraude
    return ['admin', 'coordinator'].includes(this.currentUser.role);
  }
}
