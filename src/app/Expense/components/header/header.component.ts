import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="search">
        <input type="text" placeholder="Search expenses...">
      </div>
      <div class="user-actions">
        <div class="user-profile">
          <img src="https://via.placeholder.com/32" alt="User profile">
          <span>Sowmiya 10031</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: #fff;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ddd;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Soft shadow for 3D effect */
      border-radius: 10px; /* Rounded corners */
      transition: transform 0.3s ease-in-out; /* Smooth transition on hover */
    }
    
    .header:hover {
      transform: translateY(-5px); /* Slight upward movement on hover for 3D effect */
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); /* Deeper shadow on hover */
    }

    .search input {
      padding: 8px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 300px;
      background-color: #f9f9f9;
      transition: all 0.3s ease; /* Smooth transition on focus */
    }

    .search input:focus {
      background-color: #fff; /* Change background color when focused */
      box-shadow: 0 0 8px rgba(0, 0, 255, 0.5); /* Blue glow effect on focus */
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .new-expense {
      background: #00008B;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .new-expense:hover {
      transform: translateY(-3px); /* Upward effect on hover */
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); /* Shadow to create depth */
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-profile img {
      border-radius: 50%;
      border: 2px solid #ddd; /* Border around profile image */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow on image */
      transition: transform 0.2s ease;
    }

    .user-profile img:hover {
      transform: scale(1.1); /* Slight zoom effect on hover */
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); /* Deeper shadow on hover */
    }
  `]
})
export class HeaderComponent {}
