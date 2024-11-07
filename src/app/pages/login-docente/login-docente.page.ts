import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';
import { AlertController } from '@ionic/angular';

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
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  async iniciarSesion() {
    console.log("Submit del formulario");

    // Recuperar el usuario almacenado
    const storedUser = await this.dbstorage.getUser();

    // Verificar si el usuario existe y las credenciales son correctas
    if (storedUser && storedUser.email === this.usr.email && storedUser.password === this.usr.password) {
      console.log('¡Autorizado!');

      // Verificar que el tipo de usuario sea 'docente'
      if (storedUser.tipo === 'docente') {
        this.router.navigate(['/home-docente']); // Redirigir a home-docente si es docente
      } else {
        this.mostrarAlertaAccesoDenegado(); // Mostrar alerta de acceso denegado
      }
    } else {
      console.log("Credenciales incorrectas. Intente de nuevo.");
      this.mostrarAlertaAccesoDenegado(); // Mostrar alerta si las credenciales son incorrectas
    }
  }

  // Mostrar alerta de acceso denegado
  async mostrarAlertaAccesoDenegado() {
    const alert = await this.alertController.create({
      header: 'Acceso Denegado',
      message: 'Solo los usuarios con tipo "Docente" pueden acceder a esta página.',
      buttons: ['OK']
    });

    // Mostrar la alerta
    await alert.present();
  }

  recuperarPassword() {
    this.router.navigate(['/recuperar-password']);
  }
}