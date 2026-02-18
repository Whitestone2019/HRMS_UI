import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-view.html',
  styleUrls: ['./user-view.css']
})
export class UserView implements OnInit, OnDestroy {
  files: any[] = [];
  viewingFile: any = null;
  isLoading = false;
  totalSize: string = '0 Bytes';
  pdfCount: number = 0;
  isRendering = false;
  
  // Protection state - using static-like behavior to persist across component lifecycle
  private static globalBlackScreenActive = false;
  
  get isBlackScreenActive(): boolean {
    return UserView.globalBlackScreenActive;
  }
  
  set isBlackScreenActive(value: boolean) {
    UserView.globalBlackScreenActive = value;
    // Save to localStorage whenever state changes
    this.saveBlackScreenState();
  }
  
  isProtectedViewActive = false;
  private blobSubscriptions: Subscription[] = [];
  private keyboardListeners: (() => void)[] = [];
  
  // Key press tracking - simplified
  private keyPressCount = 0;
  private lastKeyTime = 0;
  
  // PDF display
  zoomLevel: number = 1.0;
  pdfData: any = null;
  currentPage: number = 1;
  totalPages: number = 0;

  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imageCanvas') imageCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewerContainer') viewerContainer!: ElementRef<HTMLDivElement>;

  private pdfjsLib: any = null;
  private pdfDoc: any = null;
  private protectionInterval: any = null;
  private blackScreenTimeout: any = null;
  private warningElements: HTMLElement[] = [];
  private watermarkText: string = 'WHITESTONE';

  constructor(
    private apiService: ApiService,
    private renderer: Renderer2
  ) {
    // Initialize black screen state from localStorage on component creation
    this.loadBlackScreenState();
  }

  private loadBlackScreenState(): void {
    // Check if black screen was previously activated
    const savedState = localStorage.getItem('blackScreenActive');
    if (savedState === 'true') {
      UserView.globalBlackScreenActive = true;
      console.log('🖥️ Black screen state loaded from storage: ACTIVE');
    } else {
      UserView.globalBlackScreenActive = false;
      console.log('🖥️ Black screen state loaded from storage: INACTIVE');
    }
  }

  private saveBlackScreenState(): void {
    // Save black screen state to localStorage
    localStorage.setItem('blackScreenActive', String(UserView.globalBlackScreenActive));
    console.log('💾 Black screen state saved to storage:', UserView.globalBlackScreenActive);
  }

  /**
   * PUBLIC METHOD - Call this when user logs out to completely reset black screen
   * This should be called from your auth service or login component
   */
  public resetBlackScreenOnLogout(): void {
    console.log('🚪 LOGOUT DETECTED - Completely resetting black screen state');
    
    // Reset the global state
    UserView.globalBlackScreenActive = false;
    
    // Remove from localStorage
    localStorage.removeItem('blackScreenActive');
    
    // Reset all protection states
    this.isProtectedViewActive = false;
    this.resetKeyStates();
    this.removeAllKeyboardListeners();
    this.stopProtectionMeasures();
    this.clearBlackScreenTimeout();
    
    console.log('✅ Black screen completely reset - application returned to normal state');
    console.log('✅ User can now use the application normally until next trigger');
  }

  async ngOnInit(): Promise<void> {
    await this.loadPDFJS();
    this.loadFiles();
  }

  ngOnDestroy(): void {
    this.cleanupAll();
  }

  private cleanupAll(): void {
    this.cleanupSubscriptions();
    if (this.viewingFile) {
      this.closePopup();
    }
    this.removeAllKeyboardListeners();
    this.stopProtectionMeasures();
    this.clearBlackScreenTimeout();
    this.removeAllWarningElements();
    
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    
    // Note: We DON'T reset black screen state here on component destroy
    // It persists across component destruction until explicit logout
  }

  private cleanupSubscriptions(): void {
    this.blobSubscriptions.forEach(sub => sub.unsubscribe());
    this.blobSubscriptions = [];
  }

  private removeAllKeyboardListeners(): void {
    this.keyboardListeners.forEach(removeFn => {
      try {
        removeFn();
      } catch (e) {
        console.warn('Error removing keyboard listener:', e);
      }
    });
    this.keyboardListeners = [];
  }

  private clearBlackScreenTimeout(): void {
    if (this.blackScreenTimeout) {
      clearTimeout(this.blackScreenTimeout);
      this.blackScreenTimeout = null;
    }
  }

  private removeAllWarningElements(): void {
    this.warningElements.forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.warningElements = [];
  }

  private async loadPDFJS(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && !this.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        script.onload = () => {
          this.pdfjsLib = (window as any)['pdfjsLib'];
          if (this.pdfjsLib) {
            this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve();
        };
        
        script.onerror = () => {
          console.warn('Failed to load PDF.js, using fallback');
          resolve();
        };
        
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  loadFiles(): void {
    // If black screen is active, still load files but UI will show black overlay
    this.isLoading = true;
    this.apiService.getFiles().subscribe({
      next: (res: any[]) => {
        this.files = Array.isArray(res) ? res : [];
        this.calculateStats();
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.files = [];
        this.totalSize = '0 Bytes';
        this.pdfCount = 0;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    const totalBytes = this.files.reduce((acc, file) => acc + (file.fileSize || 0), 0);
    this.totalSize = this.formatFileSize(totalBytes);
    this.pdfCount = this.files.filter(f => 
      f.fileExtension === 'pdf' || f.fileName.toLowerCase().endsWith('.pdf')
    ).length;
  }

  view(fileObj: any): void {
    // Check if black screen is active - if yes, prevent viewing
    if (this.isBlackScreenActive) {
      console.log('🚫 Cannot view - Black screen is active');
      return;
    }
    
    if (fileObj.fileName.toLowerCase().endsWith('.pdf')) {
      this.openPDFInModal(fileObj);
    } else if (this.isImageFile(fileObj.fileName)) {
      this.openImageInModal(fileObj);
    } else {
      this.downloadFile(fileObj);
    }
  }

  openPDFInModal(fileObj: any): void {
    // Double-check black screen state
    if (this.isBlackScreenActive) {
      console.log('🚫 Cannot open PDF - Black screen is active');
      return;
    }
    
    if (this.viewingFile) {
      this.closePopup();
    }
    
    this.resetProtectionStates();
    
    this.viewingFile = fileObj;
    this.isRendering = true;
    this.pdfData = null;
    this.isProtectedViewActive = true;
    this.currentPage = 1;
    this.totalPages = 0;
    this.zoomLevel = 1.0;
    
    this.keyPressCount = 0;
    this.lastKeyTime = 0;
    
    const sub = this.apiService.viewFile(fileObj.fileName).subscribe({
      next: async (blob) => {
        try {
          this.pdfData = {
            blob: blob,
            fileName: fileObj.fileName
          };
          
          if (this.pdfjsLib) {
            const arrayBuffer = await blob.arrayBuffer();
            const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
            
            loadingTask.promise.then((pdf: any) => {
              this.pdfDoc = pdf;
              this.totalPages = pdf.numPages;
              this.viewingFile = {
                ...fileObj,
                isPDF: true,
                loaded: true
              };
              
              this.isRendering = false;
              this.renderCurrentPage();
              
              setTimeout(() => {
                this.setupProtectionMeasures();
                console.log('✅ Advanced protection activated - ANY key will trigger persistent black screen');
              }, 300);
              
            }).catch((error: any) => {
              console.error('Error loading PDF with PDF.js:', error);
              this.showDownloadFallback(fileObj, blob);
            });
          } else {
            this.showDownloadFallback(fileObj, blob);
          }
          
        } catch (error) {
          console.error('Error processing PDF:', error);
          this.showDownloadFallback(fileObj, blob);
        }
      },
      error: (err) => {
        console.error('Error loading PDF:', err);
        alert('Failed to load PDF. Please try downloading the file.');
        this.isRendering = false;
        this.closePopup();
      }
    });
    
    this.blobSubscriptions.push(sub);
  }

  private async renderPage(pageNum: number): Promise<void> {
    if (!this.pdfDoc || pageNum < 1 || pageNum > this.pdfDoc.numPages) {
      return;
    }
    
    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Canvas context not available');
        return;
      }
      
      const viewport = page.getViewport({ scale: this.zoomLevel });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Apply simplified watermark
      this.applySimplifiedWatermark(canvas);
      
      console.log(`✅ Page ${pageNum} rendered successfully`);
      
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  }

  private renderCurrentPage(): void {
    if (this.pdfDoc && this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.renderPage(this.currentPage);
    }
  }

  // ==================== SIMPLIFIED WATERMARK ====================
  
  /**
   * Applies a single subtle watermark in the middle of the document
   * Much lighter than the original version
   */
  private applySimplifiedWatermark(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    
    // Very subtle watermark - only 5% opacity
    ctx.globalAlpha = 0.05;
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotate slightly for better coverage
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    
    // Single watermark in the middle
    ctx.fillText(this.watermarkText, 0, 0);
    
    ctx.restore();
  }

  // ==================== PROTECTION - ANY KEY TRIGGERS PERSISTENT BLACK SCREEN ====================
  
  private setupProtectionMeasures(): void {
    console.log('🛡️ Setting up protection - ANY key will trigger persistent black screen');
    
    this.setupAnyKeyProtection();
    this.setupSimplifiedWatermarkInterval();
    this.startCanvasModifications();
    this.setupVisibilityDetection();
    
    console.log('✅ Protection active - Press ANY key to trigger black screen (persists until logout)');
  }

  /**
   * Sets up interval to reapply simplified watermark
   */
  private setupSimplifiedWatermarkInterval(): void {
    const canvas = this.pdfCanvas?.nativeElement || this.imageCanvas?.nativeElement;
    if (!canvas) return;
    
    if (this.protectionInterval) {
      clearInterval(this.protectionInterval);
    }
    
    this.protectionInterval = setInterval(() => {
      if (this.isProtectedViewActive && canvas && !this.isBlackScreenActive) {
        this.applySimplifiedWatermark(canvas);
      }
    }, 5000); // Reapply every 5 seconds
  }

  /**
   * ANY key press will trigger the black screen
   * Black screen persists until user logs out
   */
  private setupAnyKeyProtection(): void {
    // Remove any existing listeners
    this.removeAllKeyboardListeners();
    this.keyPressCount = 0;
    this.lastKeyTime = 0;
    
    // Main keydown handler - triggers on ANY key press
    const handleAnyKey = (event: KeyboardEvent): boolean => {
      if (!this.isProtectedViewActive || this.isBlackScreenActive) return true;
      
      // Log the key press (for debugging only)
      const key = event.key || 'Unknown';
      console.log(`🔑 Key pressed: ${key} - Triggering persistent black screen`);
      
      // Prevent default behavior
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Activate persistent black screen
      this.activatePersistentBlackScreen();
      
      return false;
    };
    
    // Keyup handler also triggers protection (catches any missed keys)
    const handleAnyKeyUp = (event: KeyboardEvent): boolean => {
      if (!this.isProtectedViewActive || this.isBlackScreenActive) return true;
      
      console.log(`🚨 KEY UP DETECTED - Triggering persistent black screen`);
      
      event.preventDefault();
      event.stopPropagation();
      
      this.activatePersistentBlackScreen();
      
      return false;
    };
    
    // Add multiple listeners at different levels for maximum coverage
    const keyDownListener = this.renderer.listen('document', 'keydown', handleAnyKey);
    const keyUpListener = this.renderer.listen('document', 'keyup', handleAnyKeyUp);
    const windowKeyDownListener = this.renderer.listen('window', 'keydown', handleAnyKey);
    
    // Capture phase listener - catches events before they reach the target
    const captureListener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent): boolean => {
      if (!this.isProtectedViewActive || this.isBlackScreenActive) return true;
      
      console.log('🚨 KEY DETECTED IN CAPTURE PHASE');
      
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      this.activatePersistentBlackScreen();
      
      return false;
    });
    
    this.keyboardListeners.push(
      () => keyDownListener(),
      () => keyUpListener(),
      () => windowKeyDownListener(),
      () => captureListener()
    );
    
    // Block context menu (right click)
    const contextMenuListener = this.renderer.listen('document', 'contextmenu', (event: MouseEvent): boolean => {
      if (this.isProtectedViewActive) {
        console.log('🚨 RIGHT CLICK DETECTED');
        event.preventDefault();
        return false;
      }
      return true;
    });
    
    this.keyboardListeners.push(() => contextMenuListener());
    
    // Block copy/cut events
    const copyListener = this.renderer.listen('document', 'copy', (event: ClipboardEvent): boolean => {
      if (this.isProtectedViewActive) {
        console.log('🚨 COPY DETECTED');
        event.preventDefault();
        return false;
      }
      return true;
    });
    
    const cutListener = this.renderer.listen('document', 'cut', (event: ClipboardEvent): boolean => {
      if (this.isProtectedViewActive) {
        console.log('🚨 CUT DETECTED');
        event.preventDefault();
        return false;
      }
      return true;
    });
    
    this.keyboardListeners.push(() => copyListener(), () => cutListener());
    
    // Add a native listener as backup (not using Renderer2 for maximum reliability)
    const nativeHandler = (event: KeyboardEvent): void => {
      if (!this.isProtectedViewActive || this.isBlackScreenActive) return;
      
      console.log('🚨 NATIVE LISTENER - Key detected');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.activatePersistentBlackScreen();
    };
    
    document.addEventListener('keydown', nativeHandler, true); // true = capture phase
    this.keyboardListeners.push(() => document.removeEventListener('keydown', nativeHandler, true));
  }

  /**
   * Activates persistent black screen that stays until user logs out
   * After logout, everything returns to normal
   */
  private activatePersistentBlackScreen(): void {
    console.log(`🖥️ Activating PERSISTENT black screen (will stay until logout)`);
    
    // If black screen is already active, just return
    if (this.isBlackScreenActive) {
      return;
    }
    
    // Activate black screen - THIS WILL PERSIST UNTIL USER LOGS OUT
    this.isBlackScreenActive = true;
    
    // Save to localStorage so it persists across page reloads
    this.saveBlackScreenState();
    
    // Clear any existing timeout (just to be safe)
    this.clearBlackScreenTimeout();
    
    // NO AUTO-DISAPPEAR TIMER - Black screen stays until user logs out
    console.log('🖥️ Black screen will remain until user logs out');
    console.log('🖥️ After logout, everything will return to normal');
  }

  private reloadImage(): void {
    const canvas = this.imageCanvas?.nativeElement;
    if (!canvas || !this.viewingFile?.blob) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      this.applySimplifiedWatermark(canvas);
    };
    
    const objectUrl = URL.createObjectURL(this.viewingFile.blob);
    img.src = objectUrl;
    
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  private startCanvasModifications(): void {
    // This is now handled by setupSimplifiedWatermarkInterval
    // Keeping this method for compatibility but it does nothing
  }

  private setupVisibilityDetection(): void {
    const handleVisibilityChange = () => {
      if (document.hidden && this.isProtectedViewActive && !this.isBlackScreenActive) {
        this.activatePersistentBlackScreen();
      }
    };
    
    const visibilityListener = this.renderer.listen('document', 'visibilitychange', handleVisibilityChange);
    this.keyboardListeners.push(() => visibilityListener());
  }

  private resetKeyStates(): void {
    this.keyPressCount = 0;
    this.lastKeyTime = 0;
  }

  private resetProtectionStates(): void {
    this.isProtectedViewActive = false;
    // Note: We DON'T reset isBlackScreenActive here
    // It's controlled globally and only reset on logout
    this.resetKeyStates();
    this.removeAllKeyboardListeners();
    this.stopProtectionMeasures();
    this.clearBlackScreenTimeout();
  }

  private stopProtectionMeasures(): void {
    if (this.protectionInterval) {
      clearInterval(this.protectionInterval);
      this.protectionInterval = null;
    }
  }

  openImageInModal(fileObj: any): void {
    // Check if black screen is active
    if (this.isBlackScreenActive) {
      console.log('🚫 Cannot open image - Black screen is active');
      return;
    }
    
    if (this.viewingFile) {
      this.closePopup();
    }
    
    this.resetProtectionStates();
    
    this.viewingFile = fileObj;
    this.isRendering = true;
    this.isProtectedViewActive = true;
    
    this.keyPressCount = 0;
    this.lastKeyTime = 0;
    
    const sub = this.apiService.viewFile(fileObj.fileName).subscribe({
      next: async (blob) => {
        try {
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          
          img.onload = () => {
            const canvas = this.imageCanvas?.nativeElement;
            if (canvas) {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                this.applySimplifiedWatermark(canvas);
              }
            }
            
            this.viewingFile = {
              ...fileObj,
              objectUrl: objectUrl,
              isImage: true,
              blob: blob
            };
            
            this.isRendering = false;
            
            setTimeout(() => {
              this.setupProtectionMeasures();
            }, 300);
          };
          
          img.src = objectUrl;
          
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Failed to load image');
          this.isRendering = false;
          this.closePopup();
        }
      },
      error: (err) => {
        console.error('Error loading image:', err);
        alert('Failed to load image');
        this.isRendering = false;
        this.closePopup();
      }
    });
    
    this.blobSubscriptions.push(sub);
  }

  // Helper methods
  nextPage(): void {
    if (this.currentPage < this.totalPages && !this.isBlackScreenActive) {
      this.currentPage++;
      this.renderCurrentPage();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1 && !this.isBlackScreenActive) {
      this.currentPage--;
      this.renderCurrentPage();
    }
  }

  goToPage(event: Event): void {
    if (this.isBlackScreenActive) return;
    
    const input = event.target as HTMLInputElement;
    const pageNum = parseInt(input.value, 10);
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      this.renderCurrentPage();
    } else {
      input.value = this.currentPage.toString();
    }
  }

  private showDownloadFallback(fileObj: any, blob: Blob): void {
    this.viewingFile = {
      ...fileObj,
      isPDF: true,
      showFallback: true
    };
    
    this.pdfData = {
      blob: blob,
      fileName: fileObj.fileName
    };
    
    this.isRendering = false;
  }

  closePopup(): void {
    console.log('🔒 Closing modal...');
    
    this.stopProtectionMeasures();
    this.clearBlackScreenTimeout();
    this.removeAllKeyboardListeners();
    this.cleanupSubscriptions();
    
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    
    if (this.viewingFile?.objectUrl) {
      URL.revokeObjectURL(this.viewingFile.objectUrl);
    }
    
    this.removeAllWarningElements();
    
    // IMPORTANT: We DON'T reset isBlackScreenActive here
    // The black screen persists even after modal closes until logout
    
    this.viewingFile = null;
    this.pdfData = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.isRendering = false;
    this.zoomLevel = 1.0;
    this.isProtectedViewActive = false;
    
    console.log('✅ Modal closed - black screen state: ' + this.isBlackScreenActive);
    if (this.isBlackScreenActive) {
      console.log('🖥️ Black screen remains active across the application until logout');
    }
  }

  downloadFile(fileObj: any): void {
    // Check if black screen is active
    if (this.isBlackScreenActive) {
      console.log('🚫 Cannot download - Black screen is active');
      return;
    }
    
    const sub = this.apiService.downloadFile(fileObj.fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileObj.fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        alert('Failed to download file');
      }
    });
    
    this.blobSubscriptions.push(sub);
  }

  isImageFile(fileName: string): boolean {
    const ext = this.getFileExtension(fileName).toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return '📁';
    const ext = this.getFileExtension(fileName).toLowerCase();
    
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'svg': case 'webp': return '🖼️';
      case 'txt': return '📃';
      case 'ppt': case 'pptx': return '📽️';
      default: return '📁';
    }
  }

  getFileExtension(filename: string): string {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  getFileType(fileObj: any): string {
    const ext = this.getFileExtension(fileObj.fileName).toLowerCase();
    
    switch (ext) {
      case 'pdf': return 'PDF Document';
      case 'doc': case 'docx': return 'Word Document';
      case 'xls': case 'xlsx': return 'Excel Spreadsheet';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'svg': case 'webp': return 'Image';
      case 'txt': return 'Text File';
      case 'ppt': case 'pptx': return 'PowerPoint';
      default: return fileObj.fileType || 'Document';
    }
  }

  zoomIn(): void {
    if (this.zoomLevel < 3.0 && !this.isBlackScreenActive) {
      this.zoomLevel += 0.1;
      if (this.pdfDoc) {
        this.renderCurrentPage();
      }
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5 && !this.isBlackScreenActive) {
      this.zoomLevel -= 0.1;
      if (this.pdfDoc) {
        this.renderCurrentPage();
      }
    }
  }

  resetZoom(): void {
    if (!this.isBlackScreenActive) {
      this.zoomLevel = 1.0;
      if (this.pdfDoc) {
        this.renderCurrentPage();
      }
    }
  }
}