import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {
  isSupported = false;
  alumnoId: string = '';
  asignaturas: any[] = [];
  secciones: any = {};
  barcodes: Barcode[] = [];
  isScanning: boolean = false;

  profileMenuButtons = [
    {
      text: 'Perfil',
      icon: 'person-outline',
      handler: () => {
        this.router.navigate(['/perfil']);
      }
    },
    {
      text: 'Cerrar sesión',
      icon: 'log-out-outline',
      handler: () => {
        this.router.navigate(['/inicio']);
      }
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ];

  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: Storage,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.initStorage();
    this.checkBarcodeScannerSupport();

    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.alumnoId = user.uid;
        this.obtenerAsignaturasYSecciones();
        this.sincronizarDatosOffline();
      }
    });

    Network.addListener('networkStatusChange', () => {
      this.sincronizarDatosOffline();
    });

  }

  private async initStorage() {
    await this.storage.create();
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;
    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async obtenerAsignaturasYSecciones() {
    const status = await Network.getStatus();
    if (status.connected) {
      // Cargar asignaturas y secciones desde Firestore
      this.firestore
        .collection('asignaturas')
        .snapshotChanges()
        .subscribe(async (snapshot) => {
          this.asignaturas = snapshot
            .map((doc: any) => ({
              id: doc.payload.doc.id,
              ...doc.payload.doc.data(),
            }))
            .filter((asignatura: any) =>
              Object.values(asignatura.secciones || {}).some((seccion: any) =>
                seccion.alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId)
              )
            );

          // Guardar datos en almacenamiento local para offline
          await this.storage.set('asignaturasOffline', this.asignaturas);
        });
    } else {
      // Recuperar datos desde almacenamiento local
      const asignaturasOffline = await this.storage.get('asignaturasOffline');
      if (asignaturasOffline) {
        this.asignaturas = asignaturasOffline.filter((asignatura: any) =>
          Object.values(asignatura.secciones || {}).some((seccion: any) =>
            seccion.alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId)
          )
        );
      } else {
        this.asignaturas = [];
      }
    }
  }

  async escanearQR() {
    try {
      console.log('Iniciando escaneo...');

      // Verificar permisos de cámara
      const granted = await this.requestPermissions();
      if (!granted) {
        await this.mostrarAlerta('Permiso denegado', 'Para usar la aplicación debe autorizar los permisos de cámara.');
        return;
      }

      this.isScanning = true;
      console.log('Escaneando código...');

      // Escanear el código QR
      const { barcodes } = await BarcodeScanner.scan();
      this.barcodes.push(...barcodes);  // Almacenar los códigos escaneados
      console.log('Códigos detectados:', barcodes);

      if (this.barcodes.length > 0 && this.barcodes[0].displayValue) {
        const datosClase = JSON.parse(this.barcodes[0].displayValue);

        console.log("Datos del código QR:", JSON.stringify(datosClase));

        // Verificar el estado de la red
        const status = await Network.getStatus();

        if (status.connected) {
          // Si está en línea, registrar la asistencia y la clase
          if (await this.validarClase(datosClase)) {
            await this.registrarAsistencia(datosClase);
            await this.mostrarAlerta('Éxito', 'Asistencia registrada correctamente.');
          } else {
            await this.registrarAlumnoEnAsignatura(datosClase);
            await this.registrarAsistencia(datosClase);
            await this.mostrarAlerta('Éxito', 'Te has registrado en la asignatura y la asistencia ha sido registrada.');
          }
        } else {
          // Si está offline, almacenar los datos del QR para sincronizar más tarde
          await this.guardarQROffline(datosClase);
          await this.mostrarAlerta('Offline', 'No estás conectado. Los datos del QR se guardaron localmente y se sincronizarán cuando tengas conexión.');
        }
      } else {
        await this.mostrarAlerta('Error', 'No se detectó ningún código QR válido.');
      }
    } catch (error) {
      console.error('Error al escanear el código QR:', error);
      await this.mostrarAlerta('Error', 'Ocurrió un error al escanear.');
    } finally {
      this.isScanning = false;
    }
  }

  private async guardarQROffline(datosClase: any) {
    try {
      const asistenciasOffline = await this.storage.get('asistenciasOffline') || [];
      asistenciasOffline.push(datosClase);
      await this.storage.set('asistenciasOffline', asistenciasOffline);
      console.log('Datos del QR guardados localmente:', datosClase);
    } catch (error) {
      console.error('Error al guardar datos QR offline:', error);
    }
  }

  private async validarClase(datosClase: any): Promise<boolean> {
    // Buscar la asignatura en Firestore usando el id del documento (que es 'asignatura' en el QR)
    const asignaturaDocRef = this.firestore.collection('asignaturas').doc(datosClase.asignatura);
    const asignaturaDoc = await asignaturaDocRef.get().toPromise();

    // Verificar si la asignatura existe
    if (!asignaturaDoc?.exists) {
      console.log("Asignatura no encontrada");
      return false;
    }

    const asignaturaData = asignaturaDoc.data() as any;

    // Verificar que la asignatura tiene secciones
    if (typeof asignaturaData.secciones !== 'object') {
      console.log("No se encontraron secciones en la asignatura");
      return false;
    }

    // Buscar la sección en la asignatura
    const seccion = asignaturaData.secciones[datosClase.seccion];
    if (!seccion) {
      console.log("Sección no encontrada");
      return false;
    }

    // Verificar si el alumno está registrado en la sección
    const alumnoRegistrado = seccion.alumnos?.some(
      (alumno: any) => alumno.alumnoId === this.alumnoId
    );
    if (alumnoRegistrado) {
      // El alumno ya está registrado en la sección, validamos la clase
      return true;
    } else {
      // Si el alumno no está registrado en la sección, devolvemos false
      console.log("El alumno no está registrado en la sección");
      return false;
    }
  }

  private async registrarAlumnoEnAsignatura(datosClase: any) {
    try {
      // Obtener los datos del QR (ya contenidos en datosClase)
      const { asignatura, seccion } = datosClase;
      if (!asignatura || !seccion) {
        await this.mostrarAlerta('Error', 'QR inválido: faltan datos de asignatura o sección.');
        return;
      }

      // Buscar la asignatura en Firestore
      const asignaturaDocRef = this.firestore.collection('asignaturas').doc(asignatura);
      const asignaturaDoc = await asignaturaDocRef.get().toPromise();

      // Verificar si la asignatura existe
      if (!asignaturaDoc?.exists) {
        await this.mostrarAlerta('Error', 'La asignatura especificada no existe.');
        return;
      }

      const asignaturaData = asignaturaDoc.data() as any;

      if (asignaturaData?.secciones?.[seccion]) {
        const seccionData = asignaturaData.secciones[seccion];

        // Verificar si la sección existe
        if (!seccionData) {
          await this.mostrarAlerta('Error', 'La sección especificada no existe en esta asignatura.');
          return;
        }

        // Verificar si el alumno ya está registrado en la sección
        const alumnoRegistrado = seccionData.alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId);
        if (alumnoRegistrado) {
          console.log('Alumno ya registrado en esta sección');
          return;
        }

        // Registrar al alumno en la asignatura-sección
        await asignaturaDocRef.update({
          [`secciones.${seccion}.alumnos`]: firebase.firestore.FieldValue.arrayUnion({ alumnoId: this.alumnoId }),
        });

        // Registrar la asistencia
        await this.registrarAsistencia(datosClase);

        // Actualizar las asignaturas mostradas en el Home del alumno
        await this.obtenerAsignaturasYSecciones();
      } else {
        await this.mostrarAlerta('Error', 'No se encontraron secciones en esta asignatura.');
      }
    } catch (error) {
      console.error('Error al registrar al alumno en la asignatura:', error);
      await this.mostrarAlerta('Error', 'Ocurrió un problema al registrarte en la asignatura.');
    }
  }

  private async registrarAsistencia(datosClase: any) {
    try {
      if (!datosClase.nombre || !datosClase.asignatura || !datosClase.seccion
        || !datosClase.asignaturaNombre || !datosClase.fecha) {
        console.log('Error: Nombre de clase no encontrado en datosClase:', datosClase);
        await this.mostrarAlerta('Error', 'Datos de clase no válidos en el QR.');
        return;
      }

      // Verificar si la asistencia ya ha sido registrada previamente
      const asistenciaRef = this.firestore.collection('asistencia').doc(this.alumnoId);
      const doc = await asistenciaRef.get().toPromise();

      let clasesAsistidas: {
        asignaturaId: string; seccion: string; nombre: string;
        asignaturaNombre: string; fecha: string
      }[] = [];

      if (doc?.exists) {
        const data = doc.data() as {
          clasesAsistidas: {
            asignaturaId: string; seccion: string; nombre: string;
            asignaturaNombre: string; fecha: string;
          }[]
        };
        clasesAsistidas = data.clasesAsistidas || [];

      }
      console.log("Clases asistidas:", clasesAsistidas);

      // Verificar si la clase ya está registrada
      const claseYaAsistida = clasesAsistidas.some(
        (clase) => clase.nombre === datosClase.nombre &&
          clase.asignaturaId === datosClase.asignatura &&
          clase.seccion === datosClase.seccion &&
          clase.asignaturaNombre === datosClase.asignaturaNombre &&
          clase.fecha === datosClase.fecha
      );

      console.log('Clase ya asistida:', claseYaAsistida);

      if (claseYaAsistida) {
        await this.mostrarAlerta(
          'Asistencia ya registrada',
          `Ya has registrado tu asistencia para la clase "${datosClase.nombre}" en esta asignatura y sección.`
        );
        return;
      }

      // Registrar nueva clase asistida
      clasesAsistidas.push({
        asignaturaId: datosClase.asignatura, seccion: datosClase.seccion, nombre: datosClase.nombre,
        asignaturaNombre: datosClase.asignaturaNombre, fecha: datosClase.fecha
      });

      await asistenciaRef.set({
        alumnoId: this.alumnoId,
        clasesAsistidas
      }, { merge: true });

      const mensajeConfirmacion = `
      ${datosClase.nombre}
      Asignatura: ${datosClase.asignaturaNombre}
      Sección: ${datosClase.seccion}
      Fecha: ${datosClase.fecha}
    `;

      console.log('Asistencia registrada correctamente para la clase:', datosClase.nombre);
      await this.mostrarAlerta('¡Asistencia registrada!', mensajeConfirmacion);
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      await this.mostrarAlerta('Error', 'Ocurrió un problema al registrar la asistencia.');
    }
  }

  async sincronizarDatosOffline() {
    const status = await Network.getStatus();
    if (!status.connected) return;

    const asistenciasOffline = (await this.storage.get('asistenciasOffline')) || [];
    if (asistenciasOffline.length > 0) {
      for (const asistencia of asistenciasOffline) {
        const asistenciaDocRef = this.firestore
          .collection('asistencia')
          .doc(`${asistencia.alumnoId}_${asistencia.fecha}`);
        const asistenciaDoc = await asistenciaDocRef.get().toPromise();

        let clasesAsistidas = 0;
        let clasesRegistradas: string[] = [];

        // Si ya existe el documento, recuperamos la información de clases y porcentaje de asistencia
        if (asistenciaDoc?.exists) {
          const data = asistenciaDoc.data() as { clasesAsistidas: number; clasesRegistradas: string[], porcentajeAsistencia: number };
          clasesRegistradas = data.clasesRegistradas || [];
          clasesAsistidas = data.clasesAsistidas || 0;
        }

        const totalClases = clasesRegistradas.length + 1; // Nueva clase registrada
        const nuevoPorcentajeAsistencia = (clasesAsistidas + 1) / totalClases * 100;

        await asistenciaDocRef.set({
          alumnoId: asistencia.alumnoId,
          fecha: asistencia.fecha,
          clasesRegistradas: firebase.firestore.FieldValue.arrayUnion(asistencia.clase.nombre),
          clasesAsistidas: clasesAsistidas + 1,
          porcentajeAsistencia: nuevoPorcentajeAsistencia
        }, { merge: true });

        // Limpiar asistencias sincronizadas
        await this.storage.remove('asistenciasOffline');
      }
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  obtenerSeccionParaAlumno(asignatura: any): string | null {
    const secciones = asignatura.secciones || {};
    for (const [seccionClave, seccion] of Object.entries(secciones)) {
      const alumnos = (seccion as any)?.alumnos;
      if (alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId)) {
        return seccionClave;
      }
    }
    return null;
  }

  navegarASeccion(asignatura: any) {
    const seccionEspecifica = this.obtenerSeccionParaAlumno(asignatura);
    if (seccionEspecifica) {
      this.router.navigate(['/asignaturas'], {
        queryParams: {
          asignaturaId: asignatura.id,
          seccionEspecifica: seccionEspecifica,
        },
      });
    } else {
      console.error('No se encontró una sección para el alumno en esta asignatura');
    }
  }
}

