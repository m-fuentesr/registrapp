import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { getFirestore, doc, getDoc } from '@firebase/firestore';
import { getAuth, onAuthStateChanged } from '@firebase/auth';

@Component({
  selector: 'app-perfil-docente',
  templateUrl: './perfil-docente.page.html',
  styleUrls: ['./perfil-docente.page.scss'],
})
export class PerfilDocentePage implements OnInit {
  usuario: any = {};  // Inicializamos el objeto usuario vacío

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    // Verifica si el usuario está autenticado
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si hay un usuario autenticado, obtenemos sus datos desde Firestore
        const db = getFirestore();
        const userDoc = doc(db, 'usuarios', user.uid); // Referencia al documento del usuario
        const docSnapshot = await getDoc(userDoc);  // Obtenemos el snapshot del documento

        if (docSnapshot.exists()) {
          this.usuario = docSnapshot.data();  // Asigna los datos del usuario a la propiedad 'usuario'
        } else {
          console.log('No se encontró el documento del usuario.');
          this.showAlert('Error', 'No se encontraron datos para este usuario.');
        }
      } else {
        console.log('No hay usuario autenticado.');
        this.router.navigate(['/login']);  // Redirige al login si no hay usuario autenticado
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
      buttons: ['OK']
    });
    await alert.present();
  }
}