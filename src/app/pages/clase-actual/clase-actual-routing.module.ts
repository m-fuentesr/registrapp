import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClaseActualPage } from './clase-actual.page';

const routes: Routes = [
  {
    path: '',
    component: ClaseActualPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClaseActualPageRoutingModule {}
