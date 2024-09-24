import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AsignaturasDocentePage } from './asignaturas-docente.page';

const routes: Routes = [
  {
    path: '',
    component: AsignaturasDocentePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsignaturasDocentePageRoutingModule {}
