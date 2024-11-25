import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-asignaturas-docente',
  templateUrl: './asignaturas-docente.page.html',
  styleUrls: ['./asignaturas-docente.page.scss'],
})
export class AsignaturasDocentePage implements OnInit {
  alumnos: any[] = [];
  qrCodeUrl: string = '';
  claseSeleccionada: any = null;
  docenteId: string = '';
  asignaturaId: string = '';
  asignaturaNombre: string = '';
  seccion: any = {};
  clasesGeneradas: any[] = [];
  totalClases: number = 0;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: Storage,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('Parametros de la ruta:', params);
      this.asignaturaId = params['asignaturaId'] || '';
      const seccionNombre = params['seccion'];
      if (this.asignaturaId && seccionNombre) {
        this.obtenerSeccionYClases(seccionNombre);
        this.obtenerClasesGeneradas();
        this.sincronizarDatosOffline();
      }
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.docenteId = user.uid;
      }
    });
  }

  obtenerSeccionYClases(seccionNombre: string) {
    this.firestore
      .collection('asignaturas')
      .doc(this.asignaturaId)
      .valueChanges()
      .subscribe((asignatura: any) => {
        if (asignatura && asignatura.secciones) {
          this.asignaturaNombre = asignatura.nombre;
          this.seccion = asignatura.secciones[seccionNombre];
          this.clasesGeneradas = this.seccion?.clases || [];
          console.log('Clases generadas:', this.clasesGeneradas);
          this.obtenerAlumnos();
        } else {
          console.error('No se encontró la asignatura o la sección.');
        }
      });
  }

  obtenerClasesGeneradas() {
    this.firestore
      .collection('asignaturas')
      .doc(this.asignaturaId)
      .valueChanges()
      .subscribe((asignatura: any) => {
        if (asignatura?.secciones?.[this.seccion.nombre]?.clases) {
          this.clasesGeneradas = asignatura.secciones[this.seccion.nombre].clases;
          this.totalClases = this.clasesGeneradas.length;
          console.log('Clases generadas:', this.clasesGeneradas);
        } else {
          console.log('No hay clases generadas para esta sección.');
          this.clasesGeneradas = [];
          this.totalClases = 0;
        }
      });
  }

  obtenerAlumnos() {
    this.firestore
      .collection('asignaturas')
      .doc(this.asignaturaId)
      .valueChanges()
      .subscribe((asignatura: any) => {
        if (asignatura?.secciones?.[this.seccion.nombre]?.alumnos) {
          const alumnosRegistrados = asignatura.secciones[this.seccion.nombre].alumnos;
          this.obtenerDetallesAlumnos(alumnosRegistrados).then(alumnosDetallados => {
            this.alumnos = alumnosDetallados;

            // Relacionar asistencia de Firestore
            this.firestore.collection('asistencia').valueChanges().subscribe((asistencias: any[]) => {
              this.alumnos.forEach(alumno => {
                const asistencia = asistencias.find(a => a.alumnoId === alumno.alumnoId);
                if (asistencia) {
                  alumno.clasesAsistidas = asistencia.clasesAsistidas || 0;
                  alumno.porcentajeAsistencia = asistencia.porcentajeAsistencia || 0;
                }
              });
            });
          });
        }
      });
  }

  private async obtenerDetallesAlumnos(alumnosRegistrados: any[]): Promise<any[]> {
    return Promise.all(
      alumnosRegistrados.map(async (alumno: any) => {
        const usuarioDoc = await this.firestore.collection('usuarios').doc(alumno.alumnoId).get().toPromise();
        const usuarioData: any = usuarioDoc?.data();
        return {
          alumnoId: alumno.alumnoId,
          nombre: usuarioData ? `${usuarioData.firstName} ${usuarioData.lastName}` : 'Nombre desconocido',
          clasesAsistidas: 0,
          porcentajeAsistencia: 0,
        };
      }),
    );
  }

  async generarCodigoQR() {
    const fechaActual = new Date().toISOString().split('T')[0];
    const qrExistente = this.clasesGeneradas.find(clase => clase.fecha === fechaActual);

    if (qrExistente) {
      const confirmacion = await this.mostrarConfirmacion(
        'Código QR existente',
        `Ya existe un QR para hoy (${fechaActual}). ¿Deseas generar otro?`
      );
      if (!confirmacion) return;
    }

    const nombreClase = `Clase ${this.clasesGeneradas.length + 1}`;
    const datosClase = {
      asignatura: this.asignaturaId,
      seccion: this.seccion?.nombre,
      nombre: nombreClase,
      fecha: fechaActual,
      docenteId: this.docenteId,
    };

    try {
      this.qrCodeUrl = await QRCode.toDataURL(JSON.stringify(datosClase));
      this.cdr.detectChanges();
      console.log('Código QR generado:', this.qrCodeUrl);

      // Guardar datos de la clase
      const nuevaClase = { ...datosClase, qrCodeUrl: this.qrCodeUrl };
      this.clasesGeneradas.push(nuevaClase);

      // Actualizar en Firestore
      await this.firestore.collection('asignaturas').doc(this.asignaturaId).update({
        [`secciones.${this.seccion.nombre}.clases`]: this.clasesGeneradas,
      });

      await this.mostrarAlerta('QR Generado', `Clase: ${nombreClase}, Fecha: ${fechaActual}`);
    } catch (error) {
      console.error('Error al generar el código QR:', error);
      await this.mostrarAlerta('Error', 'Hubo un problema al generar el QR. Inténtalo de nuevo.');
    }
  }

  async sincronizarDatosOffline() {
    const clasesOffline = await this.storage.get('clasesOffline');
    if (clasesOffline?.length > 0) {
      try {
        const clasesActualizadas = [...this.clasesGeneradas, ...clasesOffline];
        await this.firestore.collection('asignaturas').doc(this.asignaturaId).update({
          [`secciones.${this.seccion.nombre}.clases`]: clasesActualizadas,
        });

        await this.storage.remove('clasesOffline');
        this.clasesGeneradas = clasesActualizadas;
        this.totalClases = clasesActualizadas.length;
        console.log('Clases offline sincronizadas con Firestore.');
      } catch (error) {
        console.error('Error al sincronizar clases offline:', error);
      }
    }
  }

  async procesarCodigoqrSinConexion(datosClase: any) {
    const clasesOffline = await this.storage.get('clasesOffline') || [];
    clasesOffline.push(datosClase);
    await this.storage.set('clasesOffline', clasesOffline);
    console.log('Clase almacenada offline:', datosClase);
  }

  onClaseSeleccionada(clase: any) {
    this.claseSeleccionada = clase;
    this.qrCodeUrl = clase?.qrCodeUrl || '';
    console.log('Clase seleccionada:', this.claseSeleccionada);
    console.log('Código QR cargado:', this.qrCodeUrl);
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertController.create({
        header: titulo,
        message: mensaje,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: 'Aceptar',
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }
}