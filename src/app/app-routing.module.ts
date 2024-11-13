import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'asignaturas',
    loadChildren: () => import('./pages/asignaturas/asignaturas.module').then( m => m.AsignaturasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'asistencia',
    loadChildren: () => import('./pages/asistencia/asistencia.module').then( m => m.AsistenciaPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then( m => m.PerfilPageModule),
    canActivate: [AuthGuard]
  },

  {
    path: 'inicio',
    loadChildren: () => import('./pages/inicio/inicio.module').then( m => m.InicioPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'registrar-asistencia',
    loadChildren: () => import('./pages/registrar-asistencia/registrar-asistencia.module').then( m => m.RegistrarAsistenciaPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'apuntes',
    loadChildren: () => import('./pages/apuntes/apuntes.module').then( m => m.ApuntesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'login-docente',
    loadChildren: () => import('./pages/login-docente/login-docente.module').then( m => m.LoginDocentePageModule)
  },
  {
    path: 'seleccionar-login',
    loadChildren: () => import('./pages/seleccionar-login/seleccionar-login.module').then( m => m.SeleccionarLoginPageModule)
  },
  {
    path: 'home-docente',
    loadChildren: () => import('./pages/home-docente/home-docente.module').then( m => m.HomeDocentePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil-docente',
    loadChildren: () => import('./pages/perfil-docente/perfil-docente.module').then( m => m.PerfilDocentePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'asignaturas-docente',
    loadChildren: () => import('./pages/asignaturas-docente/asignaturas-docente.module').then( m => m.AsignaturasDocentePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'recuperar-password',
    loadChildren: () => import('./pages/recuperar-password/recuperar-password.module').then( m => m.RecuperarPasswordPageModule)
  },
  {
    path: 'modificar-password',
    loadChildren: () => import('./pages/modificar-password/modificar-password.module').then( m => m.ModificarPasswordPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'clase-actual',
    loadChildren: () => import('./pages/clase-actual/clase-actual.module').then( m => m.ClaseActualPageModule),
    canActivate: [AuthGuard]
  },






];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
