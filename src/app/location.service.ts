import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor() {}

  // Method to get the current location
  getLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        // Get the current position of the user
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = `${position.coords.latitude},${position.coords.longitude}`;
            resolve(location);
          },
          (error) => {
            reject('Error getting location');
          }
        );
      } else {
        reject('Geolocation not supported');
      }
    });
  }
}
