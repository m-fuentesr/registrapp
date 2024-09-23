import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApuntesPage } from './apuntes.page';

const routes: Routes = [
  {
    path: '',
    component: ApuntesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApuntesPageRoutingModule {}
