import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { getFirestore, doc, getDoc, setDoc } from '@firebase/firestore';
import { getAuth, onAuthStateChanged } from '@firebase/auth';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-perfil-docente',
  templateUrl: './perfil-docente.page.html',
  styleUrls: ['./perfil-docente.page.scss'],
})
export class PerfilDocentePage implements OnInit {
  usuario: any = {}; // Inicializamos el objeto usuario vacío
  offlineData: any = null; // Datos offline

  constructor(
    private router: Router,
    private alertController: AlertController,
    private storage: Storage
  ) {}

  async ngOnInit() {
    // Inicializa el almacenamiento local
    await this.storage.create();

    // Verifica el estado de autenticación
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userId = user.uid;
        await this.loadUserData(userId); // Carga datos del usuario
        this.listenToNetworkChanges(userId); // Escucha cambios de red
      } else {
        console.log('No hay usuario autenticado.');
        this.router.navigate(['/login']); // Redirige al login si no hay usuario autenticado
      }
    });
  }

  async loadUserData(userId: string) {
    const db = getFirestore();
    const userDoc = doc(db, 'usuarios', userId);
    const status = await Network.getStatus();

    if (status.connected) {
      try {
        const docSnapshot = await getDoc(userDoc);
        if (docSnapshot.exists()) {
          this.usuario = docSnapshot.data(); // Asigna los datos del usuario
          await this.storage.set('usuarioOffline', this.usuario); // Guarda los datos en almacenamiento local
        } else {
          console.log('No se encontró el documento del usuario.');
          this.showAlert('Error', 'No se encontraron datos para este usuario.');
        }
      } catch (error) {
        console.error('Error al obtener datos de Firestore:', error);
        this.showAlert('Error', 'Hubo un problema al obtener los datos del usuario.');
      }
    } else {
      // Cargar datos desde almacenamiento local si no hay conexión
      console.log('No hay conexión a Internet. Cargando datos offline.');
      this.offlineData = await this.storage.get('usuarioOffline');
      if (this.offlineData) {
        this.usuario = this.offlineData;
      } else {
        console.log('No hay datos offline disponibles.');
        this.showAlert('Sin conexión', 'No se encontraron datos locales del usuario.');
      }
    }
  }

  async sincronizarDatos(userId: string) {
    const db = getFirestore();
    const userDoc = doc(db, 'usuarios', userId);
    const offlineData = await this.storage.get('usuarioOffline');

    if (offlineData) {
      try {
        await setDoc(userDoc, offlineData, { merge: true });
        console.log('Datos offline sincronizados con Firestore.');
        await this.storage.remove('usuarioOffline'); // Elimina datos locales después de sincronizar
      } catch (error) {
        console.error('Error al sincronizar datos offline:', error);
      }
    }
  }

  listenToNetworkChanges(userId: string) {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        console.log('Conexión restablecida. Sincronizando datos...');
        await this.sincronizarDatos(userId);
      }
    });
  }

  modificarPassword() {
    // Redirige a la página para modificar la contraseña
    this.router.navigate(['/modificar-password']);
  }

  // Método para mostrar alertas
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}