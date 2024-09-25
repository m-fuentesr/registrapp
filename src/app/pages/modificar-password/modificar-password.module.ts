import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ModificarPasswordPageRoutingModule } from './modificar-password-routing.module';

import { ModificarPasswordPage } from './modificar-password.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ModificarPasswordPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ModificarPasswordPage]
})
export class ModificarPasswordPageModule {}
