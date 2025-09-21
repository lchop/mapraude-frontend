import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  currentUser: User | null = null;
  showMobileMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to auth state changes using your existing service
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = this.authService.isLoggedIn();
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';

    const firstInitial = this.currentUser.firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = this.currentUser.lastName?.charAt(0).toUpperCase() || '';

    return firstInitial + lastInitial;
  }

  getRoleLabel(): string {
    if (!this.currentUser) return '';

    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrateur',
      'coordinator': 'Coordinateur',
      'volunteer': 'Bénévole'
    };

    return roleLabels[this.currentUser.role] || this.currentUser.role;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/map']);
    this.closeMobileMenu();
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}
