import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClaseActualPageRoutingModule } from './clase-actual-routing.module';

import { ClaseActualPage } from './clase-actual.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClaseActualPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ClaseActualPage]
})
export class ClaseActualPageModule {}
