import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { FirestoreUsuario, Usuario } from 'src/app/interfaces/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Método para registrar usuarios
  async register(email: string, password: string, userData: any) {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Guarda datos adicionales en Firestore
      if (user) {
        await this.firestore.collection('usuarios').doc(user.uid).set(userData);
      }

      console.log('Usuario registrado y guardado:', user);
      return user;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // Método para iniciar sesión
  async login(email: string, password: string, tipoEsperado: string): Promise<boolean> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      if (user) {
        const userDoc = await this.firestore.collection('usuarios').doc(user.uid).get().toPromise();
        const userData = userDoc?.data() as FirestoreUsuario;
  
        if (userData?.tipo === tipoEsperado) {
          await this.saveUserLocally({
            uid: user.uid,
            email: user.email || '',
            password: password,
            tipo: userData.tipo,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });
          return true; // Tipo de usuario correcto
        }
      }
  
      await this.logout();
      return false; // Tipo de usuario incorrecto
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Método para verificar si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    const user = await this.afAuth.currentUser;
    return !!user;
  }

  // Método para cerrar sesión
  async logout() {
    await this.afAuth.signOut();
    console.log('Sesión cerrada');
  }

  // Método para enviar el correo de restablecimiento de contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      this.showAlert('Correo Enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
    } catch (error) {
      console.error('Error al enviar el correo de recuperación de contraseña', error);
      this.showAlert('Error', 'No se pudo enviar el correo de recuperación. Verifica que el correo sea válido.');
    }
  }

  // Método para mostrar alertas
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async syncOfflineUsers() {
    const offlineUsers = await this.storage.get('offlineUsers') || [];
    console.log('Usuarios offline a sincronizar:', offlineUsers);

    if (offlineUsers.length > 0) {
      for (const user of offlineUsers) {
        try {
          // Intentar guardar cada usuario en Firestore
          const password = user.password || 'defaultPassword';
          await this.register(user.email, password, user);
          console.log(`Usuario sincronizado: ${user.email}`);
        } catch (error) {
          console.error(`Error al sincronizar usuario ${user.email}:`, error);
        }
      }

      // Limpiar usuarios sincronizados
      await this.storage.remove('offlineUsers');
      console.log('Sincronización de usuarios completada.');
    }
  }

  // Guardar datos del usuario en el almacenamiento local
  async saveUserLocally(user: Usuario) {
    const localUsers: Usuario[] = (await this.storage.get('offlineUsers')) || [];
    const existingUserIndex = localUsers.findIndex(u => u.email === user.email);

    if (existingUserIndex !== -1) {
      // Actualizar si ya existe
      localUsers[existingUserIndex] = { ...localUsers[existingUserIndex], ...user };
    } else {
      // Agregar nuevo usuario
      localUsers.push(user);
    }

    console.log('Guardando usuario con contraseña:', user.password);
    await this.storage.set('offlineUsers', localUsers);
    console.log('Datos guardados correctamente:', localUsers);
  }

  // Obtener datos del usuario desde el almacenamiento local
  async getUserFromLocalStorage(email: string): Promise<Usuario | null> {
    const localUsers: Usuario[] = (await this.storage.get('offlineUsers')) || [];
    const user = localUsers.find((user: Usuario) => user.email === email);
    if (user) {
      console.log('Usuario encontrado:', user);
      return user;
    } else {
      console.log('Usuario no encontrado')
      return null;
    }
  }

  async syncUserData(email: string) {
    const localUser = await this.getUserFromLocalStorage(email);
    if (localUser) {
      // Sincroniza datos con Firestore
      await this.firestore.collection('usuarios').doc(localUser.email).set(localUser, { merge: true });
    }
  }

}
