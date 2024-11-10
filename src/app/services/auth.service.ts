import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth, 
    private alertController: AlertController,
    private firestore: AngularFirestore) { }

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
  
}
