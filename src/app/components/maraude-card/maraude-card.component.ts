import { Component, Input } from '@angular/core';
import { MaraudeAction } from '../../models/maraude.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maraude-card',
  standalone: true,
  templateUrl: './maraude-card.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./maraude-card.component.css']
})
export class MaraudeCardComponent {
  @Input() maraude!: MaraudeAction;

  getStatusClass(): string {
    switch (this.maraude.status) {
      case 'planned': return 'status-planned';
      case 'in_progress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusText(): string {
    switch (this.maraude.status) {
      case 'planned': return 'Planifiée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  }
}
