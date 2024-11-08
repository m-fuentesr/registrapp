import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth, private alertController: AlertController) { }

  // Método para registrar usuarios
  async register(email: string, password: string) {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      console.log('Usuario registrado:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // Método para iniciar sesión
  async login(email: string, password: string) {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('Usuario logueado:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
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
  
}
