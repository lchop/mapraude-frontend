import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilterPanelComponent } from '../../filter-panel/filter-panel.component';
import { MaraudeCardComponent } from '../../maraude-card/maraude-card.component';
import { MapViewComponent } from '../../map-view/map-view.component';

import { ApiService } from '../../../services/api.service';
import { MaraudeAction } from '../../../models/maraude.model';
import { Merchant } from '../../../models/merchant.model.';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [
    CommonModule,
    FilterPanelComponent,
    MaraudeCardComponent,
    MapViewComponent
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapPageComponent implements OnInit {
  @ViewChild(MapViewComponent) mapComponent!: MapViewComponent;

  todayMaraudes: MaraudeAction[] = [];
  allMaraudes: MaraudeAction[] = [];
  merchants: Merchant[] = [];
  filteredMaraudes: MaraudeAction[] = [];
  filteredMerchants: Merchant[] = [];

  activeMaraudesCount = 0;
  merchantsCount = 0;
  loading = false;

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
    this.currentFilters = { ...filters };
    this.applyFilters();

    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }

  private applyFilters() {
    this.filteredMaraudes = this.allMaraudes.filter(maraude => {
      if (this.currentFilters.maraudeStatus && maraude.status !== this.currentFilters.maraudeStatus) {
        return false;
      }
      return true;
    });

    this.filteredMerchants = this.merchants.filter(merchant => {
      if (this.currentFilters.merchantCategory && merchant.category !== this.currentFilters.merchantCategory) {
        return false;
      }
      return merchant.isActive;
    });

    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }
}
