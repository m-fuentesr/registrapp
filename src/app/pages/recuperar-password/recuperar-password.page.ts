import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
})
export class RecuperarPasswordPage {
  email: string = '';

  constructor(private router: Router, private alertController: AlertController) {

  }

  async recuperarPassword() {
    await this.presentAlert();
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Instrucciones Enviadas',
      message: 'Se han enviado las instrucciones para recuperar tu contraseña a tu correo electrónico.',
      buttons: ['OK'],
      backdropDismiss: false
    });

    await alert.present();
  }
}