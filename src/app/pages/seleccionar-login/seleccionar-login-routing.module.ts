import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeleccionarLoginPage } from './seleccionar-login.page';

const routes: Routes = [
  {
    path: '',
    component: SeleccionarLoginPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeleccionarLoginPageRoutingModule {}
