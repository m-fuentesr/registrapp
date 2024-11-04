import { Asignatura } from './../interfaces/asignatura';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private asignaturas: Asignatura[] = [];

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Guardar asignaturas en el almacenamiento
  async guardarAsignatura(asignatura: Asignatura) {
    this.asignaturas.push(asignatura);
    await this.storage.set('asignaturas', this.asignaturas);
  }

  // Obtener todas las asignaturas
  async obtenerAsignaturas(): Promise<Asignatura[]> {
    const datos = await this.storage.get('asignaturas');
    this.asignaturas = datos || [];
    return this.asignaturas;
  }
}
