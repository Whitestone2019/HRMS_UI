// import { Component, OnInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { ApiService, ChatMessage, ChatResponse, UserInfo } from '../api.service';
// import { GeminiSimpleService } from '../../gemini-simple.service';
// import { Router, NavigationStart } from '@angular/router';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-chatbot',
//   templateUrl: './chatbot.component.html',
//   styleUrls: ['./chatbot.component.css']
// })
// export class ChatbotComponent implements OnInit, OnDestroy {
//   @ViewChild('chatMessages') private chatMessagesRef!: ElementRef;
//   @ViewChild('chatToggle') private chatToggleRef!: ElementRef;
  
//   messages: ChatMessage[] = [];
//   chatForm: FormGroup;
//   isOpen = false;
//   isLoading = false;
//   suggestions: string[] = [];
//   showSuggestions = true;
//   userId: string;
//   employeeId: string;
//   userName: string = 'Guest';
//   userInitials: string = 'G';
  
//   // AI Settings
//   useGemini = true;
//   geminiAvailable = false;
  
//   // Draggable properties
//   isDragging = false;
//   dragOffsetX = 0;
//   dragOffsetY = 0;
//   currentX = window.innerWidth - 100;
//   currentY = window.innerHeight - 100;
  
//   // Router subscription
//   private routerSubscription: Subscription;
  
//   constructor(
//     private fb: FormBuilder,
//     private apiService: ApiService,
//     private geminiService: GeminiSimpleService,
//     private router: Router
//   ) {
//     this.chatForm = this.fb.group({
//       message: ['', [Validators.required, Validators.minLength(1)]]
//     });
    
//     this.userId = localStorage.getItem('userId') || 'user-' + Math.random().toString(36).substr(2, 9);
//     this.employeeId = localStorage.getItem('employeeId') || 'EMP001';
    
//     localStorage.setItem('userId', this.userId);
//     localStorage.setItem('employeeId', this.employeeId);
    
//     this.loadPosition();
    
//     // Subscribe to router events to detect logout/navigation
//     this.routerSubscription = this.router.events.subscribe(event => {
//       if (event instanceof NavigationStart) {
//         // Check if navigating to login page (logout)
//         if (event.url.includes('/login') || event.url === '/') {
//           console.log('Logout detected, clearing chat...');
//           this.clearChatOnLogout();
//         }
//       }
//     });
//   }
  
//   ngOnInit(): void {
//     // First, fetch user info
//     this.fetchUserInfo();
    
//     this.loadHistory();
//     this.loadSuggestions();
//     this.testGeminiConnection();
//   }
  
//   ngOnDestroy(): void {
//     // Unsubscribe to prevent memory leaks
//     if (this.routerSubscription) {
//       this.routerSubscription.unsubscribe();
//     }
//   }
  
//   /**
//    * Fetch logged-in user information from backend
//    */
//   fetchUserInfo(): void {
//     this.apiService.getUserInfo(this.employeeId).subscribe({
//       next: (response: any) => {
//         if (response && response.success && response.userInfo) {
//           const userInfo = response.userInfo;
//           this.userName = userInfo.name || 'Employee';
//           this.userInitials = userInfo.profileInitials || 'E';
          
//           // Store in localStorage for persistence
//           localStorage.setItem('userName', this.userName);
//           localStorage.setItem('userInitials', this.userInitials);
          
//           console.log('User info loaded:', this.userName);
//         }
//       },
//       error: (error: any) => {
//         console.error('Error fetching user info:', error);
//         // Try to get from localStorage as fallback
//         this.userName = localStorage.getItem('userName') || 'Employee';
//         this.userInitials = localStorage.getItem('userInitials') || 'E';
//       }
//     });
//   }
  
//   /**
//    * Initialize chat with welcome message
//    */
//   initializeChat(): void {
//     this.apiService.initializeChat(this.userId, this.employeeId).subscribe({
//       next: (response: any) => {
//         if (response && response.success) {
//           // Clear existing messages
//           this.messages = [];
          
//           // Add welcome message with user info
//           if (response.welcomeMessage) {
//             this.messages.push({
//               userMessage: response.welcomeMessage,
//               timestamp: new Date(),
//               messageType: 'ASSISTANT',
//               id: 'welcome-' + Date.now()
//             });
//           }
          
//           // Update user info if provided
//           if (response.userInfo) {
//             this.userName = response.userInfo.name || this.userName;
//             this.userInitials = response.userInfo.profileInitials || this.userInitials;
//             localStorage.setItem('userName', this.userName);
//             localStorage.setItem('userInitials', this.userInitials);
//           }
          
