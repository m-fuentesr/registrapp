import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Apunte } from 'src/app/interfaces/apuntes';

@Component({
  selector: 'app-apuntes',
  templateUrl: './apuntes.page.html',
  styleUrls: ['./apuntes.page.scss'],
})
export class ApuntesPage implements OnInit {
  apuntes: Apunte[] = [];
  nuevoApunte: Omit<Apunte, 'id'> = { titulo: '', contenido: '' };

  constructor(private alertController: AlertController, private router:Router) {}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  agregarApunte() {
    const nuevoId = this.apuntes.length + 1;
    this.apuntes.push({ id: nuevoId, ...this.nuevoApunte });
    this.nuevoApunte = { titulo: '', contenido: '' };
  }

  async eliminarApunte(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este apunte?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.apuntes = this.apuntes.filter(apunte => apunte.id !== id);
          },
        },
      ],
    });

    await alert.present();
  }
}


