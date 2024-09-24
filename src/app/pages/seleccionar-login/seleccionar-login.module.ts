import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeleccionarLoginPageRoutingModule } from './seleccionar-login-routing.module';

import { SeleccionarLoginPage } from './seleccionar-login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeleccionarLoginPageRoutingModule
  ],
  declarations: [SeleccionarLoginPage]
})
export class SeleccionarLoginPageModule {}
