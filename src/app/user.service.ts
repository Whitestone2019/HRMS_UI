import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _usernameKey = 'username';
  private _employeeIdKey = 'employeeId';
  private _lastActivityKey = 'lastActivity';
  private _roleKey = 'role';
  private _activeMenuKey = 'activeMenu';
  private _sessionTimeout = 30 * 60 * 1000; // 30 minutes

  private adminRoles: string[] = ['HR', 'CEO', 'CTO','ACC'];
  private employeeRoles: string[] = ['AS', 'SAS'];
  private managerRoles: string[] = ['TL','PM', 'HR','CEO', 'CTO','ACC']; // Add any other manager roles here
  private trainee: string[] = ['JA'];

  private accountant: string[] =['ACC'];
  private hr :string[] =['HR'];

  constructor() {}

  set username(name: string) {
    localStorage.setItem(this._usernameKey, name);
    this.updateLastActivity();
  }

  get username(): string | null {
    return localStorage.getItem(this._usernameKey);
  }

  set employeeId(id: string) {
    localStorage.setItem(this._employeeIdKey, id);
    this.updateLastActivity();
  }

  get employeeId(): string | null {
    return localStorage.getItem(this._employeeIdKey);
  }

  set role(role: string | null) {
    const safeRole = role ? role.trim().toUpperCase() : '';
    localStorage.setItem(this._roleKey, safeRole);
    this.updateLastActivity();
  }

  get role(): string {
    return localStorage.getItem(this._roleKey) || '';
  }

  updateLastActivity() {
    localStorage.setItem(this._lastActivityKey, Date.now().toString());
  }

  isSessionValid(): boolean {
    const lastActivity = parseInt(localStorage.getItem(this._lastActivityKey) || '0', 10);
    return Date.now() - lastActivity < this._sessionTimeout;
  }

  setActiveMenu(menu: string) {
    localStorage.setItem(this._activeMenuKey, menu);
  }

  getActiveMenu(): string {
    return localStorage.getItem(this._activeMenuKey) || 'my-space';
  }

  isAdmin(): boolean {
    return this.adminRoles.includes(this.role);
  }

  isEmployee(): boolean {
    return this.employeeRoles.includes(this.role);
  }

   isTrainee(): boolean {
    return this.trainee.includes(this.role);
  }

  isManager(): boolean {
    return this.managerRoles.includes(this.role);
  }

  isAccountant(): boolean {
    return this.accountant.includes(this.role);
  }

  isHr(): boolean {
    return this.hr.includes(this.role);
  }

  hasRoleAccess(): boolean {
    return this.adminRoles.includes(this.role);
  }

  clearUser() {
    localStorage.removeItem(this._usernameKey);
    localStorage.removeItem(this._employeeIdKey);
    localStorage.removeItem(this._lastActivityKey);
    localStorage.removeItem(this._roleKey);
    localStorage.removeItem(this._activeMenuKey);
  }
}
