import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-registrar-asistencia',
  templateUrl: './registrar-asistencia.page.html',
  styleUrls: ['./registrar-asistencia.page.scss'],
})
export class RegistrarAsistenciaPage implements OnInit {

  constructor(private alertController: AlertController) { }

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
      buttons: ['OK']
    });

    await alert.present();
  }
}
