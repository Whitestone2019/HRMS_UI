import { Component } from '@angular/core';

@Component({
  selector: 'app-adminmenu',
  templateUrl: './adminmenu.component.html',
  styleUrls: ['./adminmenu.component.css']
})
export class AdminMenuComponent {
  private openSubMenus: Set<string> = new Set();

  toggleSubMenu(menu: string) {
    if (this.openSubMenus.has(menu)) {
      this.openSubMenus.delete(menu);
    } else {
      this.openSubMenus.add(menu);
    }
  }

  isSubMenuOpen(menu: string): boolean {
    return this.openSubMenus.has(menu);
  }
}
