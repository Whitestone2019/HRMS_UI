import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../authservice.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles: string[] = route.data['roles']; // Roles defined in routes
    const userRole = this.authService.getUserRole(); // Fetch role from auth service

    if (state.url.includes('/dashboard')) {
      return true;
    }

    if (expectedRoles.includes(userRole)) {
      return true;
    } else {
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}
