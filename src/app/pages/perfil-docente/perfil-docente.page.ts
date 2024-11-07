import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/dbstorage.service';

@Component({
  selector: 'app-perfil-docente',
  templateUrl: './perfil-docente.page.html',
  styleUrls: ['./perfil-docente.page.scss'],
})
export class PerfilDocentePage implements OnInit {
  usuario: any = {};  // Aquí guardaremos la información del docente

  constructor(private dbstorage: StorageService) {}

  async ngOnInit() {
    // Obtener el usuario almacenado
    const storedUser = await this.dbstorage.getUser();

    // Si el usuario existe y es un docente, guardamos su información
    if (storedUser && storedUser.tipo === 'docente') {
      this.usuario = storedUser;  // Almacenamos la información del docente en la variable 'usuario'
    }
  }
}