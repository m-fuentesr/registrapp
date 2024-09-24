import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoginDocentePageRoutingModule } from './login-docente-routing.module';

import { LoginDocentePage } from './login-docente.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginDocentePageRoutingModule
  ],
  declarations: [LoginDocentePage]
})
export class LoginDocentePageModule {}
