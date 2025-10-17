// src/app/components/map-view/map-view.component.ts - Updated with waypoint paths
import { Component, OnInit, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { MaraudeAction } from '../../models/maraude.model';
import { Merchant } from '../../models/merchant.model.';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() maraudes: MaraudeAction[] = [];
  @Input() merchants: Merchant[] = [];
  @Input() filters: any = {};

  private map!: L.Map;
  private maraudeMarkers: L.LayerGroup = new L.LayerGroup();
  private merchantMarkers: L.LayerGroup = new L.LayerGroup();
  private maraudePaths: L.LayerGroup = new L.LayerGroup(); // NEW: For paths and coverage areas

  // Bordeaux center coordinates
  private readonly defaultCenter: [number, number] = [44.8378, -0.5792];
  private readonly defaultZoom = 12;

  ngOnInit() {
    this.fixLeafletIcons();
  }

  ngAfterViewInit() {
    this.initializeMap();
    this.updateMarkers();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIcons() {
    // Fix for Leaflet default markers not showing
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });
  }

  private initializeMap() {
    // Initialize the map
    this.map = L.map('map', {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      zoomControl: false
    });

    // Add custom zoom control in bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    // Add modern tile layer (CartoDB Positron - clean and minimal)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // Add layer groups to map (paths first so they appear under markers)
    this.maraudePaths.addTo(this.map);
    this.maraudeMarkers.addTo(this.map);
    this.merchantMarkers.addTo(this.map);
  }

  private updateMarkers() {
    this.clearMarkers();

    if (this.filters.showMaraudes) {
      this.addMaraudeMarkers();
      this.addMaraudePaths(); // NEW: Add paths and coverage areas
    }

    if (this.filters.showMerchants) {
      this.addMerchantMarkers();
    }
  }

  private clearMarkers() {
    this.maraudeMarkers.clearLayers();
    this.merchantMarkers.clearLayers();
    this.maraudePaths.clearLayers(); // NEW: Clear paths
  }

  // NEW: Add maraude paths and coverage areas
  private addMaraudePaths() {
    this.maraudes.forEach(maraude => {
      if (maraude.waypoints && maraude.waypoints.length > 0) {
        this.addMaraudePath(maraude);
      }
    });
  }

  private addMaraudePath(maraude: MaraudeAction) {
    const pathColor = this.generatePathColor(maraude.id);
    const points: [number, number][] = [];

    // Start with the starting point
    const startPoint: [number, number] = [Number(maraude.startLatitude), Number(maraude.startLongitude)];
    points.push(startPoint);

    // Add all waypoints
    maraude.waypoints?.forEach(waypoint => {
      points.push([Number(waypoint.latitude), Number(waypoint.longitude)]);
    });

    // Create route segments with buffer zones
    if (points.length > 1) {
      this.createRouteWithBuffer(points, pathColor, maraude.title, maraude);
    }
  }

  private createRouteWithBuffer(points: [number, number][], color: string, title: string, maraude: MaraudeAction) {
    const shouldBlink = maraude.status === 'in_progress' || maraude.isHappeningToday;

    // Create buffer zones around each route segment
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];

      // Create a buffer polygon around each segment
      const bufferPolygon = this.createSegmentBuffer(startPoint, endPoint, 150); // 150m buffer

      const buffer = L.polygon(bufferPolygon, {
        color: color,
        fillColor: color,
        fillOpacity: shouldBlink ? 0.12 : 0.08,
        opacity: shouldBlink ? 0.4 : 0.25,
        weight: 1,
        className: shouldBlink ? 'blinking-path' : ''
      });

      // Add popup for buffer area
      buffer.bindPopup(`
        <div class="popup-content">
          <h3 class="popup-title">Zone de couverture</h3>
          <p class="popup-description">
            <strong>${title}</strong><br>
            Segment ${i + 1} sur ${points.length - 1}<br>
            Zone d'intervention approximative
            ${shouldBlink ? '<br><strong>🔴 En cours ou aujourd\'hui</strong>' : ''}
          </p>
        </div>
      `);

      this.maraudePaths.addLayer(buffer);
    }

    // Create the main dashed route line on top
    const mainRoute = L.polyline(points, {
      color: color,
      weight: shouldBlink ? 4 : 3,
      opacity: shouldBlink ? 1 : 0.8,
      dashArray: '10, 5',
      className: shouldBlink ? 'blinking-path' : ''
    });

    // Add popup for the route line
    mainRoute.bindPopup(`
      <div class="popup-content">
        <h3 class="popup-title">Parcours de maraude</h3>
        <p class="popup-description">
          <strong>${title}</strong><br>
          ${points.length} points sur le parcours
          ${shouldBlink ? '<br><strong>🔴 En cours ou aujourd\'hui</strong>' : ''}
        </p>
      </div>
    `);

    this.maraudePaths.addLayer(mainRoute);
  }

  private createSegmentBuffer(start: [number, number], end: [number, number], bufferMeters: number): [number, number][] {
    // Calculate the perpendicular offset for the buffer
    const earthRadius = 6371000; // meters
    const lat1 = start[0] * Math.PI / 180;
    const lat2 = end[0] * Math.PI / 180;
    const deltaLat = (end[0] - start[0]) * Math.PI / 180;
    const deltaLng = (end[1] - start[1]) * Math.PI / 180;

    // Calculate bearing between points
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    const bearing = Math.atan2(y, x);

    // Calculate perpendicular bearing (90 degrees offset)
    const perpBearing1 = bearing + Math.PI / 2;
    const perpBearing2 = bearing - Math.PI / 2;

    // Convert buffer distance to degrees (approximate)
    const bufferDegrees = bufferMeters / earthRadius * 180 / Math.PI;

    // Calculate offset points
    const offset1Lat = bufferDegrees * Math.cos(perpBearing1);
    const offset1Lng = bufferDegrees * Math.sin(perpBearing1) / Math.cos(lat1);
    const offset2Lat = bufferDegrees * Math.cos(perpBearing2);
    const offset2Lng = bufferDegrees * Math.sin(perpBearing2) / Math.cos(lat1);

    // Create buffer polygon points
    return [
      [start[0] + offset1Lat, start[1] + offset1Lng],
      [end[0] + offset1Lat, end[1] + offset1Lng],
      [end[0] + offset2Lat, end[1] + offset2Lng],
      [start[0] + offset2Lat, start[1] + offset2Lng]
    ];
  }

  private generatePathColor(maraudeId: string): string {
    // Generate a consistent color based on maraude ID
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6366F1'  // Indigo
    ];

    // Simple hash function to convert ID to color index
    let hash = 0;
    for (let i = 0; i < maraudeId.length; i++) {
      const char = maraudeId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  }

  // src/app/components/map-view/map-view.component.ts - SEULEMENT les waypoints modifiés
