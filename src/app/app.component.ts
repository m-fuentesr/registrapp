import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private authService: AuthService) {
    this.initializeApp();
  }

  async initializeApp() {
    // Comprobar estado de conexión al inicio
    const status = await Network.getStatus();
    if (status.connected) {
      await this.authService.syncOfflineUsers();
    }

    // Escuchar cambios en el estado de la red
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        console.log('Conexión restaurada. Sincronizando usuarios offline...');
        await this.authService.syncOfflineUsers();
      }
    });
  }
}
