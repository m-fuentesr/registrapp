import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner, ScanResult } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

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

  constructor(private alertController: AlertController) { }

  ngOnInit() {
    this.checkBarcodeScannerSupport(); // Verifica el soporte del escáner de códigos de barras
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;

    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule(); // Instala el módulo de escaneo si es compatible
    }
  }

  async registrarAsistencia(): Promise<void> {
    const granted = await this.requestPermissions(); // Solicita permisos de cámara
    if (!granted) {
      this.presentAlert('Permiso denegado', 'Para usar la aplicación debe autorizar los permisos de cámara');
      return;
    }

    this.isScanning = true; 
    const { barcodes } = await BarcodeScanner.scan(); // Escanea los códigos de barras
    this.barcodes.push(...barcodes); // Agrega los códigos escaneados al array

    // Confirmar asistencia si se escaneó exitosamente
    if (this.barcodes.length > 0) {
      await this.confirmarAsistencia();
    }

    this.isScanning = false; // Finaliza el escaneo
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions(); // Solicita permisos de cámara
    return camera === 'granted' || camera === 'limited';
  }

  async confirmarAsistencia(): Promise<void> {
    // Obtener fecha y hora actuales
    this.fechaHoraActual = new Date().toLocaleString();

    // Obtener ubicación actual
    const posicion = await Geolocation.getCurrentPosition();
    this.latitud = posicion.coords.latitude;
    this.longitud = posicion.coords.longitude;

    this.asistenciaConfirmada = true;

    // Mostrar alerta de confirmación de asistencia
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
