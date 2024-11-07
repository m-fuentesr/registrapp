import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
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

  constructor(
    private router: Router,
    private dbstorage: StorageService,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  async registrarUsuario() {
    this.passwordsMatch = this.usr.password === this.usr.confirmPassword;

    if (this.passwordsMatch) {
      try {
        // Crear el usuario en Firebase Authentication
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(
          this.usr.email,
          this.usr.password
        );

        // Guardar datos adicionales en Firestore
        await this.firestore.collection('usuarios').doc(userCredential.user?.uid).set({
          firstName: this.usr.firstName,
          lastName: this.usr.lastName,
          email: this.usr.email,
          tipo: this.usr.tipo,
        });

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