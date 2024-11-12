import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
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
  nombreAlumno: string = '';

  constructor(
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkBarcodeScannerSupport();
    this.obtenerNombreAlumno();
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;
    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }

  async obtenerNombreAlumno() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const userId = user.uid;
      this.firestore.collection('alumnos').doc(userId).valueChanges().subscribe((data: any) => {
        this.nombreAlumno = data?.nombre || 'Alumno Desconocido';
      });
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

      if (this.barcodes.length > 0 && this.barcodes[0].displayValue) {
        console.log("Código QR escaneado:", this.barcodes[0].displayValue);
        const datosClase = JSON.parse(this.barcodes[0].displayValue);
        await this.confirmarAsistencia(datosClase);
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

  async confirmarAsistencia(datosClase: any): Promise<void> {

    this.fechaHoraActual = new Date().toLocaleString();
    try {
      // Solicitar permisos antes de intentar obtener la ubicación
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        // Si no se otorgan permisos, muestra una alerta
        await this.presentAlert('Error de ubicación', 'No se otorgaron permisos para acceder a la ubicación.');
        return;
      }
      const posicion = await Geolocation.getCurrentPosition();
      this.latitud = posicion.coords.latitude;
      this.longitud = posicion.coords.longitude;

      const alumnoRef = this.firestore.collection('asistencia').doc(this.nombreAlumno);
      const doc = await alumnoRef.get().toPromise();

      if (doc?.exists) {
        const data = doc.data() as { clasesAsistidas: number; porcentajeAsistencia: number };
        const clasesAsistidas = (data?.clasesAsistidas ?? 0) + 1;
        const porcentajeAsistencia = (clasesAsistidas / 5) * 100;

        await alumnoRef.update({ clasesAsistidas, porcentajeAsistencia });
      } else {
        await alumnoRef.set({
          nombre: this.nombreAlumno,
          clasesAsistidas: 1,
          porcentajeAsistencia: 5,
          clase: datosClase.clase,
          fecha: datosClase.fecha,
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