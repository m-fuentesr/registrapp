import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    
    // Verifica si el usuario está autenticado
    const user = await this.authService.isAuthenticated();
    
    if (user) {
      return true;
    } else {
      // Si no está autenticado, redirige a la página de login
      this.router.navigate(['/login']);
      return false;
    }
  }
}