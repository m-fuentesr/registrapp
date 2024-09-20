import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage {
  usr: Usuario = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  passwordsMatch: boolean = true;

  constructor(private router: Router) {}

  registrarUsuario() {
   
    this.passwordsMatch = this.usr.password === this.usr.confirmPassword;

    if (this.passwordsMatch) {
      console.log('Registro exitoso para:', this.usr.firstName, this.usr.lastName, this.usr.email);

      this.router.navigate(['/login']);
    } else {
      console.log('Las contraseñas no coinciden');

    }
  }
}