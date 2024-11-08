import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login-docente',
  templateUrl: './login-docente.page.html',
  styleUrls: ['./login-docente.page.scss'],
})
export class LoginDocentePage implements OnInit {

  usr: Usuario = {
    email: '',
    password: '',
    tipo: 'docente' // 'docente' es el valor predeterminado para este login
  };

  constructor(
    private router: Router, 
    private dbstorage: StorageService,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  async iniciarSesion() {
    console.log("Submit del formulario");

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.usr.email, this.usr.password);
      const storedUser = userCredential.user; // Recuperar el usuario almacenado

      // Verificar si el usuario existe y las credenciales son correctas
      if (storedUser) {

        // Obtener el tipo de usuario desde Firestore
        const userDoc = await lastValueFrom(this.firestore.collection('usuarios').doc(storedUser.uid).get());
        console.log('¡Autorizado!');

        if (userDoc.exists) {
          const userData: any = userDoc.data();

          // Verificar que el tipo de usuario sea 'docente'
          if (userData['tipo'] === 'docente') {
            this.router.navigate(['/home-docente']); // Redirigir a home si es docente
          } else {
            // Si es un alumno, mostrar alerta
            this.mostrarAlerta('Acceso denegado', 'Solo los docentes pueden acceder a esta página.');
          }
        }  
      }

    } catch (error) {
      // Si las credenciales son incorrectas, mostrar alerta
      this.mostrarAlerta('Credenciales incorrectas', 'Por favor, intente de nuevo.');
    }
  }

  // Método para mostrar la alerta
  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

  recuperarPassword() {
    this.router.navigate(['/recuperar-password']);
  }
}