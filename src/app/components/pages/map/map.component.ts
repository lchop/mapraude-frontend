import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilterPanelComponent } from '../../filter-panel/filter-panel.component';
import { MaraudeCardComponent } from '../../maraude-card/maraude-card.component';
import { MapViewComponent } from '../../map-view/map-view.component';

import { ApiService } from '../../../services/api.service';
import { MaraudeAction } from '../../../models/maraude.model';
import { Merchant } from '../../../models/merchant.model.'; // keep your path

interface FilterState {
  showMaraudes: boolean;
  showMerchants: boolean;
  maraudeStatus: string;
  merchantCategory: string;
  radius: number;
  selectedDays: number[]; // multi-day 1..7
}

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

  private getTodayNumber(): number {
    const js = new Date().getDay(); // 0..6, Sun=0
    return js === 0 ? 7 : js;       // 1..7
  }

  private getDayNumberFromDate(d: Date | string | undefined | null): number | null {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const js = date.getDay();
    return js === 0 ? 7 : js;
  }

  currentFilters: FilterState = {
    showMaraudes: true,
    showMerchants: true,
    maraudeStatus: '',
    merchantCategory: '',
    radius: 10,
    selectedDays: [this.getTodayNumber()]
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

  onFiltersChanged(filters: FilterState) {
    this.currentFilters = { ...filters, selectedDays: [...filters.selectedDays] };
    this.applyFilters();

    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }

  private matchesSelectedDays(m: MaraudeAction, selectedDays: number[]): boolean {
    // If no day selected -> no day filtering
    if (!selectedDays || selectedDays.length === 0) return true;

    // Recurring
    if ((m as any).isRecurring && (m as any).dayOfWeek) {
      return selectedDays.includes((m as any).dayOfWeek);
    }

    // One-time
    const day = this.getDayNumberFromDate((m as any).scheduledDate);
    if (day) return selectedDays.includes(day);

    // No information -> exclude
    return false;
  }

  private applyFilters() {
    const { maraudeStatus, merchantCategory, selectedDays, showMaraudes, showMerchants } = this.currentFilters;

    // Maraudes
    const baseMaraudes = this.allMaraudes.filter(m => {
      if (maraudeStatus && m.status !== maraudeStatus) return false;
      return this.matchesSelectedDays(m, selectedDays);
    });
    this.filteredMaraudes = showMaraudes ? baseMaraudes : [];

    // Merchants
    const baseMerchants = this.merchants.filter(merchant => {
      if (merchantCategory && merchant.category !== merchantCategory) return false;
      return merchant.isActive;
    });
    this.filteredMerchants = showMerchants ? baseMerchants : [];

    if (this.mapComponent) {
      this.mapComponent.updateMapData(
        this.filteredMaraudes,
        this.filteredMerchants,
        this.currentFilters
      );
    }
  }
}
