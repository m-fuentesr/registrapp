import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PerfilDocentePageRoutingModule } from './perfil-docente-routing.module';

import { PerfilDocentePage } from './perfil-docente.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilDocentePageRoutingModule,
    ComponentsModule
  ],
  declarations: [PerfilDocentePage]
})
export class PerfilDocentePageModule {}
