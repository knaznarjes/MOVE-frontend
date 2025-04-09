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

    // Check if user role is in allowed roles
    const isAuthorized = allowedRoles.map(role => role.toUpperCase()).includes(userRole);

    // Special case: MASTERADMIN can access everything
    if (userRole === 'MASTERADMIN') {
      return true;
    }

    // If not authorized
    if (!isAuthorized) {
      // Redirect based on role
      switch (userRole) {
        case 'MASTERADMIN':
          this.router.navigate(['/master/admin/profile']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/profile']);
          break;
        case 'TRAVELER':
        case 'USER':
          this.router.navigate(['/profile']);
          break;
        default:
          this.router.navigate(['/home']);
          break;
      }
      return false;
    }

    return true;
  }
}
