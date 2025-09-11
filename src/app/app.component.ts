// src/app/app.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Import all components you use in the template
import { HeaderComponent } from './components/header/header.component';
import { FilterPanelComponent } from './components/filter-panel/filter-panel.component';
import { MaraudeCardComponent } from './components/maraude-card/maraude-card.component';
import { MapViewComponent } from './components/map-view/map-view.component';

// Import your service and models
import { ApiService } from './services/api.service';
import { MaraudeAction } from './models/maraude.model';
import { Merchant } from './models/merchant.model.';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    HeaderComponent,
    FilterPanelComponent,
    MaraudeCardComponent,
    MapViewComponent        // ← Add map component
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(MapViewComponent) mapComponent!: MapViewComponent;

  todayMaraudes: MaraudeAction[] = [];
  allMaraudes: MaraudeAction[] = [];
  merchants: Merchant[] = [];
  filteredMaraudes: MaraudeAction[] = [];
  filteredMerchants: Merchant[] = [];

  activeMaraudesCount = 0;
  merchantsCount = 0;
  loading = false;

  // Current filters state
  currentFilters = {
    showMaraudes: true,
    showMerchants: true,
    maraudeStatus: '',
    merchantCategory: '',
    radius: 10
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.loadTodayMaraudes();
    this.loadAllMaraudes();
    this.loadMerchants();
  }

  loadTodayMaraudes() {
    this.apiService.getTodayActiveMaraudes().subscribe({
      next: (response) => {
        this.todayMaraudes = response.actions;
        this.activeMaraudesCount = response.count;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading today maraudes:', error);
        this.loading = false;
      }
    });
  }

  loadAllMaraudes() {
    this.apiService.getMaraudes({ limit: 100 }).subscribe({
      next: (response) => {
        this.allMaraudes = response.actions;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading all maraudes:', error);
      }
    });
  }

  loadMerchants() {
    this.apiService.getMerchants({ limit: 100 }).subscribe({
      next: (response) => {
        this.merchants = response.merchants;
        this.merchantsCount = response.merchants.length;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading merchants:', error);
      }
    });
  }

  onFiltersChanged(filters: any) {
    console.log('Filters changed:', filters);
    this.currentFilters = { ...filters };
    this.applyFilters();

    // Update map with new filters
    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }

  private applyFilters() {
    // Filter maraudes
    this.filteredMaraudes = this.allMaraudes.filter(maraude => {
      if (this.currentFilters.maraudeStatus && maraude.status !== this.currentFilters.maraudeStatus) {
        return false;
      }
      return true;
    });

    // Filter merchants
    this.filteredMerchants = this.merchants.filter(merchant => {
      if (this.currentFilters.merchantCategory && merchant.category !== this.currentFilters.merchantCategory) {
        return false;
      }
      // Only show active merchants
      return merchant.isActive;
    });

    // Update map if it exists
    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }
}
