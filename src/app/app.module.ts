import { AppComponent } from './app.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'

import { AuthInterceptorService } from './auth/auth-interceptor.service';

import { AlertComponent } from './shared/alert/alert.component';

import { HeaderComponent } from './header/header.component';

import { SharedModule } from './shared/shared.module';

import { StoreModule } from '@ngrx/store'
import { shoppingListReducer } from './shopping-list/store/shopping-list.reducer';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,

    StoreModule.forRoot({shoppingList: shoppingListReducer})
  ],
  providers: [
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent],

  entryComponents: [
    AlertComponent
  ]
})
export class AppModule { }
