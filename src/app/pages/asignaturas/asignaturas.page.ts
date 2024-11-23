import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { Network } from '@capacitor/network';
import { Storage } from '@ionic/storage-angular';

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
  alumnoId: string = '';
  nombreAlumno: string = '';
  asignaturaNombre = '';
  profesorNombre = '';
  seccion: any = {};
  claseNombre: string = '';
  asignaturaId: string = '';

  constructor(
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: Storage,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.checkBarcodeScannerSupport();
    this.obtenerDatosAlumno();
    this.obtenerDatosAsignatura();
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;
    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }

  async obtenerDatosAlumno() {
    const user = await this.afAuth.currentUser;
    if (user) {
      this.alumnoId = user.uid;
      console.log('Alumno ID:', this.alumnoId);
      this.firestore.collection('alumnos').doc(this.alumnoId).valueChanges().subscribe((data: any) => {
        this.nombreAlumno = data?.nombre || 'Alumno Desconocido';
      });
    }
  }

  obtenerDatosAsignatura() {
    this.asignaturaId = this.route.snapshot.queryParamMap.get('asignaturaId') || '';
    const seccionNombre = this.route.snapshot.queryParamMap.get('seccion') || '';

    console.log("Asignatura ID:", this.asignaturaId);
    console.log("Sección:", seccionNombre);

    if (this.asignaturaId && seccionNombre) {
      this.firestore.collection('asignaturas').doc(this.asignaturaId).valueChanges().subscribe((asignaturaData: any) => {
        this.asignaturaNombre = asignaturaData?.nombre || 'Asignatura Desconocida';
        const seccion = asignaturaData?.secciones?.[seccionNombre];

        if (seccion) {
          this.seccion = seccion;

          if (seccion?.docenteId) {
            this.firestore.collection('usuarios').doc(seccion.docenteId).valueChanges().subscribe((usuarioData: any) => {
              this.profesorNombre = `${usuarioData?.firstName ?? 'Profesor'} ${usuarioData?.lastName ?? 'Desconocido'}`;
            });
          } else {
            this.profesorNombre = 'Profesor Desconocido';
          }
        }
      });
    }
  }

  async registrarAsistencia(): Promise<void> {
    try {
      console.log('Iniciando escaneo...');
      const granted = await this.requestPermissions();
      if (!granted) {
        await this.presentAlert('Permiso denegado', 'Para usar la aplicación debe autorizar los permisos de cámara.');
        return;
      }

      this.isScanning = true;
      console.log('Escaneando código...');
      const { barcodes } = await BarcodeScanner.scan();
      this.barcodes.push(...barcodes);
      console.log('Códigos detectados:', barcodes);

      if (this.barcodes.length > 0 && this.barcodes[0].displayValue) {
        const datosClase = JSON.parse(this.barcodes[0].displayValue);
        console.log("Datos del código QR:", JSON.stringify(datosClase));

        // Asegúrate de que la clase que se escaneó es válida
        if (datosClase.asignatura.toLowerCase() === this.route.snapshot.queryParamMap.get('asignaturaId')?.toLowerCase() &&
          datosClase.seccion.toLowerCase() === this.route.snapshot.queryParamMap.get('seccion')?.toLowerCase()) {

          // Verificar si el alumno ya ha sido registrado en esta clase
          const asistenciaRef = this.firestore.collection('asistencia').doc(this.alumnoId);
          const doc = await asistenciaRef.get().toPromise();

          if (doc?.exists) {
            const data = doc.data() as { clasesAsistidas: number; clasesRegistradas: string[] };
            // Verifica si la clase ya ha sido registrada
            if (data?.clasesRegistradas?.includes(datosClase.clase)) {
              await this.presentAlert('Asistencia ya registrada', 'Ya has registrado tu asistencia para esta clase.');
              return;
            }
          }

          console.log('QR válido, confirmando asistencia...');
          await this.confirmarAsistencia(datosClase);  // Registrar asistencia si el QR es válido
        } else {
          await this.presentAlert('Error', 'El código QR no pertenece a esta asignatura o sección.');
        }
      } else {
        await this.presentAlert('Error', 'No se detectó ningún código QR válido.');
      }
    } catch (error) {
      console.error('Error al escanear el código QR:', error);
      await this.presentAlert('Error', 'Ocurrió un error al escanear.');
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
    this.claseNombre = datosClase.clase;

    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        await this.presentAlert('Error de ubicación', 'No se otorgaron permisos para acceder a la ubicación.');
        return;
      }

      const posicion = await Geolocation.getCurrentPosition();
      this.latitud = posicion.coords.latitude;
      this.longitud = posicion.coords.longitude;

      // Crear el objeto de asistencia a guardar
      const asistenciaData = {
        alumnoId: this.alumnoId,
        nombre: this.nombreAlumno,
        clasesAsistidas: 1,
        porcentajeAsistencia: 20,
        clase: datosClase.clase,
        fecha: datosClase.fecha,
        ubicacion: { latitud: this.latitud, longitud: this.longitud },
        clasesRegistradas: [datosClase.clase],
        asignaturaId: this.asignaturaId,
        seccion: this.route.snapshot.queryParamMap.get('seccion')
      };

      // Comprobar si hay conexión a Internet
      const status = await Network.getStatus();
      if (status.connected) {
        // Si hay conexión, guarda directamente en Firestore
        console.log('alumnoId:', this.alumnoId);
        console.log('asignaturaId:', this.asignaturaId);
        const alumnoRef = this.firestore.collection('asistencia').doc(this.alumnoId);
        const doc = await alumnoRef.get().toPromise();

        if (doc?.exists) {
          const data = doc.data() as { clasesAsistidas: number; clasesRegistradas: string[] };
          const clasesAsistidas = (data?.clasesAsistidas ?? 0) + 1;
          const porcentajeAsistencia = (clasesAsistidas / 5) * 100;

          await alumnoRef.update({
            clasesAsistidas,
            porcentajeAsistencia,
            asignaturaId: this.asignaturaId,
            seccion: asistenciaData.seccion,
            clasesRegistradas: [...(data?.clasesRegistradas ?? []), datosClase.clase]
          });
        } else {
          await alumnoRef.set(asistenciaData);
        }

        // Guardar también en la colección clase_actual
        await this.firestore.collection('clase_actual').add({
          alumnoId: this.alumnoId,
          nombre: this.nombreAlumno,
          clase: datosClase.clase,
          fecha: datosClase.fecha,
          asignaturaId: this.asignaturaId,
          seccion: asistenciaData.seccion
        });
      } else {
        // Si no hay conexión, guarda en localStorage para sincronizar luego
        const asistenciasPendientes = (await this.storage.get('asistenciasPendientes')) || [];
        asistenciasPendientes.push(asistenciaData);
        await this.storage.set('asistenciasPendientes', asistenciasPendientes);
        console.log('Asistencia guardada localmente para sincronizar luego.');
      }

      this.asistenciaConfirmada = true;
      const mensaje = `${this.claseNombre}\nFecha y hora: ${this.fechaHoraActual}\nUbicación: Latitud ${this.latitud}, Longitud ${this.longitud}`;
      await this.presentAlert('¡Asistencia confirmada!', mensaje);
    
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      await this.presentAlert('Error de ubicación', 'No se pudo obtener la ubicación.');
      return;
    }
  }

  async presentAlert(titulo: string, mensaje: string) {
      const alert = await this.alertController.create({
        header: titulo,
        message: mensaje,
        buttons: ['OK']
      });
      await alert.present();
    }
  } 