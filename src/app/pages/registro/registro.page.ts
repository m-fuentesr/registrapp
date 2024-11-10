import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { StorageService } from 'src/app/services/dbstorage.service';
import { AuthService } from 'src/app/services/auth.service';

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

  constructor(
    private router: Router,
    private dbstorage: StorageService,
    private authService: AuthService,
    private firestore: AngularFirestore
  ) {}

  async registrarUsuario() {
    this.passwordsMatch = this.usr.password === this.usr.confirmPassword;

    if (this.passwordsMatch) {
      try {
        const userData = {
          firstName: this.usr.firstName,
          lastName: this.usr.lastName,
          email: this.usr.email,
          tipo: this.usr.tipo,
        };

        // Llamar a 'register' en el servicio
        await this.authService.register(this.usr.email, this.usr.password, userData);

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