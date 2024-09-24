import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-asistencia',
  templateUrl: './registrar-asistencia.page.html',
  styleUrls: ['./registrar-asistencia.page.scss'],
})
export class RegistrarAsistenciaPage implements OnInit {

  constructor(private alertController: AlertController, private router: Router) { }

  ngOnInit() {
  }

  async confirmar() {

    const fechaHoraActual = new Date().toLocaleString();

    const posicion = await Geolocation.getCurrentPosition();
    const latitud = posicion.coords.latitude;
    const longitud = posicion.coords.longitude;

    const mensaje = `Fecha y hora: ${fechaHoraActual}\nUbicación: Latitud ${latitud}, Longitud ${longitud}`;

    const alert = await this.alertController.create({
      header: '¡Asistencia confirmada!',
      message: mensaje,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/asignaturas']);
          }
        }
      ]
    });

    await alert.present();
  }
}
