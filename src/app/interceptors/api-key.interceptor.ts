import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Clone the request and add the API key header
    const modifiedReq = req.clone({
      headers: req.headers.set('apiKey', environment.apiKey), // Add the API key header
    });

    // Pass the modified request to the next handler
    return next.handle(modifiedReq);
  }
}