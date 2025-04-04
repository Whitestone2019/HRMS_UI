import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  isAboutModalOpen: boolean = false; // Modal for About section
  isSkillModalOpen: boolean = false; // Modal for Skill section

  aboutText: string = ''; // Stores the "Add About" box content
  modalInput: string = ''; // Stores the input in the About modal

  skillText: string = ''; // Stores the "Add Skill Set" content
  skillModalInput: string = ''; // Stores the input in the Skill Set modal

  openAboutModal(): void {
    this.isAboutModalOpen = true;
    this.modalInput = this.aboutText; // Pre-fill the modal with current content
  }

  openSkillModal(): void {
    this.isSkillModalOpen = true;
    this.skillModalInput = this.skillText; // Pre-fill the modal with current content
  }

  closeModal(): void {
    this.isAboutModalOpen = false;
    this.isSkillModalOpen = false;
  }

  saveAbout(): void {
    if (this.modalInput.trim()) {
      this.aboutText = this.modalInput; // Save the About content
      this.closeModal();
    } else {
      alert('Please enter some information.');
    }
  }

  saveSkill(): void {
    if (this.skillModalInput.trim()) {
      this.skillText = this.skillModalInput; // Save the Skill Set content
      this.closeModal();
    } else {
      alert('Please enter some information.');
    }
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent): void {
    // Close the modal if clicked outside
    const modalElement = document.querySelector('.modal.show');
    if (event.target === modalElement) {
      this.closeModal();
    }
  }
}
