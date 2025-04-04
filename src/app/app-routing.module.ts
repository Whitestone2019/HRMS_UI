import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  imports: [RouterModule.forRoot(routes)],  // Configure the routes
  exports: [RouterModule],                    // Export RouterModule for use in other modules
})
export class AppRoutingModule { }