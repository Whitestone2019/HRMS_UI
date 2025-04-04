import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if 'authToken' exists in localStorage to determine if the user is authenticated
    const isAuthenticated = !!localStorage.getItem('authToken'); 

    console.log('AuthGuard: isAuthenticated:', isAuthenticated);  // Debugging line

    if (!isAuthenticated) {
      console.log('AuthGuard: Redirecting to login');  // Debugging line
      // Redirect the user to the login page if not authenticated
      this.router.navigate(['/login']);
      return false;
    }

    console.log('AuthGuard: Navigation allowed');  // Debugging line
    return true;  // Allow navigation if authenticated
  }
}
