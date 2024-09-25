import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modificar-password',
  templateUrl: './modificar-password.page.html',
  styleUrls: ['./modificar-password.page.scss'],
})
export class ModificarPasswordPage {

  passwordActual: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  constructor(private alertController: AlertController, private router: Router) {}

  async cambiarPassword() {
    if (this.nuevaPassword !== this.confirmarPassword) {
      const alerta = await this.alertController.create({
        header: 'Error',
        message: 'Las contraseñas no coinciden.',
        buttons: ['OK'],
        backdropDismiss: false
      });
      await alerta.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Éxito',
      message: 'La contraseña ha sido cambiada correctamente.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/perfil']); 
        }
      }],
      backdropDismiss: false
    });
    await alert.present();
  }
}