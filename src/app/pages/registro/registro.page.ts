import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
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
    tipo: 'alumno' // "alumno" es el valor por defecto
  };

  // Variable para mensajes de error
  errorMessages = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  passwordsMatch: boolean = true;

  constructor(
    private router: Router,
    private dbstorage: StorageService,
    private authService: AuthService
  ) {}

  // Método de validación
  validarDatos(): boolean {
    let valid = true;

    // Validación del primer nombre: comienza con mayúscula y tiene al menos 3 caracteres
    if (!/^[A-Z][a-z]{2,}$/.test(this.usr.firstName || '')) {
      this.errorMessages.firstName = 'El nombre debe comenzar con mayúscula y tener al menos 3 caracteres.';
      valid = false;
    } else {
      this.errorMessages.firstName = '';
    }

    // Validación del apellido: comienza con mayúscula y tiene al menos 3 caracteres
    if (!/^[A-Z][a-z]{2,}$/.test(this.usr.lastName || '')) {
      this.errorMessages.lastName = 'El apellido debe comenzar con mayúscula y tener al menos 3 caracteres.';
      valid = false;
    } else {
      this.errorMessages.lastName = '';
    }

    // Validación del correo electrónico: formato de correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.usr.email || '')) {
      this.errorMessages.email = 'El correo debe tener un formato válido.';
      valid = false;
    } else {
      this.errorMessages.email = '';
    }

    // Validación de la contraseña: debe tener más de 5 caracteres
    if ((this.usr.password || '').length <= 5) {
      this.errorMessages.password = 'La contraseña debe tener más de 5 caracteres.';
      valid = false;
    } else {
      this.errorMessages.password = '';
    }

    // Validación de coincidencia de contraseñas
    this.passwordsMatch = this.usr.password === this.usr.confirmPassword;
    if (!this.passwordsMatch) {
      this.errorMessages.confirmPassword = 'Las contraseñas no coinciden.';
      valid = false;
    } else {
      this.errorMessages.confirmPassword = '';
    }

    return valid;
  }

  // Método para registrar el usuario
  async registrarUsuario() {
    if (this.validarDatos()) { // Solo intenta registrar si los datos son válidos
      const userData = {
        firstName: this.usr.firstName,
        lastName: this.usr.lastName,
        email: this.usr.email,
        password: this.usr.password,
        tipo: this.usr.tipo,
      };
  
      try {
        const status = navigator.onLine; // Verificar si hay conexión
  
        if (status) {
          // Registro online
          await this.authService.register(this.usr.email, this.usr.password, userData);
          console.log('Registro exitoso en línea para:', userData);
  
          // Redirige al login correspondiente
          this.redirectAfterRegistration(this.usr.tipo);
        } else {
          // Sin conexión: guardar usuario en almacenamiento local para sincronización
          await this.dbstorage.saveUserOffline(userData);
          console.log('Usuario guardado localmente para sincronización:', userData);
  
          // Informar al usuario sobre el registro offline
          alert('Registro completado sin conexión. Se sincronizará cuando haya Internet.');
  
          // Redirige al login correspondiente
          this.redirectAfterRegistration(this.usr.tipo);
        }
      } catch (error) {
        console.error('Error al registrar usuario:', error);
      }
    } else {
      console.log('Error en la validación de los datos.');
    }
  }
  
  redirectAfterRegistration(tipo: string) {
    if (tipo === 'alumno') {
      this.router.navigate(['/login']);
    } else if (tipo === 'docente') {
      this.router.navigate(['/login-docente']);
    }
  }
}