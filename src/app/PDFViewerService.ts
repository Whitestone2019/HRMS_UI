// pdf-viewer.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class PDFViewerService {
  
  constructor(private sanitizer: DomSanitizer) {}
  
  // Method 1: Create object URL from blob
  createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }
  
  // Method 2: Create base64 data URL
  async createBase64URL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // Method 3: Create safe URL for iframe (last resort)
  createSafeURL(blob: Blob): SafeResourceUrl {
    const url = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  // Clean up URLs
  revokeObjectURL(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}