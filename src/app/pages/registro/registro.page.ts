import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';

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
    confirmPassword: '',
    tipo: 'alumno' //Alumno es el valor default
  };

  passwordsMatch: boolean = true;

  constructor(private router: Router, private dbstorage: StorageService) {}

  async registrarUsuario() {
    this.passwordsMatch = this.usr.password === this.usr.confirmPassword;

    if (this.passwordsMatch) {
      try {
        // Guarda los datos del usuario en el storage
        await this.dbstorage.saveUser(this.usr);
        console.log('Registro exitoso para:', this.usr.firstName, this.usr.lastName, this.usr.email);

        // Redirige a la página de inicio de sesión después del registro
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error al guardar el usuario:', error);
      }
    } else {
      console.log('Las contraseñas no coinciden');
    }
  }
}