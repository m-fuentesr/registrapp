import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PerfilDocentePage } from './perfil-docente.page';

const routes: Routes = [
  {
    path: '',
    component: PerfilDocentePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilDocentePageRoutingModule {}
