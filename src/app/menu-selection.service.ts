import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuSelectionService {
  private selectedMenuSubject = new BehaviorSubject<{ mainMenu: string, subMenu: string }>({
    mainMenu: this.getMainMenu(),
    subMenu: this.getSubMenu()
  });
  selectedMenu$ = this.selectedMenuSubject.asObservable();

  constructor() {}

  // Get the selected main menu from localStorage or default to 'home'
  private getMainMenu(): string {
    return localStorage.getItem('mainMenu') || 'home';
  }

  // Get the selected submenu from localStorage or default to an empty string
  private getSubMenu(): string {
    return localStorage.getItem('subMenu') || '';
  }

  // Set the selected main menu and submenu, and save them to localStorage
  setSelectedMenu(mainMenu: string, subMenu: string = ''): void {
    localStorage.setItem('mainMenu', mainMenu);  // Save to localStorage
    localStorage.setItem('subMenu', subMenu);    // Save submenu to localStorage
    this.selectedMenuSubject.next({ mainMenu, subMenu });  // Update BehaviorSubject
  }
}
