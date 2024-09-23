import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistrarAsistenciaPageRoutingModule } from './registrar-asistencia-routing.module';

import { RegistrarAsistenciaPage } from './registrar-asistencia.page';
import { ComponentsModule } from "../../components/components.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrarAsistenciaPageRoutingModule,
    ComponentsModule
],
  declarations: [RegistrarAsistenciaPage]
})
export class RegistrarAsistenciaPageModule {}
