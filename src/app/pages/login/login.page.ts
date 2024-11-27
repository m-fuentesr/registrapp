import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { AlertController } from '@ionic/angular';
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
        const tipoCorrecto = await this.authService.login(this.usr.email, this.usr.password, 'alumno');
    
        if (tipoCorrecto) {
          this.router.navigate(['/home']);
        } else {
          this.mostrarAlerta('Acceso denegado', 'Este usuario no está registrado como alumno.');
        }
      } catch (error) {
        console.error('Error en inicio de sesión de alumno:', error);
        this.mostrarAlerta('Error de inicio de sesión', 'Credenciales incorrectas. Intente nuevamente.');
      }
    } else {
      // Sin conexión: intentar cargar usuario desde almacenamiento local
      const localUser = await this.authService.getUserFromLocalStorage(this.usr.email);
      
      if (localUser && localUser.email === this.usr.email && localUser.password === this.usr.password && localUser.tipo === 'alumno') {
        console.log('Usuario local válido:', localUser);
        this.router.navigate(['/home']);
      } else {
        console.log('No se encontró un usuario local válido');
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