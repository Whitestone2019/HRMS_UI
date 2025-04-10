import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _usernameKey = 'username';
  private _employeeIdKey = 'employeeId';
  private _lastActivityKey = 'lastActivity';
  private _roleKey = 'role';
  private _activeMenuKey = 'activeMenu'; // Key for active menu in localStorage
  private _sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds

  private adminRoles: string[] = ['HR', 'CEO', 'CTO', 'TL','PM']; // Admin roles
  private employeeRoles: string[] = ['AS', 'SAS']; // Employee roles

  constructor() { }

  // Set the username
  set username(name: string) {
    localStorage.setItem(this._usernameKey, name);
    this.updateLastActivity();
  }

  // Get the username
  get username(): string | null {
    return localStorage.getItem(this._usernameKey);
  }

  // Set the employee ID
  set employeeId(id: string) {
    localStorage.setItem(this._employeeIdKey, id);
    this.updateLastActivity();
  }

  // Get the employee ID
  get employeeId(): string | null {
    return localStorage.getItem(this._employeeIdKey);
  }

  // Set user role
  set role(role: string | null) {
    const safeRole = role ? role.trim().toUpperCase() : '';
    localStorage.setItem(this._roleKey, safeRole);
    this.updateLastActivity();
  }


  // Get user role
  get role(): string {
    return localStorage.getItem(this._roleKey) || '';
  }

  // Update the last activity timestamp
  updateLastActivity() {
    localStorage.setItem(this._lastActivityKey, Date.now().toString());
  }

  // Check if the session is still valid
  isSessionValid(): boolean {
    const lastActivity = parseInt(localStorage.getItem(this._lastActivityKey) || '0', 10);
    return Date.now() - lastActivity < this._sessionTimeout;
  }

  // Set the active menu in localStorage
  setActiveMenu(menu: string) {
    localStorage.setItem(this._activeMenuKey, menu);
  }

  // Get the active menu from localStorage
  getActiveMenu(): string {
    return localStorage.getItem(this._activeMenuKey) || 'my-space'; // Default to 'my-space'
  }

  // Check if the user has admin access
  isAdmin(): boolean {
    return this.adminRoles.includes(this.role);
  }

  // Check if the user is an employee
  isEmployee(): boolean {
    return this.employeeRoles.includes(this.role);
  }

  // Check if the user has access to restricted roles
  hasRoleAccess(): boolean {
    return this.adminRoles.includes(this.role);
  }

  // Clear user data (for logout)
  clearUser() {
    localStorage.removeItem(this._usernameKey);
    localStorage.removeItem(this._employeeIdKey);
    localStorage.removeItem(this._lastActivityKey);
    localStorage.removeItem(this._roleKey);
    localStorage.removeItem(this._activeMenuKey);
  }
}
