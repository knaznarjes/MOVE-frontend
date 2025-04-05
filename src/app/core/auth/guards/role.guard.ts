// role.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user is logged in first
    if (!this.authService.isLoggedIn()) {
      // Store the intended URL for redirection after login
      localStorage.setItem('redirectUrl', state.url);
      this.router.navigate(['/login']);
      return false;
    }

    // Get user role
    const userRole = this.authService.getUserRole().toUpperCase();

    // Get allowed roles from route data
    const allowedRoles: string[] = route.data['allowedRoles'] || [];

    // Default to empty array if no roles specified
    if (!allowedRoles.length) {
      return true; // If no roles specified, allow access
    }

    // Check if user role is in allowed roles
    const isAuthorized = allowedRoles.map(role => role.toUpperCase()).includes(userRole);

    // Allow admins to access all routes
    if (userRole === 'ADMIN') {
      return true;
    }

    // If not authorized
    if (!isAuthorized) {
      // Redirect based on role
      if (userRole === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/profile']);
      }
      return false;
    }

    return true;
  }
}
