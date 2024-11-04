// services/auth.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Usuario, Alumno, Docente } from './../interfaces/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarios: Usuario[] = [];

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Registrar un nuevo usuario
  async registrarUsuario(usuario: Usuario): Promise<void> {
    this.usuarios.push(usuario);
    await this.storage.set('usuarios', this.usuarios);
  }

  // Obtener usuario por email
  async obtenerUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
    await this.cargarUsuarios();
    return this.usuarios.find(u => u.email === email);
  }

  // Cargar usuarios del almacenamiento
  private async cargarUsuarios() {
    const datos = await this.storage.get('usuarios');
    this.usuarios = datos || [];
  }
}
