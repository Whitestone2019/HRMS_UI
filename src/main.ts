import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Set the backend URL dynamically
//(window as any)['backendUrl'] = `http://${window.location.hostname}:${window.location.port || '8080'}`;
(window as any)['backendUrl'] = `http://${window.location.hostname}:9094`;
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));