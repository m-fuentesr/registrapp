import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
})
export class RecuperarPasswordPage {
  email: string = '';

  constructor(private authService: AuthService) {}

  recuperarPassword() {
    if (this.email) {
      this.authService.resetPassword(this.email);
    } else {
      console.error('Por favor, ingresa un correo electrónico válido.');
    }
  }
}