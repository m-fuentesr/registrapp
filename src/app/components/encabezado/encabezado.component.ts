import { Component, OnInit, Input } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-encabezado',
  templateUrl: './encabezado.component.html',
  styleUrls: ['./encabezado.component.scss'],
})
export class EncabezadoComponent implements OnInit {
  @Input() titulo = "";

  profileMenuButtons = [
    {
      text: 'Perfil',
      icon: 'person-outline',
      handler: () => {
        this.router.navigate(['/perfil']);
      }
    },
    {
      text: 'Cerrar sesión',
      icon: 'log-out-outline',
      handler: () => {
        this.router.navigate(['/inicio']);
      }
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ];

  constructor(private actionSheetController: ActionSheetController, private router: Router) { }

  ngOnInit() {}

  async mostrarMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones de Perfil',
      buttons: this.profileMenuButtons,
      mode: 'ios'
    });
    await actionSheet.present();
  }
}