//           this.scrollToBottom();
//         }
//       },
//       error: (error: any) => {
//         console.error('Error initializing chat:', error);
//         // Fallback welcome message
//         this.messages = [{
//           userMessage: `Hello ${this.userName}! I'm your HRMS Assistant. How can I help you today?`,
//           timestamp: new Date(),
//           messageType: 'ASSISTANT',
//           id: 'welcome-' + Date.now()
//         }];
//       }
//     });
//   }
  
//   /**
//    * Clear chat on logout - This method handles complete chat cleanup
//    */
//   clearChatOnLogout(): void {
//     // Clear local messages array
//     this.messages = [];
    
//     // Clear suggestions
//     this.suggestions = [];
//     this.showSuggestions = true;
    
//     // Close chat window if open
//     this.isOpen = false;
    
//     // Clear any form data
//     this.chatForm.reset();
    
//     // Stop any ongoing loading states
//     this.isLoading = false;
    
//     // Clear chat history from backend
//     this.apiService.clearHistory(this.userId).subscribe({
//       next: (response: any) => {
//         console.log('Chat history cleared from backend on logout', response);
//       },
//       error: (error: any) => {
//         console.error('Error clearing backend chat on logout', error);
//       }
//     });
    
//     console.log('Chat successfully cleared on logout');
//   }
  
//   /**
//    * Public method that can be called from outside (e.g., from logout component)
//    */
//   public logoutAndClearChat(): void {
//     this.clearChatOnLogout();
//   }
  
//   // ========== SCROLL TO BOTTOM FUNCTION ==========
//   /**
//    * Scroll to bottom of chat - Call this ONLY when new messages arrive
//    */
//   private scrollToBottom(): void {
//     try {
//       setTimeout(() => {
//         if (this.chatMessagesRef && this.chatMessagesRef.nativeElement) {
//           this.chatMessagesRef.nativeElement.scrollTop = 
//             this.chatMessagesRef.nativeElement.scrollHeight;
//         }
//       }, 100); // Small delay to ensure DOM is updated
//     } catch(err) { 
//       console.error('Scroll error:', err);
//     }
//   }
  
//   loadHistory(): void {
//     // Don't load history if messages are empty (on logout)
//     if (this.messages.length === 0) {
//       this.initializeChat();
//       return;
//     }
    
//     this.apiService.getHistory(10, this.userId).subscribe({
//       next: (response: any) => {
//         if (response && response.success && response.history) {
//           this.messages = [];
          
//           response.history.forEach((msg: ChatMessage) => {
//             if (msg.userMessage) {
//               this.messages.push({
//                 userMessage: msg.userMessage,
//                 timestamp: msg.timestamp,
//                 messageType: 'USER'
//               });
//             }
//             if (msg.assistantResponse) {
//               this.messages.push({
//                 userMessage: msg.assistantResponse,
//                 id: msg.id,
//                 timestamp: msg.timestamp,
//                 messageType: 'ASSISTANT',
//                 requiresHuman: msg.requiresHuman
//               });
//             }
//           });
          
//           // Scroll to bottom after loading history
//           this.scrollToBottom();
//         } else {
//           this.initializeChat();
//         }
//       },
//       error: (error: any) => {
//         console.error('Error loading history:', error);
//         this.initializeChat();
//       }
//     });
//   }
  
//   loadSuggestions(): void {
//     // Don't load suggestions if messages are empty (on logout)
//     if (this.messages.length === 0) {
//       return;
//     }
    
//     this.apiService.getSuggestions().subscribe({
//       next: (response: any) => {
//         if (response && response.success) {
//           this.suggestions = response.suggestions || [];
//         }
//       },
//       error: (error: any) => {
//         console.error('Error loading suggestions:', error);
//         this.suggestions = [
//           "How to view timesheet?",
//           "How to check leave status?",
//           "Today's attendance",
//           "Update personal details",
//           "Upload ID card photo"
//         ];
//       }
//     });
//   }
  
//   toggleChat(): void {
//     if (!this.isDragging) {
//       this.isOpen = !this.isOpen;
//       if (this.isOpen) {
//         // Scroll to bottom when opening chat
//         setTimeout(() => this.scrollToBottom(), 200);
//       }
//     }
//   }
  
//   sendMessage(): void {
//     if (this.chatForm.invalid) return;
    
//     const messageText = this.chatForm.get('message')?.value;
    
//     // Add user message to UI
//     this.messages.push({
//       userMessage: messageText,
//       timestamp: new Date(),
//       messageType: 'USER'
//     });
    
//     // Scroll to bottom after user message
//     this.scrollToBottom();
    
//     this.chatForm.reset();
//     this.showSuggestions = false;
//     this.isLoading = true;
    
//     // Check if it's clearly a non-HR question - go directly to Gemini
//     if (!this.isHrQuestion(messageText) && this.geminiAvailable) {
//       console.log('Non-HR question detected, going directly to Gemini');
//       this.tryGeminiResponse(messageText);
//       return;
//     }
    
