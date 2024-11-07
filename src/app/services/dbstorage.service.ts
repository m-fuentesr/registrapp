import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) {
    this.init();
  }

  // Inicializa el almacenamiento
  async init() {
    await this.storage.create();
  }

  // Guarda un item en el storage (usuario)
  async setItem(key: string, value: any) {
    await this.storage.set(key, value);
  }

  // Obtiene un item del storage por su clave
  async getItem(key: string) {
    return await this.storage.get(key);
  }

  // Elimina un item del storage
  async removeItem(key: string) {
    await this.storage.remove(key);
  }

  // Limpia el storage
  async clear() {
    await this.storage.clear();
  }

  // Guarda los datos del usuario
  async saveUser(user: any): Promise<void> {
    await this.setItem('usuario', user);
  }

  // Obtiene los datos del usuario
  async getUser(): Promise<any> {
    return await this.getItem('usuario');
  }
}