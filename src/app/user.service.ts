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
  private _reportToKey = 'reportTo';
  private _managerNameKey = 'managerName';
  private _sessionTimeout = 30 * 60 * 1000; // 30 minutes

  // Role groups
  private adminRoles: string[] = ['HR', 'CEO', 'CTO', 'ACC'];
  private employeeRoles: string[] = ['AS', 'SAS'];
  private managerRoles: string[] = ['TL', 'PM', 'HR', 'CEO', 'CTO', 'ACC'];
  private trainee: string[] = ['JA'];
  private accountant: string[] = ['ACC'];
  private hr: string[] = ['HR'];
  
  // NEW: Executive roles group (CEO, CTO, HR)
  private executiveRoles: string[] = ['CEO', 'CTO', 'HR'];

  location: string = '';

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

  // Report To (Manager ID)
  set reportTo(managerId: string) {
    localStorage.setItem(this._reportToKey, managerId);
  }

  get reportTo(): string | null {
    return localStorage.getItem(this._reportToKey);
  }

  // Manager Name
  set managerName(name: string) {
    localStorage.setItem(this._managerNameKey, name);
  }

  get managerName(): string | null {
    return localStorage.getItem(this._managerNameKey);
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

  // Role check methods
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

  // NEW: Check if user is in executive group (CEO, CTO, HR)
  isExecutive(): boolean {
    return this.executiveRoles.includes(this.role);
  }

  hasRoleAccess(): boolean {
    return this.adminRoles.includes(this.role);
  }

  // NEW: Get all available role groups for display/permissions
  getRoleGroups(): { [key: string]: string[] } {
    return {
      admin: this.adminRoles,
      employee: this.employeeRoles,
      manager: this.managerRoles,
      trainee: this.trainee,
      accountant: this.accountant,
      hr: this.hr,
      executive: this.executiveRoles
    };
  }

  // NEW: Check if role belongs to a specific group
  isRoleInGroup(role: string, group: keyof ReturnType<UserService['getRoleGroups']>): boolean {
    const groups = this.getRoleGroups();
    return groups[group]?.includes(role) || false;
  }

  // NEW: Get role display name
  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'HR': 'Human Resources',
      'CEO': 'Chief Executive Officer',
      'CTO': 'Chief Technology Officer',
      'ACC': 'Accountant',
      'TL': 'Team Lead',
      'PM': 'Project Manager',
      'AS': 'Associate',
      'SAS': 'Senior Associate',
      'JA': 'Junior Associate'
    };
    
    return roleMap[role] || role;
  }

  // NEW: Check if role has executive privileges
  hasExecutivePrivileges(): boolean {
    return this.executiveRoles.includes(this.role) || this.isAdmin();
  }

  clearUser() {
    localStorage.removeItem(this._usernameKey);
    localStorage.removeItem(this._employeeIdKey);
    localStorage.removeItem(this._lastActivityKey);
    localStorage.removeItem(this._roleKey);
    localStorage.removeItem(this._activeMenuKey);
    localStorage.removeItem(this._reportToKey);
    localStorage.removeItem(this._managerNameKey);
  }
}