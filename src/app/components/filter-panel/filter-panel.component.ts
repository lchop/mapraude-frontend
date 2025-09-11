import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface FilterState {
  showMaraudes: boolean;
  showMerchants: boolean;
  maraudeStatus: string;
  merchantCategory: string;
  radius: number;
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

  filters: FilterState = {
    showMaraudes: true,
    showMerchants: true,
    maraudeStatus: '',
    merchantCategory: '',
    radius: 10
  };

  onFilterChange() {
    this.filtersChanged.emit(this.filters);
  }
}
