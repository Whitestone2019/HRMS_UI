import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiSimpleService {
  // Replace with your actual Gemini API key
  private apiKey = 'AIzaSyBqcIRlIGzUjzK-psazcJkOr_pCN-JFQuc';
  private model = 'gemini-1.5-flash';
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private http: HttpClient) {}

  /**
   * Simple method to ask Gemini a question
   */
  ask(question: string): Observable<string> {
    const body = {
      contents: [{
        parts: [{ text: question }]
      }]
    };

    return new Observable<string>(observer => {
      this.http.post<any>(
        `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        body
      ).subscribe({
        next: (response) => {
          const answer = response?.candidates?.[0]?.content?.parts?.[0]?.text 
                        || "Sorry, I couldn't generate a response.";
          observer.next(answer);
          observer.complete();
        },
        error: (error) => {
          console.error('Gemini API Error:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Test if Gemini is working
   */
  testConnection(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.ask('Say "Hello" if you can hear me').subscribe({
        next: (response) => {
          console.log('Gemini test response:', response);
          observer.next(true);
          observer.complete();
        },
        error: (error) => {
          console.error('Gemini test failed:', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}