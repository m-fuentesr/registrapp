import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeDocentePage } from './home-docente.page';

const routes: Routes = [
  {
    path: '',
    component: HomeDocentePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeDocentePageRoutingModule {}
