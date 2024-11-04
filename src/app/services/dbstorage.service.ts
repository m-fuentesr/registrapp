import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }

  async setItem(key: string, value: any) {
    await this.storage.set(key, value);
  }

  async getItem(key: string) {
    return await this.storage.get(key);
  }

  async removeItem(key: string) {
    await this.storage.remove(key);
  }

  async clear() {
    await this.storage.clear();
  }

  // Método para guardar el usuario
  async saveUser(user: any): Promise<void> {
    await this.setItem('usuario', user);
  }

  // Método para obtener el usuario
  async getUser(): Promise<any> {
    return await this.getItem('usuario');
  }
}