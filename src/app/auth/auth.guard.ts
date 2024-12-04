import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    // Verificar si el usuario está autenticado en Firebase
    const firebaseUser = await this.authService.isAuthenticated();
    
    if (firebaseUser) {
      return true;
    }

    // Si no está autenticado en Firebase, intentar obtener el usuario desde el almacenamiento local
    const localUser = await this.authService.getUserFromLocalStorage('');
    
    if (localUser) {
      // Si el usuario está en el almacenamiento local, considerarlo como autenticado
      return true;
    }
    
    // Si no está autenticado ni en Firebase ni en almacenamiento local, redirigir al inicio
    this.router.navigate(['/inicio']);
    return false;
  }
}
