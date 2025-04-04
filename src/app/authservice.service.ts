import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  getUserRole(): string {
    return localStorage.getItem('userRole') || 'Guest'; // Fetch role from storage
  }

  setUserRole(role: string) {
    localStorage.setItem('userRole', role);
  }
}
