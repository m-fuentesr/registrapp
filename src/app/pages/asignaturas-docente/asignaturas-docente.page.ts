import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute } from '@angular/router';

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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.obtenerAlumnos();
    this.route.queryParams.subscribe(params => {
      this.asignaturaId = params['asignaturaId'] || '';
      if (this.asignaturaId && params['seccion']) {
        this.obtenerSeccionYClases(params['seccion']);
      }
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.docenteId = user.uid;
      }
    });
  }

  async obtenerAlumnos() {
    this.firestore.collection('asistencia').valueChanges().subscribe((data: any) => {
      this.alumnos = data;
    });
  }

  obtenerSeccionYClases(seccionNombre: string) {
    this.firestore.collection('asignaturas').doc(this.asignaturaId).valueChanges().subscribe((asignatura: any) => {
      if (asignatura && asignatura.secciones) {
        this.asignaturaNombre = asignatura.nombre;
        const seccion = asignatura.secciones[seccionNombre];

        if (seccion) {
          this.seccion = seccion;
          this.clasesDisponibles = this.seccion.clases || [];
          this.totalClases = this.clasesDisponibles.length;
        } else {
          console.error('Sección no encontrada.');
        }
      } else {
        console.error('No se encontró la asignatura o el campo "secciones" no existe.');
      }
    });
  }

  generarCodigoQR() {
    if (!this.claseSeleccionada || !this.asignaturaId || !this.seccion.nombre) {
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

    QRCode.toDataURL(JSON.stringify(datosClase))
      .then(url => {
        this.qrCodeUrl = url;
        console.log('Código QR generado:', url);
      })
      .catch(err => {
        console.error('Error generando el código QR:', err);
      });
  }
}