private addMaraudeMarkers() {
  this.maraudes.forEach(maraude => {
    const pathColor = this.generatePathColor(maraude.id);
    const icon = this.createMaraudeStartIcon(pathColor);

    // Main marker for start position
    const marker = L.marker([Number(maraude.startLatitude), Number(maraude.startLongitude)], { icon })
      .bindPopup(this.createMaraudePopup(maraude));

    this.maraudeMarkers.addLayer(marker);

    // Add waypoint markers if they exist
    if (maraude.waypoints && maraude.waypoints.length > 0) {
      maraude.waypoints.forEach((waypoint, index) => {
        const waypointIcon = this.createWaypointIcon(index + 1, pathColor);

        const waypointMarker = L.marker([Number(waypoint.latitude), Number(waypoint.longitude)], {
          icon: waypointIcon
        }).bindPopup(this.createWaypointPopup(maraude, waypoint, index)); // ← SEULE modification ici

        this.maraudeMarkers.addLayer(waypointMarker);
      });
    }
  });
}

// Nouvelle méthode pour les popups des waypoints
private createWaypointPopup(maraude: MaraudeAction, waypoint: any, index: number): string {
  const statusText = this.getStatusText(maraude.status);
  const statusColor = this.getMaraudeColor(maraude.status);

  return `
    <div class="popup-content">
      <h3 class="popup-title">${maraude.title} - Point ${index + 1}</h3>
      <div class="popup-status" style="background-color: ${statusColor}">
        ${statusText}
      </div>
      <div class="popup-body">
        <p class="popup-description">${waypoint.description || maraude.description || 'Aucune description disponible'}</p>
        <div class="popup-details">
          <div class="popup-detail">
            <strong>📍</strong> ${waypoint.address || 'Adresse non définie'}
          </div>
          <div class="popup-detail">
            <strong>🎯</strong> Point ${index + 1} sur ${maraude.waypoints?.length || 0}
          </div>
          ${maraude.isHappeningToday ? `
            <div class="popup-detail">
              <strong>📅</strong> Aujourd'hui à ${maraude.startTime}
            </div>
          ` : maraude.scheduledDate ? `
            <div class="popup-detail">
              <strong>📅</strong> ${new Date(maraude.scheduledDate).toLocaleDateString('fr-FR')} à ${maraude.startTime}
            </div>
          ` : ''}
          ${maraude.endTime ? `
            <div class="popup-detail">
              <strong>⏰</strong> Fin prévue: ${maraude.endTime}
            </div>
          ` : ''}
          <div class="popup-detail">
            <strong>👥</strong> ${maraude.participantsCount} bénévoles
          </div>
          ${maraude.beneficiariesHelped > 0 ? `
            <div class="popup-detail">
              <strong>❤️</strong> ${maraude.beneficiariesHelped} personnes aidées
            </div>
          ` : ''}
          <div class="popup-detail">
            <strong>🏢</strong> ${maraude.association?.name || 'Association'}
          </div>
        </div>
      </div>
    </div>
  `;
}


  private createMaraudeStartIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-maraude-start-marker',
      html: `
        <div class="waypoint-marker" style="background-color: ${color}; border-color: ${color}">
          <span style="color: white; font-size: 16px;">🏁</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  }

  private createWaypointIcon(number: number, color: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-waypoint-marker',
      html: `
        <div class="waypoint-marker" style="background-color: ${color}; border-color: ${color}">
          <span style="color: white; font-weight: bold; font-size: 11px;">${number}</span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }

  private addMerchantMarkers() {
    this.merchants.forEach(merchant => {
      const icon = this.createMerchantIcon(merchant.category);

      const marker = L.marker([merchant.latitude, merchant.longitude], { icon })
        .bindPopup(this.createMerchantPopup(merchant));

      this.merchantMarkers.addLayer(marker);
    });
  }

  private createMaraudeIcon(status: string): L.DivIcon {
    const color = this.getMaraudeColor(status);

    return L.divIcon({
      className: 'custom-maraude-marker',
      html: `
        <div class="marker-pin" style="background-color: ${color}">
          <div style="position: relative; font-size: 18px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🏁</div>
        </div>
        <div class="marker-pulse" style="background-color: ${color}"></div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  private createMerchantIcon(category: string): L.DivIcon {
    const icon = this.getMerchantIcon(category);

    return L.divIcon({
      className: 'custom-merchant-marker',
      html: `
        <div class="marker-pin" style="background-color: #10b981">
          <svg class="marker-icon" viewBox="0 0 24 24" fill="white">
            ${icon}
          </svg>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  }

  private getMaraudeColor(status: string): string {
    switch (status) {
      case 'planned': return '#3b82f6';     // Blue
      case 'in_progress': return '#f59e0b'; // Orange
      case 'completed': return '#10b981';   // Green
      case 'cancelled': return '#ef4444';   // Red
      default: return '#6b7280';            // Gray
    }
  }

  private getMerchantIcon(category: string): string {
    const icons: { [key: string]: string } = {
      restaurant: '<path d="M8 22h8v-9l4.159-6.238A1 1 0 0019.414 5H4.586a1 1 0 00-.745 1.762L8 13v9z"/>',
      cafe: '<path d="M5 11h14v2a6 6 0 01-6 6H7a6 6 0 01-6-6v-2zm1-4V2h12v5M8 7v4m4-4v4m4-4v4"/>',
      bakery: '<path d="M6 2l3 6 3-6 3 6 3-6v18a2 2 0 01-2 2H8a2 2 0 01-2-2V2z"/>',
      pharmacy: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z"/>',
      supermarket: '<path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v3H2V5a1 1 0 011-1h4zM6 9v10a2 2 0 002 2h8a2 2 0 002-2V9H6z"/>',
      health_center: '<path d="M12 2l8 4v10.5c0 5.99-4.99 10.5-8 10.5s-8-4.51-8-10.5V6l8-4z"/>',
      laundromat: '<path d="M4 6h16v2H4V6zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"/>',
      clothing_store: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>',
      other: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z"/>'
    };

    const defaultIcon = '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z"/>';
    return icons[category] || defaultIcon;
  }

  private createMaraudePopup(maraude: MaraudeAction): string {
    const statusText = this.getStatusText(maraude.status);
    const statusColor = this.getMaraudeColor(maraude.status);

    // Different display for recurring vs one-time events
    const scheduleText = maraude.isRecurring
      ? `Tous les ${maraude.dayName}s à ${maraude.startTime}`
      : `${maraude.scheduledDate ? new Date(maraude.scheduledDate).toLocaleDateString('fr-FR') : ''} à ${maraude.startTime}`;

    // Show route information if waypoints exist
    const routeInfo = maraude.waypoints && maraude.waypoints.length > 0
      ? `
        <div class="popup-detail">
          <strong>🗺️</strong> Parcours: ${maraude.waypoints.length + 1} points
        </div>
        ${maraude.estimatedDistance ? `
          <div class="popup-detail">
            <strong>📏</strong> Distance estimée: ${maraude.estimatedDistance} km
          </div>
        ` : ''}
        ${maraude.estimatedDuration ? `
          <div class="popup-detail">
            <strong>⏱️</strong> Durée estimée: ${maraude.estimatedDuration} min
          </div>
        ` : ''}
      `
      : '';

    return `
      <div class="popup-content">
        <div class="popup-header">
          <h3 class="popup-title">${maraude.title}</h3>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <span class="popup-status" style="background-color: ${statusColor}20; color: ${statusColor}">
              ${statusText}
            </span>
            ${maraude.isHappeningToday ? '<span class="popup-today" style="background-color: #f59e0b20; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Aujourd\'hui</span>' : ''}
          </div>
        </div>
        <div class="popup-body">
          <p class="popup-description">${maraude.description || ''}</p>
          <div class="popup-details">
            <div class="popup-detail">
              <strong>🏁</strong> Départ: ${maraude.address || maraude.startAddress || 'Adresse de départ'}
            </div>
            <div class="popup-detail">
              <strong>📅</strong> ${scheduleText}
            </div>
            ${maraude.endTime ? `
              <div class="popup-detail">
                <strong>⏰</strong> Fin prévue: ${maraude.endTime}
              </div>
            ` : ''}
            ${routeInfo}
            <div class="popup-detail">
              <strong>👥</strong> ${maraude.participantsCount} bénévoles
            </div>
            ${maraude.beneficiariesHelped > 0 ? `
              <div class="popup-detail">
                <strong>❤️</strong> ${maraude.beneficiariesHelped} personnes aidées
              </div>
            ` : ''}
            ${maraude.nextOccurrence && maraude.isRecurring ? `
              <div class="popup-detail">
                <strong>🔄</strong> Prochaine: ${new Date(maraude.nextOccurrence).toLocaleDateString('fr-FR')}
              </div>
            ` : ''}
            <div class="popup-detail">
              <strong>🏢</strong> ${maraude.association?.name || 'Association'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private createMerchantPopup(merchant: Merchant): string {
    const services = merchant.services.map(service => this.getServiceText(service)).join(', ');

    return `
      <div class="popup-content">
        <div class="popup-header">
          <h3 class="popup-title">${merchant.name}</h3>
          <span class="popup-category">${this.getCategoryText(merchant.category)}</span>
          ${merchant.isVerified ? '<span class="popup-verified">✓ Vérifié</span>' : ''}
        </div>
        <div class="popup-body">
          <p class="popup-description">${merchant.description || ''}</p>
          <div class="popup-details">
            <div class="popup-detail">
              <strong>📍</strong> ${merchant.address}
            </div>
            ${merchant.phone ? `
              <div class="popup-detail">
                <strong>📞</strong> ${merchant.phone}
              </div>
            ` : ''}
            ${services ? `
              <div class="popup-detail">
                <strong>🎯</strong> ${services}
              </div>
            ` : ''}
            ${merchant.contactPerson ? `
              <div class="popup-detail">
                <strong>👤</strong> ${merchant.contactPerson}
              </div>
            ` : ''}
          </div>
          ${merchant.specialInstructions ? `
            <div class="popup-instructions">
              <strong>ℹ️ Instructions:</strong> ${merchant.specialInstructions}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      planned: 'Planifiée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return statusMap[status] || status;
  }

  private getCategoryText(category: string): string {
    const categoryMap: { [key: string]: string } = {
      restaurant: 'Restaurant',
      cafe: 'Café',
      bakery: 'Boulangerie',
      pharmacy: 'Pharmacie',
      supermarket: 'Supermarché',
      health_center: 'Centre de santé',
      laundromat: 'Laverie',
      clothing_store: 'Magasin de vêtements',
      other: 'Autre'
    };
    return categoryMap[category] || category;
  }

  private getServiceText(service: string): string {
    const serviceMap: { [key: string]: string } = {
      free_coffee: 'Café gratuit',
      free_meal: 'Repas gratuit',
      restroom: 'Toilettes',
      wifi: 'WiFi',
      phone_charging: 'Recharge téléphone',
      hygiene_kit: 'Kit hygiène',
      first_aid: 'Premiers secours',
      information: 'Information',
      shower: 'Douche',
      food_distribution: 'Distribution alimentaire',
      medical_consultation: 'Consultation médicale'
    };
    return serviceMap[service] || service;
  }

  // Public methods to be called from parent component
  public updateMapData(maraudes: MaraudeAction[], merchants: Merchant[], filters: any) {
    this.maraudes = maraudes;
    this.merchants = merchants;
    this.filters = filters;
    this.updateMarkers();
  }

  public centerOnLocation(lat: number, lng: number, zoom: number = 15) {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  }
}
