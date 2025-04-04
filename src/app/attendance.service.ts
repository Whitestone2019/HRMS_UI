import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private isCheckedInSubject = new BehaviorSubject<boolean>(false);
  private elapsedTimeSubject = new BehaviorSubject<string>('00:00:00');
  private timerInterval: any;
  private startTime: number | null = null; // Store the start time for check-in
  private stopTime: number | null = null; // Store the stop time for check-out
  private elapsedTimeInSeconds: number = 0; // Track elapsed time in seconds

  constructor() {
    this.loadStateFromLocalStorage();
  }

  get isCheckedIn$() {
    return this.isCheckedInSubject.asObservable();
  }

  get elapsedTime$() {
    return this.elapsedTimeSubject.asObservable();
  }

  checkIn() {
    this.startTime = Date.now(); // Capture the current time when checking in
    this.isCheckedInSubject.next(true);
    this.saveStateToLocalStorage('true', this.startTime, '00:00:00');
    this.startOrResumeTimer(this.startTime); // Start or resume the timer
  }

  checkOut(): void {
    if (this.startTime) {
      this.stopTime = Date.now(); // Capture the stop time when checking out
      this.elapsedTimeInSeconds = Math.floor((this.stopTime - this.startTime) / 1000);
      this.displayElapsedTime(this.elapsedTimeInSeconds);
      this.isCheckedInSubject.next(false);
      this.stopTimer();
      this.elapsedTimeSubject.next('00:00:00');
      this.saveStateToLocalStorage('false', null, '00:00:00');
    }
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.elapsedTimeSubject.next('00:00:00');
      this.timerInterval = null;
    }
  }

  private startOrResumeTimer(startTime: number): void {
    this.stopTimer(); // Clear any existing timer to prevent duplication

    this.timerInterval = setInterval(() => {
      const elapsedTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.elapsedTimeInSeconds = elapsedTimeInSeconds; // Track elapsed time in seconds
      this.updateElapsedTime(elapsedTimeInSeconds);
    }, 1000);
  }

  private updateElapsedTime(elapsedTimeInSeconds: number): void {
    const hours = Math.floor(elapsedTimeInSeconds / 3600);
    const minutes = Math.floor((elapsedTimeInSeconds % 3600) / 60);
    const seconds = elapsedTimeInSeconds % 60;

    const formattedTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
    this.elapsedTimeSubject.next(formattedTime);

    localStorage.setItem('elapsedTime', formattedTime);
  }

  private displayElapsedTime(elapsedTimeInSeconds: number): void {
    const hours = Math.floor(elapsedTimeInSeconds / 3600);
    const minutes = Math.floor((elapsedTimeInSeconds % 3600) / 60);
    const seconds = elapsedTimeInSeconds % 60;

    const formattedTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
    //alert(`Checkout Duration: ${formattedTime}`); // Print the elapsed time in HH:MM:SS format
    localStorage.setItem('elapsedTime', formattedTime); // Store the final time
  }

  private loadStateFromLocalStorage(): void {
    const savedCheckInState = localStorage.getItem('isCheckedIn');
    const savedStartTime = localStorage.getItem('startTime');
    const savedElapsedTime = localStorage.getItem('elapsedTime');

    const isCheckedIn = savedCheckInState === 'true';
    this.isCheckedInSubject.next(isCheckedIn);

    if (savedElapsedTime) {
      this.elapsedTimeSubject.next(savedElapsedTime);
    }

    if (isCheckedIn && savedStartTime) {
      const parsedStartTime = parseInt(savedStartTime, 10);
      if (!isNaN(parsedStartTime)) {
        this.startOrResumeTimer(parsedStartTime);
      }
    }
  }

  private saveStateToLocalStorage(isCheckedIn: string, startTime: number | null, elapsedTime: string): void {
    localStorage.setItem('isCheckedIn', isCheckedIn);
    if (startTime !== null) {
      localStorage.setItem('startTime', startTime.toString());
    } else {
      localStorage.removeItem('startTime');
    }
    localStorage.setItem('elapsedTime', elapsedTime);
  }

  private padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  isUserCheckedIn(): boolean {
    return this.isCheckedInSubject.value;
  }

  public startTimerIfCheckedIn(): void {
    const savedStartTime = localStorage.getItem('startTime');
    if (savedStartTime) {
      const startTime = parseInt(savedStartTime, 10);
      if (!isNaN(startTime)) {
        this.startOrResumeTimer(startTime); // This calls the private method internally
      }
    }
  }
  public startTimer(elapsedTime: number): void {
    if (this.timerInterval) {
      console.log('Timer is already running');
      return; // Prevent starting a new timer if one is already running
    }
  
    this.stopTimer(); // Clear any existing timer to prevent duplication
  
    this.startTime = Date.now() - elapsedTime; // Adjust the start time based on elapsed time
    this.elapsedTimeInSeconds = Math.floor(elapsedTime / 1000); // Initialize elapsed time in seconds
    
    if (this.startTime !== null) {
      this.timerInterval = setInterval(() => {
        this.elapsedTimeInSeconds = Math.floor((Date.now() - this.startTime!) / 1000);
        this.updateElapsedTime(this.elapsedTimeInSeconds);
      }, 1000);
    }
  }
  
  
  
}