//     // Try backend first for HR questions
//     this.apiService.sendMessage(messageText, this.userId, this.employeeId).subscribe({
//       next: (response: ChatResponse) => {
//         if (response && response.success) {
//           const responseText = response.message || '';
          
//           // Add assistant response
//           this.messages.push({
//             userMessage: responseText,
//             id: response.messageId,
//             timestamp: new Date(response.timestamp),
//             messageType: 'ASSISTANT',
//             requiresHuman: response.requiresHuman,
//             intentType: response.intent,
//             sessionId: response.sessionId
//           });
          
//           // Update user info if provided in response
//           if (response.userInfo) {
//             this.userName = response.userInfo.name || this.userName;
//             this.userInitials = response.userInfo.profileInitials || this.userInitials;
//             localStorage.setItem('userName', this.userName);
//             localStorage.setItem('userInitials', this.userInitials);
//           }
          
//           // SCROLL TO BOTTOM - New response received!
//           this.scrollToBottom();
          
//           if (response.actionType) {
//             this.handleAction(response);
//           }
          
//           if (response.suggestions && response.suggestions.length > 0) {
//             this.suggestions = response.suggestions;
//           }
          
//           this.isLoading = false;
//           this.showSuggestions = true;
//         } else {
//           // Backend unsuccessful, try Gemini
//           this.tryGeminiResponse(messageText);
//         }
//       },
//       error: (error: any) => {
//         console.error('Backend error, trying Gemini...', error);
//         this.tryGeminiResponse(messageText);
//       }
//     });
//   }
  
//   tryGeminiResponse(message: string): void {
//     if (!this.useGemini) {
//       this.showErrorMessage('AI is disabled. Please contact support.');
//       return;
//     }
    
//     if (!this.geminiAvailable) {
//       this.showErrorMessage('Gemini AI is not available. Please check your API key.');
//       return;
//     }
    
//     // Show AI thinking indicator
//     this.messages.push({
//       userMessage: '🤖 Let me think about that...',
//       timestamp: new Date(),
//       messageType: 'ASSISTANT'
//     });
    
//     // Scroll to bottom to show thinking indicator
//     this.scrollToBottom();
    
//     // Call Gemini
//     this.geminiService.ask(message).subscribe({
//       next: (aiResponse: string) => {
//         // Remove the thinking message
//         this.messages.pop();
        
//         // Add AI response
//         this.messages.push({
//           userMessage: aiResponse,
//           timestamp: new Date(),
//           messageType: 'ASSISTANT'
//         });
        
//         // SCROLL TO BOTTOM - New AI response received!
//         this.scrollToBottom();
        
//         this.isLoading = false;
//         this.showSuggestions = true;
//       },
//       error: (error: any) => {
//         console.error('Gemini error:', error);
        
//         // Remove thinking message
//         this.messages.pop();
        
//         this.showErrorMessage('Gemini AI is having trouble. Please try again later.');
//         this.isLoading = false;
//       }
//     });
//   }
  
//   // Helper method to check if question is HR-related
//   private isHrQuestion(question: string): boolean {
//     const hrKeywords = [
//       'leave', 'attendance', 'timesheet', 'project', 'profile',
//       'salary', 'holiday', 'policy', 'resignation', 'employee',
//       'hr', 'benefit', 'payroll', 'training', 'onboarding',
//       'check in', 'check out', 'absent', 'present', 'overtime'
//     ];
//     const lowerQuestion = question.toLowerCase();
//     return hrKeywords.some(keyword => lowerQuestion.includes(keyword));
//   }
  
//   testGeminiConnection(): void {
//     this.geminiService.testConnection().subscribe({
//       next: (isWorking: boolean) => {
//         this.geminiAvailable = isWorking;
//         if (isWorking) {
//           console.log('✅ Gemini AI is connected and ready!');
//         } else {
//           console.warn('⚠️ Gemini AI connection failed. Check your API key.');
//         }
//       },
//       error: (error: any) => {
//         console.error('Gemini test error:', error);
//         this.geminiAvailable = false;
//       }
//     });
//   }
  
//   showErrorMessage(message: string): void {
//     this.messages.push({
//       userMessage: message || "I'm having trouble. Please try again.",
//       timestamp: new Date(),
//       messageType: 'SYSTEM',
//       requiresHuman: true
//     });
    
//     // Scroll to bottom to show error message
//     this.scrollToBottom();
//   }
  
