import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';
import { AlertController } from '@ionic/angular';

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

      // Verificar que el tipo de usuario sea 'alumno'
      if (storedUser.tipo === 'alumno') {
        this.router.navigate(['/home']); // Redirigir a home si es alumno
      } else {
        // Si es un docente, mostrar alerta
        this.mostrarAlerta('Acceso denegado', 'Solo los alumnos pueden acceder a esta página.');
      }
    } else {
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