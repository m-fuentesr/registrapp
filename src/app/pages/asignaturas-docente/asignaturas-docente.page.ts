import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ChangeDetectorRef } from '@angular/core';
import { Network } from '@capacitor/network';

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
    this.initStorage();
    this.route.queryParams.subscribe(params => {
      this.asignaturaId = params['asignaturaId'] || '';
      const seccionNombre = params['seccion'];
      if (this.asignaturaId && seccionNombre) {
        this.obtenerSeccionYClases(seccionNombre);
        this.obtenerClasesGeneradas();
        this.sincronizarDatosOffline();
      }
    });

    Network.addListener('networkStatusChange', () => {
      this.sincronizarDatosOffline();
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.docenteId = user.uid;
      }
    });
  }

  private async initStorage() {
    await this.storage.create();
  }

  async obtenerSeccionYClases(seccionNombre: string) {
    const seccionOffline = await this.storage.get('seccionOffline');
    if (navigator.onLine) {
      this.firestore
        .collection('asignaturas')
        .doc(this.asignaturaId)
        .valueChanges()
        .subscribe(async (asignatura: any) => {
          if (asignatura && asignatura.secciones) {
            this.asignaturaNombre = asignatura.nombre;
            this.seccion = asignatura.secciones[seccionNombre];
            this.clasesGeneradas = this.seccion?.clases || [];
            await this.storage.set('seccionOffline', {
              asignatura: asignatura.nombre,
              clases: this.seccion?.clases,
              nombre: this.seccion?.nombre
            });
            this.obtenerAlumnos();
          }
        });
    } else {
      if (seccionOffline) {
        this.asignaturaNombre = seccionOffline.asignatura;
        this.seccion = seccionOffline;
        this.clasesGeneradas = this.seccion?.clases || [];
        this.obtenerAlumnos();
      }
    }
  }

  async obtenerClasesGeneradas() {
    const status = await Network.getStatus();
    if (status.connected) {
      this.firestore
        .collection('asignaturas')
        .doc(this.asignaturaId)
        .valueChanges()
        .subscribe((asignatura: any) => {
          if (asignatura?.secciones?.[this.seccion.nombre]?.clases) {
            this.clasesGeneradas = asignatura.secciones[this.seccion.nombre].clases;
            this.totalClases = this.clasesGeneradas.length;
          }
        });
    } else {
      const seccionOffline = await this.storage.get('seccionOffline');
      if (seccionOffline) {
        this.clasesGeneradas = seccionOffline.clases || [];
        this.totalClases = this.clasesGeneradas.length;
      }
    }
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

            this.firestore.collection('asistencia').valueChanges().subscribe((asistencias: any[]) => {
              this.alumnos.forEach(alumno => {
                const asistencia = asistencias.find(a => a.alumnoId === alumno.alumnoId);
                if (asistencia && asistencia.clasesAsistidas) {
                  const totalClases = this.totalClases || 0;
                  const clasesAsistidas = asistencia.clasesAsistidas.filter(
                    (clase: any) =>
                      clase.asignaturaId === this.asignaturaId &&
                      clase.seccion === this.seccion.nombre
                  );

                  alumno.clasesAsistidas = clasesAsistidas.length;
                  alumno.porcentajeAsistencia = totalClases > 0
                    ? (alumno.clasesAsistidas / totalClases) * 100
                    : 0;
                } else {
                  alumno.clasesAsistidas = 0;
                  alumno.porcentajeAsistencia = 0;
                }
              });
              this.cdr.detectChanges();
            });
          });
        }
      });
  }

  onClaseSeleccionada(clase: any) {
    this.claseSeleccionada = clase;
    this.qrCodeUrl = clase?.qrCodeUrl || '';
    console.log('Clase seleccionada:', this.claseSeleccionada);
    console.log('Código QR cargado:', this.qrCodeUrl);
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
      asignaturaNombre: this.asignaturaNombre,
      seccion: this.seccion?.nombre,
      nombre: nombreClase,
      fecha: fechaActual,
      docenteId: this.docenteId,
    };

    try {
      this.qrCodeUrl = await QRCode.toDataURL(JSON.stringify(datosClase));
      this.cdr.detectChanges();

      const nuevaClase = { ...datosClase, qrCodeUrl: this.qrCodeUrl };
      this.clasesGeneradas.push(nuevaClase);

      if (await Network.getStatus().then(status => !status.connected)) {
        this.procesarCodigoqrSinConexion(nuevaClase);
      } else {
        this.guardarClaseEnFirestore(nuevaClase);
      }

    } catch (error) {
      console.error('Error al generar el código QR:', error);
    }
  }

  async procesarCodigoqrSinConexion(datosClase: any) {
    const clasesOffline = await this.storage.get('clasesOffline') || [];
    clasesOffline.push(datosClase);
    await this.storage.set('clasesOffline', clasesOffline);
    console.log('Clase almacenada offline:', datosClase);
  }

  async guardarClaseEnFirestore(datosClase: any) {
    try {
      await this.firestore.collection('asignaturas').doc(this.asignaturaId).update({
        [`secciones.${this.seccion.nombre}.clases`]: this.clasesGeneradas,
      });

      await this.storage.set('seccionOffline', {
        asignatura: this.asignaturaNombre,
        clases: this.clasesGeneradas,
        nombre: this.seccion?.nombre,
      });

      console.log('Clase guardada en Firestore y Storage.');
    } catch (error) {
      console.error('Error al guardar clase en Firestore:', error);
    }
  }

  async sincronizarDatosOffline() {
    const status = await Network.getStatus();
    if (!status.connected) return;

    const clasesOffline = await this.storage.get('clasesOffline') || [];
    if (clasesOffline.length > 0) {
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

  async mostrarConfirmacion(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: () => true,
        },
      ],
    });
    await alert.present();
    const { data } = await alert.onDidDismiss();
    return data?.action === 'Aceptar';
  }

}