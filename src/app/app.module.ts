import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { IonicStorageModule } from '@ionic/storage-angular';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';

import { StorageService } from './services/dbstorage.service';

const firebaseConfig = {
  apiKey: "AIzaSyA8NlQWkaKqE24HT-EdwjnplRz3NFCtKoU",
  authDomain: "registrapp-f96cb.firebaseapp.com",
  projectId: "registrapp-f96cb",
  storageBucket: "registrapp-f96cb.appspot.com",
  messagingSenderId: "445281907707",
  appId: "1:445281907707:web:34d2fabebebd16493d115e",
  measurementId: "G-PKSCWGRYHK"
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AppRoutingModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, StorageService],
  bootstrap: [AppComponent],
})
export class AppModule { }
