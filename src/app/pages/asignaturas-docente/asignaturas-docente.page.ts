import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-asignaturas-docente',
  templateUrl: './asignaturas-docente.page.html',
  styleUrls: ['./asignaturas-docente.page.scss'],
})
export class AsignaturasDocentePage implements OnInit {
  alumnos: any[] = [];
  qrCodeUrl: string = '';
  claseSeleccionada: string = '';
  docenteId: string = '';
  asignaturaId: string = '';
  asignaturaNombre: string = '';
  seccion: any = {};
  clasesDisponibles: any[] = [];
  totalClases: number = 0;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('Parametros de la ruta:', params);
      this.asignaturaId = params['asignaturaId'] || '';
      const seccionNombre = params['seccion'];
      if (this.asignaturaId && seccionNombre) {
        this.obtenerSeccionYClases(seccionNombre);
      }
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.docenteId = user.uid;
      }
    });
  }

  obtenerAlumnos() {
    this.firestore.collection('asignaturas').doc(this.asignaturaId).valueChanges().subscribe((asignatura: any) => {
      if (asignatura && asignatura.secciones && asignatura.secciones[this.seccion?.nombre]) {
        const alumnosRegistrados = asignatura.secciones[this.seccion?.nombre].alumnos;

        this.obtenerDetallesAlumnos(alumnosRegistrados).then(alumnosDetallados => {
          this.alumnos = alumnosDetallados;

          this.firestore.collection('asistencia').valueChanges().subscribe((asistencias: any[]) => {
            this.alumnos.forEach(alumno => {
              const asistencia = asistencias.find(a => a.alumnoId === alumno.alumnoId);
              if (asistencia) {
                alumno.clasesAsistidas = asistencia.clasesAsistidas;
                alumno.porcentajeAsistencia = asistencia.porcentajeAsistencia;
              }
            });
          });
        });
      } else {
        console.error('Sección no encontrada en la asignatura.');
      }
    });
  }
  
  private async obtenerDetallesAlumnos(alumnosRegistrados: any[]): Promise<any[]> {
    return Promise.all(alumnosRegistrados.map(async (alumno: any) => {
      const usuarioDoc = await this.firestore.collection('usuarios').doc(alumno.alumnoId).get().toPromise();
      const usuarioData: any = usuarioDoc?.data();
  
      return {
        alumnoId: alumno.alumnoId,
        nombre: usuarioData ? `${usuarioData.firstName} ${usuarioData.lastName}` : 'Nombre desconocido',
        clasesAsistidas: 0,
        porcentajeAsistencia: 0
      };
    }));
  }
  

  obtenerSeccionYClases(seccionNombre: string) {
    if (!this.asignaturaId || !seccionNombre) {
      console.error('Asignatura o sección no están definidos.');
      return;
    }
  
    this.firestore.collection('asignaturas').doc(this.asignaturaId).valueChanges().subscribe((asignatura: any) => {
      if (asignatura && asignatura.secciones) {
        this.asignaturaNombre = asignatura.nombre;
        const seccion = asignatura.secciones[seccionNombre];
  
        if (seccion) {
          this.seccion = seccion;
          this.clasesDisponibles = Array.isArray(this.seccion.clases) ? this.seccion.clases : [];
          this.totalClases = this.clasesDisponibles.length;
          this.obtenerAlumnos();
        } else {
          console.error('Sección no encontrada.');
        }
      } else {
        console.error('No se encontró la asignatura o el campo "secciones" no existe.');
      }
    });
  }
  

  private obtenerClaseFirestore(asignaturaId: string, claseId: string) {
    
    return this.firestore.collection('asignaturas').doc(asignaturaId)
      .collection('clases').doc(claseId);
  }

  onClaseSeleccionada(claseId: string) {
    this.claseSeleccionada = claseId;
    this.obtenerClaseGuardada();
  }

  async obtenerClaseGuardada() {
    if (!this.claseSeleccionada || !this.asignaturaId) {
      console.error('Faltan datos de asignatura o clase para cargar el código QR.');
      return;
    }

    const claseRef = this.obtenerClaseFirestore(this.asignaturaId, this.claseSeleccionada);
    claseRef.valueChanges().subscribe((claseData: any) => {
      // Verificar si claseData está definido antes de acceder a su propiedad qrCodeUrl
      if (claseData && claseData.qrCodeUrl) {
        this.qrCodeUrl = claseData.qrCodeUrl;
      } else {
        this.qrCodeUrl = ''; // Si no hay qrCodeUrl, lo dejamos vacío
      }
    });
  }

  async generarCodigoQR() {
    if (!this.claseSeleccionada || !this.asignaturaId || !this.seccion?.nombre) {
      console.error('Debe seleccionar una clase.');
      return;
    }

    const datosClase = {
      asignatura: this.asignaturaId,
      seccion: this.seccion.nombre,
      clase: this.claseSeleccionada,
      fecha: new Date().toISOString(),
      docenteId: this.docenteId
    };

    try {
      const claseRef = this.obtenerClaseFirestore(this.asignaturaId, this.claseSeleccionada);
      const claseData = await claseRef.get().toPromise();

      if (claseData && claseData.exists && claseData.data()?.['qrCodeUrl']) {
        console.log('Código QR ya existe para esta clase');
        await this.mostrarAlerta('Código QR existente', 'Ya existe un código QR generado para esta clase.');
        return;
      }

      // Genera el código QR
      this.qrCodeUrl = await QRCode.toDataURL(JSON.stringify(datosClase));

      await claseRef.set({
        ...datosClase,
        qrCodeUrl: this.qrCodeUrl
      });

      console.log('Código QR guardado y generado:', this.qrCodeUrl);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error generando o guardando el código QR:', error.message);
      } else {
        console.error('Error generando o guardando el código QR:', error);
      }
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}