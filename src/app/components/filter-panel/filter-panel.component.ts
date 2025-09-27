import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DAYS_OF_WEEK } from '../../models/maraude.model'; // ajustez le chemin si besoin

interface FilterState {
  showMaraudes: boolean;
  showMerchants: boolean;
  maraudeStatus: string;
  merchantCategory: string;
  radius: number;
  maraudeDay: number; // 1 = Lundi … 7 = Dimanche
}

@Component({
  standalone: true,
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./filter-panel.component.css']
})
export class FilterPanelComponent {
  @Output() filtersChanged = new EventEmitter<FilterState>();

  // Exposé au template
  days = DAYS_OF_WEEK;

  // Map pour retrouver rapidement le nom du jour
  private dayNameByValue = new Map(this.days.map(d => [d.value, d.name]));

  // Calcule le jour courant (JS: 0=dimanche … 6=samedi) -> 1=lundi … 7=dimanche
  private getCurrentDayOfWeek(): number {
    const js = new Date().getDay(); // 0..6
    return js === 0 ? 7 : js;       // 1..7
  }

  filters: FilterState = {
    showMaraudes: true,
    showMerchants: true,
    maraudeStatus: '',
    merchantCategory: '',
    radius: 10,
    maraudeDay: this.getCurrentDayOfWeek()
  };

  // Getter utilisé par le template (évite les fonctions fléchées en interpolation)
  get currentDayName(): string {
    return this.dayNameByValue.get(this.filters.maraudeDay) ?? '';
  }

  onFilterChange() {
    this.filtersChanged.emit(this.filters);
  }
}
