import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StorageService } from 'src/app/services/dbstorage.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  usuario: any = {};  // Inicializamos el objeto usuario vacío

  constructor(
    private router: Router,
    private alertController: AlertController,
    private dbstorage: StorageService
  ) {}

  async ngOnInit() {
    // Carga los datos del usuario desde el almacenamiento
    const storedUser = await this.dbstorage.getUser();
    if (storedUser) {
      this.usuario = storedUser;  // Asigna los datos del usuario al objeto
    } else {
      console.log('No se encontró un usuario registrado.');
    }
  }

  modificarPassword() {
    this.router.navigate(['/modificar-password']);
  }
}