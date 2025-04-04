import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TimeFormatInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Clone the request to modify it
    let modifiedReq = req;

    if (req.body) {
      const transformedBody = this.formatDates(req.body);
      modifiedReq = req.clone({
        body: transformedBody,
      });
    }

    return next.handle(modifiedReq);
  }

  private formatDates(data: any): any {
    // Recursively traverse the object to format dates
    if (data && typeof data === 'object') {
      for (const key in data) {
        if (data[key] instanceof Date) {
          // Format the Date to the desired format (e.g., ISO string)
          data[key] = this.formatDate(data[key]);
        } else if (typeof data[key] === 'object') {
          // Recurse for nested objects
          data[key] = this.formatDates(data[key]);
        }
      }
    }
    return data;
  }

  private formatDate(date: Date): string {
    // Example: Convert to ISO 8601 format
    return date.toISOString();
  }
}