//   handleAction(response: ChatResponse): void {
//     switch(response.actionType) {
//       case 'LEAVE_APPLICATION':
//         alert('Redirecting to Leave Application page...');
//         break;
//       case 'ATTENDANCE_CHECK':
//         alert('Attendance data: ' + (response.actionData || 'Available'));
//         break;
//       case 'PROFILE_INFO':
//         console.log('Profile info displayed');
//         break;
//       case 'LEAVE_BALANCE':
//         alert('Leave balance: ' + (response.actionData || 'Check portal'));
//         break;
//       default:
//         console.log('Unknown action:', response.actionType);
//     }
//   }
  
//   useSuggestion(suggestion: string): void {
//     this.chatForm.patchValue({ message: suggestion });
//     this.sendMessage();
//   }
  
//   clearChat(): void {
//     this.messages = [{
//       userMessage: `Hello ${this.userName}! Chat history cleared. How can I help you?`,
//       timestamp: new Date(),
//       messageType: 'ASSISTANT',
//       id: 'clear-' + Date.now()
//     }];
//     this.showSuggestions = true;
//     this.loadSuggestions();
    
//     // Scroll to bottom after clearing
//     this.scrollToBottom();
    
//     this.apiService.clearHistory(this.userId).subscribe({
//       next: (response: any) => {
//         console.log('Backend cleared', response);
//       },
//       error: (error: any) => {
//         console.error('Backend clear failed', error);
//       }
//     });
//   }
  
//   rateMessage(message: ChatMessage, rating: number): void {
//     if (message.id) {
//       this.apiService.addFeedback(message.id, rating).subscribe({
//         next: (response: any) => {
//           if (response && response.success) {
//             console.log('Feedback recorded');
//             message.feedbackRating = rating;
//           }
//         },
//         error: (error: any) => {
//           console.error('Error adding feedback:', error);
//         }
//       });
//     }
//   }
  
//   // ========== DRAGGABLE FUNCTIONALITY ==========
  
//   onDragStart(event: MouseEvent): void {
//     const target = event.target as HTMLElement;
//     if (!target.closest('.chat-toggle')) {
//       return;
//     }
    
//     event.preventDefault();
//     event.stopPropagation();
    
//     this.isDragging = true;
    
//     const rect = this.chatToggleRef.nativeElement.getBoundingClientRect();
//     this.dragOffsetX = event.clientX - rect.left;
//     this.dragOffsetY = event.clientY - rect.top;
    
//     document.body.classList.add('dragging-chatbot');
//   }
  
//   @HostListener('document:mousemove', ['$event'])
//   onDragMove(event: MouseEvent): void {
//     if (!this.isDragging) return;
    
//     event.preventDefault();
    
//     let newX = event.clientX - this.dragOffsetX;
//     let newY = event.clientY - this.dragOffsetY;
    
//     const buttonWidth = 60;
//     const buttonHeight = 60;
    
//     newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
//     newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));
    
//     this.currentX = newX;
//     this.currentY = newY;
    
//     this.savePosition();
//   }
  
//   @HostListener('document:mouseup')
//   onDragEnd(): void {
//     if (this.isDragging) {
//       this.isDragging = false;
//       document.body.classList.remove('dragging-chatbot');
//     }
//   }
  
//   private savePosition(): void {
//     const position = { x: this.currentX, y: this.currentY };
//     localStorage.setItem('chatbotPosition', JSON.stringify(position));
//   }
  
//   private loadPosition(): void {
//     const saved = localStorage.getItem('chatbotPosition');
//     if (saved) {
//       try {
//         const position = JSON.parse(saved);
//         this.currentX = position.x;
//         this.currentY = position.y;
//       } catch (e) {
//         console.error('Error loading position', e);
//       }
//     } else {
//       this.currentX = window.innerWidth - 100;
//       this.currentY = window.innerHeight - 100;
//     }
//   }
  
//   resetPosition(): void {
//     this.currentX = window.innerWidth - 100;
//     this.currentY = window.innerHeight - 100;
//     this.savePosition();
//   }
  
//   getToggleStyles(): any {
//     return {
//       'position': 'fixed',
//       'left.px': this.currentX,
//       'top.px': this.currentY,
//       'cursor': this.isDragging ? 'grabbing' : 'grab',
//       'z-index': '10000',
//       'transition': this.isDragging ? 'none' : 'box-shadow 0.3s ease, transform 0.2s ease'
//     };
//   }
  
//   getWindowPosition(): any {
//     return {
//       'position': 'fixed',
//       'left.px': this.currentX - 320,
//       'top.px': this.currentY - 620,
//       'z-index': '9999'
//     };
//   }
  
//   @HostListener('window:resize')
//   onResize(): void {
//     const buttonWidth = 60;
//     const buttonHeight = 60;
//     this.currentX = Math.min(this.currentX, window.innerWidth - buttonWidth);
//     this.currentY = Math.min(this.currentY, window.innerHeight - buttonHeight);
//     this.savePosition();
//   }
// }