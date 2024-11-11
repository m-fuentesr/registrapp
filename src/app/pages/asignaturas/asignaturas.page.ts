import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asignaturas',
  templateUrl: './asignaturas.page.html',
  styleUrls: ['./asignaturas.page.scss'],
})
export class AsignaturasPage implements OnInit {

  isSupported = false;
  barcodes: Barcode[] = [];
  isScanning: boolean = false;
  asistenciaConfirmada: boolean = false;
  fechaHoraActual: string = '';
  latitud: number | null = null;
  longitud: number | null = null;

  constructor(
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkBarcodeScannerSupport();
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;
    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }

  async registrarAsistencia(): Promise<void> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        await this.presentAlert('Permiso denegado', 'Para usar la aplicación debe autorizar los permisos de cámara.');
        return;
      }

      this.isScanning = true; 
      const { barcodes } = await BarcodeScanner.scan();
      this.barcodes.push(...barcodes);

      if (this.barcodes.length > 0) {
        const alumnoData = JSON.parse(this.barcodes[0].displayValue);
        await this.confirmarAsistencia(alumnoData);
        this.router.navigate(['/asignaturas-docente']);
      } else {
        await this.presentAlert('Error', 'No se detectó ningún código QR válido.');
      }
    } catch (error) {
      await this.presentAlert('Error', 'Ocurrió un error durante el escaneo.');
    } finally {
      this.isScanning = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async confirmarAsistencia(alumnoData: any): Promise<void> {
    this.fechaHoraActual = new Date().toLocaleString();
    try {
        const posicion = await Geolocation.getCurrentPosition();
        this.latitud = posicion.coords.latitude;
        this.longitud = posicion.coords.longitude;

        const alumnoRef = this.firestore.collection('asistencia').doc(alumnoData.nombre);
        const doc = await alumnoRef.get().toPromise();

        if (doc?.exists) {
            const data = doc.data() as { clasesAsistidas: number; porcentajeAsistencia: number };
            const clasesAsistidas = (data?.clasesAsistidas ?? 0) + 1;
            const porcentajeAsistencia = (clasesAsistidas / 20) * 100;

            await alumnoRef.update({ clasesAsistidas, porcentajeAsistencia });
        } else {
            await alumnoRef.set({
                nombre: alumnoData.nombre,
                clasesAsistidas: 1,
                porcentajeAsistencia: 5,
            });
        }
    } catch (error) {
        await this.presentAlert('Error de ubicación', 'No se pudo obtener la ubicación.');
        return;
    }

    this.asistenciaConfirmada = true;
    const mensaje = `Fecha y hora: ${this.fechaHoraActual}\nUbicación: Latitud ${this.latitud}, Longitud ${this.longitud}`;
    await this.presentAlert('¡Asistencia confirmada!', mensaje);
  }

  async presentAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}