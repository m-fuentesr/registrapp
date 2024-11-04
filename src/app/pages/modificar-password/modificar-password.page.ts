import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/dbstorage.service';

@Component({
  selector: 'app-modificar-password',
  templateUrl: './modificar-password.page.html',
  styleUrls: ['./modificar-password.page.scss'],
})
export class ModificarPasswordPage {

  passwordActual: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  constructor(private alertController: AlertController, private router: Router, private dbstorage: StorageService) {}

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

    // Recuperar el usuario almacenado
    const storedUser = await this.dbstorage.getUser();

    // Verificar la contraseña actual
    if (storedUser && storedUser.password === this.passwordActual) {
      // Actualizar la contraseña
      storedUser.password = this.nuevaPassword;
      await this.dbstorage.saveUser(storedUser); // Guardar el usuario con la nueva contraseña

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
    } else {
      const alerta = await this.alertController.create({
        header: 'Error',
        message: 'La contraseña actual es incorrecta.',
        buttons: ['OK'],
        backdropDismiss: false
      });
      await alerta.present();
    }
  }
}