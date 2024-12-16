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
        this.sincronizarAsistenciaOffline();
        this.sincronizarRegistrosOffline();
      }
    });

    Network.addListener('networkStatusChange', () => {
      this.sincronizarAsistenciaOffline();
      this.sincronizarRegistrosOffline();
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
          const claseValida = await this.validarClaseOffline(datosClase);
        if (claseValida) {
          await this.registrarAsistenciaOffline(datosClase);
          await this.mostrarAlerta('Éxito', 'Asistencia registrada sin conexión. Se sincronizará cuando se reestablezca la conexión.');
        } else {
          await this.mostrarAlerta('Error', 'Datos del código QR no válidos o asignatura no registrada.');
        }
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

  private async validarClaseOffline(datosClase: any): Promise<boolean> {
    const asignaturasOffline = await this.storage.get('asignaturasOffline');
    if (!asignaturasOffline) return false;
  
    const asignatura = asignaturasOffline.find(
      (a: any) => a.id === datosClase.asignatura
    );
    if (!asignatura) return false;
  
    const seccion = asignatura.secciones?.[datosClase.seccion];
    if (!seccion) return false;
  
    return seccion.alumnos?.some(
      (alumno: any) => alumno.alumnoId === this.alumnoId
    );
  }
  
  private async registrarAlumnoEnAsignatura(datosClase: any) {
    try {
      const { asignatura, seccion } = datosClase;
  
      if (!asignatura || !seccion) {
        await this.mostrarAlerta('Error', 'QR inválido: faltan datos de asignatura o sección.');
        return;
      }
  
      if (navigator.onLine) {
        // Modo con conexión
        const asignaturaDocRef = this.firestore.collection('asignaturas').doc(asignatura);
        const asignaturaDoc = await asignaturaDocRef.get().toPromise();
  
        if (!asignaturaDoc?.exists) {
          await this.mostrarAlerta('Error', 'La asignatura especificada no existe.');
          return;
        }
  
        const asignaturaData = asignaturaDoc.data() as any;
  
        if (asignaturaData?.secciones?.[seccion]) {
          const seccionData = asignaturaData.secciones[seccion];
  
          if (!seccionData) {
            await this.mostrarAlerta('Error', 'La sección especificada no existe en esta asignatura.');
            return;
          }
  
          const alumnoRegistrado = seccionData.alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId);
          if (alumnoRegistrado) {
            console.log('Alumno ya registrado en esta sección');
            return;
          }
  
          // Registrar al alumno en Firestore
          await asignaturaDocRef.update({
            [`secciones.${seccion}.alumnos`]: firebase.firestore.FieldValue.arrayUnion({ alumnoId: this.alumnoId }),
          });
  
          // Registrar la asistencia
          await this.registrarAsistencia(datosClase);
  
          // Actualizar asignaturas en el Home
          await this.obtenerAsignaturasYSecciones();
        } else {
          await this.mostrarAlerta('Error', 'No se encontraron secciones en esta asignatura.');
        }
      } else {
        // Modo sin conexión: Guardar en almacenamiento local
        const registrosOffline = await this.storage.get('registrosOffline') || [];
        registrosOffline.push({
          tipo: 'registro',
          datosClase: { asignatura, seccion, alumnoId: this.alumnoId },
        });
        await this.storage.set('registrosOffline', registrosOffline);
  
        console.log('Registro guardado localmente para sincronización.');
        await this.mostrarAlerta('Sin conexión', 'El registro se guardó localmente y se sincronizará cuando haya conexión.');
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

  private async registrarAsistenciaOffline(datosClase: any) {
    const asistenciasOffline = (await this.storage.get('asistenciasOffline')) || [];
    asistenciasOffline.push({
      asignaturaId: datosClase.asignatura,
      seccion: datosClase.seccion,
      nombre: datosClase.nombre,
      asignaturaNombre: datosClase.asignaturaNombre,
      fecha: datosClase.fecha,
    });
  
    await this.storage.set('asistenciasOffline', asistenciasOffline);
    console.log('Asistencia registrada localmente:', datosClase);
  }
  

  async sincronizarAsistenciaOffline() {
    const status = await Network.getStatus();
    if (!status.connected) return;

    const asistenciasOffline: {
      asignaturaId: string;
      seccion: string;
      nombre: string;
      asignaturaNombre: string;
      fecha: string;
    }[] = (await this.storage.get('asistenciasOffline')) || [];
  
    if (asistenciasOffline.length > 0) {
      for (const asistencia of asistenciasOffline) {
        const asistenciaRef = this.firestore.collection('asistencia').doc(this.alumnoId);
        const doc = await asistenciaRef.get().toPromise();
  
        let clasesAsistidas: {
          asignaturaId: string;
          seccion: string;
          nombre: string;
          asignaturaNombre: string;
          fecha: string;
        }[] = [];
  
        if (doc?.exists) {
          const data = doc.data() as {
            clasesAsistidas: {
              asignaturaId: string;
              seccion: string;
              nombre: string;
              asignaturaNombre: string;
              fecha: string;
            }[];
          };
          clasesAsistidas = data.clasesAsistidas || [];
        }
  
        // Verificar si la clase ya está registrada
        const claseYaAsistida = clasesAsistidas.some(
          (clase) =>
            clase.nombre === asistencia.nombre &&
            clase.asignaturaId === asistencia.asignaturaId &&
            clase.seccion === asistencia.seccion &&
            clase.fecha === asistencia.fecha
        );
  
        if (!claseYaAsistida) {
          // Agregar la nueva clase asistida
          clasesAsistidas.push(asistencia);
        }
  
        // Guardar la asistencia actualizada en Firestore
        await asistenciaRef.set(
          {
            alumnoId: this.alumnoId,
            clasesAsistidas,
          },
          { merge: true }
        );
      }
  
      // Eliminar asistencias sincronizadas del almacenamiento local
      await this.storage.remove('asistenciasOffline');
      console.log('Asistencias offline sincronizadas con éxito.');
    }
  }

  private async sincronizarRegistrosOffline() {
    const status = await Network.getStatus();
    if (!status.connected) return;

    try {
      const registrosOffline = await this.storage.get('registrosOffline') || [];
  
      for (const registro of registrosOffline) {
        if (registro.tipo === 'registro') {
          const { asignatura, seccion, alumnoId } = registro.datosClase;
  
          const asignaturaDocRef = this.firestore.collection('asignaturas').doc(asignatura);
  
          await asignaturaDocRef.update({
            [`secciones.${seccion}.alumnos`]: firebase.firestore.FieldValue.arrayUnion({ alumnoId }),
          });
  
          console.log(`Registro sincronizado: ${alumnoId} en ${asignatura} - ${seccion}`);
        }
      }
  
      // Limpiar los registros locales sincronizados
      await this.storage.remove('registrosOffline');
      console.log('Todos los registros offline fueron sincronizados.');
    } catch (error) {
      console.error('Error al sincronizar registros offline:', error);
    }
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

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
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

