import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // First check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      // Store intended URL for redirect after login
      localStorage.setItem('redirectUrl', state.url);
      this.router.navigate(['/login']);
      return false;
    }

    // Get the user role
    const userRole = this.authService.getUserRole()?.toUpperCase();
    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }

    // Special case: MASTERADMIN can access everything
    if (userRole === 'MASTERADMIN') {
      return true;
    }

    // Get allowed roles from route data
    const allowedRoles: string[] = route.data['allowedRoles'] || [];

    // Check if user role is in allowed roles
    const isAuthorized = allowedRoles.map(role => role.toUpperCase()).includes(userRole);

    // If not authorized
    if (!isAuthorized) {
      // Redirect based on role
      this.redirectBasedOnRole(userRole);
      return false;
    }

    return true;
  }

  // Separate method for role-based redirection
  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'MASTERADMIN':
        this.router.navigate(['/master/admin/profile']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/profile']);
        break;
      case 'TRAVELER':
        this.router.navigate(['/profile']);
        break;
      default:
        this.router.navigate(['/home']);
        break;
    }
  }
}
