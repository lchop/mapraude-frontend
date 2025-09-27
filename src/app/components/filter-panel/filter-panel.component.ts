import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Adjust the import path to where you define your days list
// Expected shape: export const DAYS_OF_WEEK = [{ value:1, name:'Lundi' }, ... , { value:7, name:'Dimanche' }];
import { DAYS_OF_WEEK } from '../../models/maraude.model';

export interface FilterState {
  showMaraudes: boolean;
  showMerchants: boolean;
  maraudeStatus: string;
  merchantCategory: string;
  radius: number;
  selectedDays: number[]; // Mon=1 … Sun=7; empty => no day filter
}

@Component({
  standalone: true,
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.css'],
  imports: [CommonModule, FormsModule]
})
export class FilterPanelComponent {
  @Output() filtersChanged = new EventEmitter<FilterState>();

  days = DAYS_OF_WEEK; // [{ value:1, name:'Lundi' }, ...]
  private dayNameByValue = new Map<number, string>(this.days.map(d => [d.value, d.name]));

  private getTodayNumber(): number {
    const js = new Date().getDay(); // 0=Sun … 6=Sat
    return js === 0 ? 7 : js;
  }

  // Initial filter state
  filters: FilterState = {
    showMaraudes: true,
    showMerchants: true,
    maraudeStatus: '',
    merchantCategory: '',
    radius: 10,
    selectedDays: [this.getTodayNumber()]
  };

  // ---- UI helpers ----
  shortLabel(dayValue: number): string {
    switch (dayValue) {
      case 1: return 'L';
      case 2: return 'Ma';
      case 3: return 'Me';
      case 4: return 'Je';
      case 5: return 'Ve';
      case 6: return 'Sa';
      case 7: return 'Di';
      default: return '';
    }
  }

  isSelected(dayValue: number): boolean {
    return this.filters.selectedDays.includes(dayValue);
  }

  // ---- Actions ----
  toggleDay(dayValue: number) {
    const idx = this.filters.selectedDays.indexOf(dayValue);
    if (idx >= 0) {
      this.filters.selectedDays.splice(idx, 1);
    } else {
      this.filters.selectedDays.push(dayValue);
      // Keep a consistent order (1..7) for display
      this.filters.selectedDays.sort((a, b) => a - b);
    }
    this.emit();
  }

  selectAllDays() {
    this.filters.selectedDays = [1, 2, 3, 4, 5, 6, 7];
    this.emit();
  }

  clearDays() {
    this.filters.selectedDays = []; // means "no day filter"
    this.emit();
  }

  selectToday() {
    this.filters.selectedDays = [this.getTodayNumber()];
    this.emit();
  }

  emit() {
    // Emit a shallow copy to avoid consumers mutating our internal state
    this.filtersChanged.emit({ ...this.filters, selectedDays: [...this.filters.selectedDays] });
  }

  // ---- Safe label for template ----
  get selectedDaysLabel(): string {
    const sel = this.filters?.selectedDays ?? [];
    if (sel.length === 0) return 'Tous les jours';
    return sel
      .map(v => this.dayNameByValue.get(v) ?? `Jour ${v}`)
      .join(', ');
  }
}
