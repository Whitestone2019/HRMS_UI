import { Component, OnInit } from '@angular/core';
import { MenuSelectionService } from '../../menu-selection.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  selectedMenu: string = 'home';  // Default selection is 'home'
  selectedSubMenu: string = '';   // Default to no submenu selected
  userRole: string = '';          // Default user role
   adminRoles: string[] = ['HR', 'CEO', 'CTO']; // Admin roles
  employeeRoles: string[] = ['PM','TL','AS', 'SAS']; // Employee roles

  constructor(private menuSelectionService: MenuSelectionService, private userService: UserService) {}

  ngOnInit(): void {
    // Retrieve user role from UserService
    this.userRole = this.userService.role?.trim().toUpperCase() || ''; // Ensure handling null/undefined values

    // Subscribe to track selected menu and submenu
    this.menuSelectionService.selectedMenu$.subscribe((menu) => {
      this.selectedMenu = menu.mainMenu;
      this.selectedSubMenu = menu.subMenu;
    });
  }

  // Handle menu and submenu selection
  onMenuSelect(mainMenu: string, subMenu: string = ''): void {
    // Restrict navigation if role is undefined or empty
    if (!this.userRole && mainMenu !== 'onboarding') {
      this.menuSelectionService.setSelectedMenu('onboarding', '');
      return;
    }

    // Set menu and submenu for valid cases
    this.menuSelectionService.setSelectedMenu(mainMenu, subMenu);
  }

  // Control menu visibility based on user role
  isMenuVisible(menu: string): boolean {
    if (!this.userRole) {
      return menu === 'onboarding'; // Show only onboarding if no role assigned
    }

    // Admin roles can see all menus
    if (this.adminRoles.includes(this.userRole)) {
      return true;
    }

    // Employee roles have restricted access
    if (this.employeeRoles.includes(this.userRole)) {
      return !['settings', 'analytics', 'onboarding','report','travel'].includes(menu); // Hide these menus
    }

    // Default: Hide all menus
    return false;
  }
}
