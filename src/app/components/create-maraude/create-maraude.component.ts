import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { MaraudeAction } from '../../models/maraude.model';

// Waypoint interface
interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  order: number;
}

@Component({
  selector: 'app-create-maraude',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-maraude.component.html',
  styleUrls: ['./create-maraude.component.css']
})
export class CreateMaraudeComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  currentUser: User | null = null;
  isEditing = false;
  maraudeId: string | null = null;
  loading = false;
  saving = false;
  deleting = false;
  error = '';

  // Map and waypoint management
  map: any = null;
  markers: any[] = [];
  routePolyline: any = null;
  isMapReady = false;
  isSettingStartPoint = false; // NEW: Mode for setting start point

  // Form data with waypoints support
  maraudeData = {
    title: '',
    description: '',
    startLatitude: 44.82567400, // Default to center of France
    startLongitude: -0.55670800,
    startAddress: '',
    waypoints: [] as Waypoint[],
    estimatedDistance: 0,
    estimatedDuration: 0,
    isRecurring: true,
    dayOfWeek: 1,
    scheduledDate: '',
    startTime: '',
    endTime: '',
    participantsCount: 0,
    notes: ''
  };

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

    // Set up global functions for popup actions
    (window as any).removeWaypointFromMap = (waypointId: string) => {
      this.removeWaypoint(waypointId);
    };

    (window as any).editStartPoint = () => {
      this.toggleStartPointMode();
    };

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.maraudeId = params['id'];
        this.loadMaraudeData();
      }
    });
  }

  ngAfterViewInit() {
    // Add a small delay to ensure the view is fully rendered
    setTimeout(() => {
      this.loadMap();
    }, 100);
  }

  async loadMap() {
    try {
      // Check if mapContainer is available
      if (!this.mapContainer || !this.mapContainer.nativeElement) {
        console.error('Map container not found');
        this.error = 'Erreur lors de l\'initialisation de la carte';
        return;
      }

      // Dynamically import Leaflet
      const L = await import('leaflet');

      // Initialize map
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [this.maraudeData.startLatitude, this.maraudeData.startLongitude],
        13
      );

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add click handler for adding waypoints or setting start point
      this.map.on('click', (e: any) => {
        if (this.isSettingStartPoint) {
          this.setStartPoint(e.latlng.lat, e.latlng.lng);
        } else {
          this.addWaypoint(e.latlng.lat, e.latlng.lng);
        }
      });

      this.isMapReady = true;

      // Update markers if we have data
      if (this.maraudeData.waypoints.length > 0 || this.isEditing) {
        this.updateMapMarkers();
        this.centerMapOnRoute();
      }

    } catch (error) {
      console.error('Error loading map:', error);
      this.error = 'Erreur lors du chargement de la carte';
    }
  }

  async loadMaraudeData() {
    if (!this.maraudeId) return;

    this.loading = true;
    try {
      const response = await firstValueFrom(this.apiService.getMaraude(this.maraudeId));
      const maraude = response.action;

      console.log('🔍 DEBUG - Loaded maraude data:', maraude);
      console.log('🔍 DEBUG - Waypoints:', maraude.waypoints);
      console.log('🔍 DEBUG - Start coords:', maraude.startLatitude, maraude.startLongitude);

      this.maraudeData = {
        title: maraude.title,
        description: maraude.description || '',
        startLatitude: maraude.startLatitude || 44.82567400,
        startLongitude: maraude.startLongitude || -0.55670800,
        startAddress: maraude.startAddress || '',
        waypoints: maraude.waypoints || [],
        estimatedDistance: maraude.estimatedDistance || 0,
        estimatedDuration: maraude.estimatedDuration || 0,
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

      console.log('🔍 DEBUG - Processed form data:', this.maraudeData);

      // Update map if it's ready
      if (this.isMapReady) {
        console.log('🔍 DEBUG - Updating map with loaded data');
        this.updateMapMarkers();
        this.centerMapOnRoute();
      }

    } catch (error) {
      console.error('Erreur lors du chargement de la maraude:', error);
      this.error = 'Erreur lors du chargement des données de la maraude';
    } finally {
      this.loading = false;
    }
  }

  // NEW: Set start point method
  async setStartPoint(lat: number, lng: number, address?: string) {
    this.maraudeData.startLatitude = lat;
    this.maraudeData.startLongitude = lng;

    // Reverse geocode to get address
    if (!address) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        if (data && data.display_name) {
          this.maraudeData.startAddress = data.display_name;
        }
      } catch (error) {
        console.error('Error reverse geocoding start point:', error);
        this.maraudeData.startAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } else {
      this.maraudeData.startAddress = address;
    }

    // Exit start point setting mode
    this.isSettingStartPoint = false;

    // Update map
    this.updateMapMarkers();
    this.calculateRoute();

    console.log('Point de départ défini:', { lat, lng, address: this.maraudeData.startAddress });
  }

  // NEW: Toggle start point setting mode
  toggleStartPointMode() {
    this.isSettingStartPoint = !this.isSettingStartPoint;
    console.log('Mode définition point de départ:', this.isSettingStartPoint ? 'ACTIVÉ' : 'DÉSACTIVÉ');
  }

  // Waypoint management methods
  addWaypoint(lat: number, lng: number, address?: string, name?: string) {
    const newWaypoint: Waypoint = {
      id: Date.now().toString(), // Simple ID generation
      latitude: lat,
      longitude: lng,
      address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      name: name || `Point ${this.maraudeData.waypoints.length + 1}`,
      order: this.maraudeData.waypoints.length
    };

    this.maraudeData.waypoints.push(newWaypoint);
    this.updateMapMarkers();
    this.calculateRoute();

    // Reverse geocode to get address
    this.reverseGeocodeWaypoint(newWaypoint);
  }

  removeWaypoint(waypointId: string) {
    console.log('🔍 DEBUG - Removing waypoint:', waypointId);
    console.log('🔍 DEBUG - Before removal:', this.maraudeData.waypoints.length, 'waypoints');

    this.maraudeData.waypoints = this.maraudeData.waypoints.filter(w => w.id !== waypointId);

    console.log('🔍 DEBUG - After removal:', this.maraudeData.waypoints.length, 'waypoints');

    // Reorder remaining waypoints
    this.maraudeData.waypoints.forEach((w, index) => {
      w.order = index;
    });

    this.updateMapMarkers();
    this.calculateRoute();
  }

  moveWaypoint(waypointId: string, direction: 'up' | 'down') {
    const index = this.maraudeData.waypoints.findIndex(w => w.id === waypointId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.maraudeData.waypoints.length) return;

    // Swap waypoints
    [this.maraudeData.waypoints[index], this.maraudeData.waypoints[newIndex]] =
    [this.maraudeData.waypoints[newIndex], this.maraudeData.waypoints[index]];

    // Update order
    this.maraudeData.waypoints.forEach((w, i) => {
      w.order = i;
    });

    this.updateMapMarkers();
    this.calculateRoute();
  }

  async updateMapMarkers() {
    if (!this.map) {
      console.log('🔍 DEBUG - Map not ready, skipping marker update');
      return;
    }

    console.log('🔍 DEBUG - Updating map markers');
    console.log('🔍 DEBUG - Start position:', this.maraudeData.startLatitude, this.maraudeData.startLongitude);
    console.log('🔍 DEBUG - Waypoints to add:', this.maraudeData.waypoints);

    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Clear existing route
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    const L = await import('leaflet');

    // Add start point marker with conditional styling
    const startMarkerColor = this.isSettingStartPoint ? '#EF4444' : '#10B981'; // Red when setting, green when set
    const startMarker = L.marker([this.maraudeData.startLatitude, this.maraudeData.startLongitude], {
      icon: L.divIcon({
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; background: ${startMarkerColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 1; ${this.isSettingStartPoint ? 'animation: pulse 1.5s infinite;' : ''}"></div>
            <div style="position: relative; font-size: 20px; z-index: 2; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🏁</div>
          </div>
        `,
        className: 'custom-start-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
    }).addTo(this.map);

    const startPopupContent = this.isSettingStartPoint
      ? `
        <div class="marker-popup">
          <strong style="color: #EF4444;">Mode: Définition du point de départ</strong><br>
          Cliquez sur la carte pour définir le point de départ
        </div>
      `
      : `
        <div class="marker-popup">
          <strong>Point de départ</strong><br>
          ${this.maraudeData.startAddress || 'Adresse non définie'}
          <div class="popup-actions" style="margin-top: 8px;">
            <button onclick="window.editStartPoint()" class="popup-btn popup-btn-primary" style="background: #3B82F6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
              Modifier le point de départ
            </button>
          </div>
        </div>
      `;

    startMarker.bindPopup(startPopupContent);

    this.markers.push(startMarker);
    console.log('🔍 DEBUG - Added start marker');

    // Add waypoint markers with improved visibility
    this.maraudeData.waypoints.forEach((waypoint, index) => {
      console.log(`🔍 DEBUG - Adding waypoint ${index + 1}:`, waypoint);

      const marker = L.marker([waypoint.latitude, waypoint.longitude], {
        icon: L.divIcon({
          html: `
            <div style="position: relative; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 35px; height: 35px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 1;"></div>
              <div style="position: relative; color: white; font-size: 14px; font-weight: bold; z-index: 2; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">${index + 1}</div>
            </div>
          `,
          className: 'custom-waypoint-marker',
          iconSize: [35, 35],
          iconAnchor: [17.5, 17.5]
        })
      }).addTo(this.map);

      marker.bindPopup(`
        <div class="marker-popup">
          <strong>${waypoint.name}</strong><br>
          ${waypoint.address}<br>
          <div class="popup-actions">
            <button onclick="window.removeWaypointFromMap('${waypoint.id}')" class="popup-btn popup-btn-danger">
              Supprimer ce point
            </button>
          </div>
        </div>
      `);

      this.markers.push(marker);
    });

    console.log(`🔍 DEBUG - Added ${this.maraudeData.waypoints.length} waypoint markers`);

    // Draw route after markers are added
    if (this.maraudeData.waypoints.length > 0) {
      console.log('🔍 DEBUG - Drawing route');
      this.drawRoute();
    }
  }

  async calculateRoute() {
    if (this.maraudeData.waypoints.length === 0) {
      this.maraudeData.estimatedDistance = 0;
      this.maraudeData.estimatedDuration = 0;
      return;
    }

    try {
      // Simple distance calculation (you could integrate with routing service like OpenRouteService)
      let totalDistance = 0;
      let lastPoint = { lat: this.maraudeData.startLatitude, lng: this.maraudeData.startLongitude };

      for (const waypoint of this.maraudeData.waypoints) {
        const distance = this.calculateDistance(
          lastPoint.lat, lastPoint.lng,
          waypoint.latitude, waypoint.longitude
        );
        totalDistance += distance;
        lastPoint = { lat: waypoint.latitude, lng: waypoint.longitude };
      }

      this.maraudeData.estimatedDistance = Math.round(totalDistance * 100) / 100;
      this.maraudeData.estimatedDuration = Math.round(totalDistance * 12); // Rough estimate: 5 km/h walking speed

      // Draw route on map
      await this.drawRoute();

    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }

  async drawRoute() {
    if (!this.map || this.maraudeData.waypoints.length === 0) return;

    const L = await import('leaflet');

    // Create route coordinates with proper typing
    const routeCoords: [number, number][] = [
      [this.maraudeData.startLatitude, this.maraudeData.startLongitude],
      ...this.maraudeData.waypoints.map(w => [w.latitude, w.longitude] as [number, number])
    ];

    // Draw polyline
    this.routePolyline = L.polyline(routeCoords, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7
    }).addTo(this.map);
  }

  centerMapOnRoute() {
    if (!this.map) return;

    const allPoints: [number, number][] = [
      [this.maraudeData.startLatitude, this.maraudeData.startLongitude],
      ...this.maraudeData.waypoints.map(w => [w.latitude, w.longitude] as [number, number])
    ];

    if (allPoints.length > 1) {
      this.map.fitBounds(allPoints, { padding: [20, 20] });
    } else {
      this.map.setView([this.maraudeData.startLatitude, this.maraudeData.startLongitude], 13);
    }
  }

  // Utility methods
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async reverseGeocodeWaypoint(waypoint: Waypoint) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${waypoint.latitude}&lon=${waypoint.longitude}&format=json`
      );
      const data = await response.json();

      if (data && data.display_name) {
        waypoint.address = data.display_name;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }

  // FIXED: Submit method with proper waypoint serialization
  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      // Create a clean copy of waypoints to ensure proper serialization
      const cleanWaypoints = this.maraudeData.waypoints.map(wp => ({
        id: wp.id,
        latitude: wp.latitude,
        longitude: wp.longitude,
        address: wp.address || '',
        name: wp.name || '',
        order: wp.order
      }));

      const maraudePayload = {
        title: this.maraudeData.title,
        startLatitude: this.maraudeData.startLatitude,
        startLongitude: this.maraudeData.startLongitude,
        waypoints: cleanWaypoints,
        estimatedDistance: this.maraudeData.estimatedDistance,
        estimatedDuration: this.maraudeData.estimatedDuration,
        isRecurring: this.maraudeData.isRecurring,
        startTime: this.maraudeData.startTime,
        participantsCount: this.maraudeData.participantsCount,
        description: this.maraudeData.description.trim() === '' ? undefined : this.maraudeData.description,
        startAddress: this.maraudeData.startAddress.trim() === '' ? undefined : this.maraudeData.startAddress,
        notes: this.maraudeData.notes.trim() === '' ? undefined : this.maraudeData.notes,
        endTime: this.maraudeData.endTime.trim() === '' ? undefined : this.maraudeData.endTime,
        dayOfWeek: this.maraudeData.isRecurring ? this.maraudeData.dayOfWeek : undefined,
        scheduledDate: !this.maraudeData.isRecurring ? this.maraudeData.scheduledDate : undefined,
        // Backward compatibility
        latitude: this.maraudeData.startLatitude,
        longitude: this.maraudeData.startLongitude,
        address: this.maraudeData.startAddress
      };

      console.log('🔍 DEBUG - Payload being sent:', maraudePayload);
      console.log('🔍 DEBUG - Clean waypoints in payload:', cleanWaypoints);
      console.log('🔍 DEBUG - Current waypoints in form:', this.maraudeData.waypoints);

      if (this.isEditing && this.maraudeId) {
        const response = await firstValueFrom(this.apiService.updateMaraude(this.maraudeId, maraudePayload));
        console.log('🔍 DEBUG - Update response:', response);
      } else {
        const response = await firstValueFrom(this.apiService.createMaraude(maraudePayload));
        console.log('🔍 DEBUG - Create response:', response);
      }

      this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.error = error.error?.error || 'Erreur lors de la sauvegarde';
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

    return true;
  }

  // Other existing methods...
  onRecurringChange() {
    if (this.maraudeData.isRecurring) {
      this.maraudeData.scheduledDate = '';
      if (!this.maraudeData.dayOfWeek) {
        this.maraudeData.dayOfWeek = 1;
      }
    } else {
      this.maraudeData.dayOfWeek = 1;
    }
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.maraudeData.startLatitude = position.coords.latitude;
          this.maraudeData.startLongitude = position.coords.longitude;
          this.reverseGeocodeStart();
          if (this.isMapReady) {
            this.map.setView([this.maraudeData.startLatitude, this.maraudeData.startLongitude], 13);
            this.updateMapMarkers();
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible d\'obtenir votre position.');
        }
      );
    }
  }

  async reverseGeocodeStart() {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${this.maraudeData.startLatitude}&lon=${this.maraudeData.startLongitude}&format=json`
      );
      const data = await response.json();

      if (data && data.display_name) {
        this.maraudeData.startAddress = data.display_name;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.name : '';
  }

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
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      this.error = error.error?.error || 'Erreur lors de la suppression de la maraude';
    } finally {
      this.deleting = false;
    }
  }

  canDelete(): boolean {
    if (!this.isEditing || !this.currentUser) {
      return false;
    }
    return ['admin', 'coordinator'].includes(this.currentUser.role);
  }

  // TrackBy function for waypoints
  trackByWaypoint(index: number, waypoint: Waypoint): string {
    return waypoint.id;
  }
}
