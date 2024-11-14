import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { lastValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  usr: Usuario = {
    email: '',
    password: '',
    tipo: 'alumno' // 'alumno' es el valor predeterminado
  };

  constructor(
    private router: Router, 
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  async iniciarSesion() {
    console.log("Submit del formulario");

    // Verificar si hay conexión de red
    const networkStatus = await Network.getStatus();
    if (networkStatus.connected) {
      try {
        // Intentar iniciar sesión con Firebase
        const userCredential = await this.afAuth.signInWithEmailAndPassword(this.usr.email, this.usr.password);
        const storedUser = userCredential.user;

        // Verificar si el usuario existe
        if (storedUser) {
          // Obtener el tipo de usuario desde Firestore
          const userDoc = await lastValueFrom(this.firestore.collection('usuarios').doc(storedUser.uid).get());
          console.log('¡Autorizado!');

          if (userDoc.exists) {
            const userData: any = userDoc.data();

            // Verificar que el tipo de usuario sea 'alumno'
            if (userData['tipo'] === 'alumno') {
              // Guardar datos del usuario en el almacenamiento local
              await this.authService.saveUserLocally({
                uid: storedUser.uid,
                email: this.usr.email,
                tipo: userData['tipo']
              });
              this.router.navigate(['/home']); // Redirigir a home si es alumno
            } else {
              // Mostrar alerta si el usuario no es un alumno
              this.mostrarAlerta('Acceso denegado', 'Solo los alumnos pueden acceder a esta página.');
            }
          }  
        }
      } catch (error) {
        // Mostrar alerta si las credenciales son incorrectas
        this.mostrarAlerta('Credenciales incorrectas', 'Por favor, intente de nuevo.');
      }
    } else {
      // Sin conexión: intentar cargar usuario desde almacenamiento local
      const localUser = await this.authService.getUserFromLocalStorage();
      
      if (localUser && localUser.email === this.usr.email && localUser.tipo === 'alumno') {
        this.router.navigate(['/home']);
      } else {
        this.mostrarAlerta('Acceso sin conexión', 'No se encontraron datos locales. Inicie sesión en línea al menos una vez.');
      }
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