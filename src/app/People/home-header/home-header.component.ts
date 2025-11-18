import { Component, OnInit } from '@angular/core';
import { MenuSelectionService } from '../../menu-selection.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-home-header',
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.css']
})
export class HomeHeaderComponent implements OnInit {
  selectedMenu: string = 'home';  // Default to 'home'
  selectedSubMenu: string = '';   // Default to no submenu
  userRole='';
  isAdmin: boolean = false;
  isManager:boolean=false;

  constructor(private menuSelectionService: MenuSelectionService,private userService: UserService) {}

  ngOnInit(): void {
    this.userRole = this.userService.role;
    this.isAdmin = this.userService.isAdmin();
    this.isManager = this.userService.isManager();
    // Subscribe to the menu selection service to get the selected main menu and submenu
    this.menuSelectionService.selectedMenu$.subscribe((menu) => {
      this.selectedMenu = menu.mainMenu;   // Track the main menu
      this.selectedSubMenu = menu.subMenu; // Track the active submenu
    });
  }

  // Optionally add more methods for handling specific submenu actions if necessary
}
